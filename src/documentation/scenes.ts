import {
  createAreaWorld,
  assertHero,
  holdMove,
  step,
} from "../testing/harness";
import { World } from "../engine";
import { getHasteInterval } from "../engine/systems/movement";
import { getEntityStats } from "../engine/systems/damage";
import { FRAME } from "../testing/harness";
import { POSITION } from "../engine/components/position";
import { SPRITE, Sprite } from "../engine/components/sprite";
import { ORIENTABLE, Orientation } from "../engine/components/orientable";
import { STATS } from "../engine/components/stats";
import { Item } from "../engine/components/item";
import { getFacingLayers } from "../game/assets/ui";
import { getItemSprite } from "../game/assets/utils";
import { classDefinitions } from "../game/balancing/classes";
import { craftingIngredients } from "../game/balancing/crafting";
import { brewingRecipes } from "../game/balancing/brewing";
import { buildConstructions } from "../game/balancing/building";
import {
  getHarvestConfig,
  harvestTools,
  plantConfigs,
  harvestDurationFactor,
} from "../game/balancing/harvesting";
import { fishingDistributionLevels } from "../game/balancing/fishing";
import { getAbilityStats } from "../game/balancing/abilities";
import { getForgeOptions } from "../game/balancing/forging";
import { stackableConsumptions } from "../engine/systems/consume";

export type Scene = {
  title: string;
  hint: string;
  render: (screen: HTMLElement) => void;
  play: () => void;
  move?: (orientation: Orientation) => void;
  options?: string[];
  select?: (index: number) => void;
};

export const spriteElement = (sprite: Sprite, orientation?: Orientation) => {
  const cell = document.createElement("span");
  cell.className = "sprite";
  cell.title = sprite.name;
  cell.setAttribute("aria-label", sprite.name);
  for (const layer of getFacingLayers(sprite, orientation)) {
    const span = document.createElement("span");
    span.textContent = layer.char;
    span.style.color = layer.color;
    span.setAttribute("aria-hidden", "true");
    cell.append(span);
  }
  return cell;
};
const text = (screen: HTMLElement, value: string, className = "") => {
  const paragraph = document.createElement("p");
  paragraph.textContent = value;
  paragraph.className = className;
  screen.append(paragraph);
};
const itemRow = (screen: HTMLElement, item: Partial<Item>, prefix = "") => {
  const sprite = getItemSprite(item, "display");
  const row = document.createElement("div");
  row.className = "item-row";
  row.append(
    spriteElement(sprite),
    document.createTextNode(`${prefix}${item.amount ?? 1} × ${sprite.name}`)
  );
  screen.append(row);
};
const catalog = (
  title: string,
  options: string[],
  render: (screen: HTMLElement, index: number) => void
): Scene => {
  let index = 0;
  return {
    title,
    options,
    hint: "Choose an entry or press Play to see the next one. Auto cycles through the entries.",
    play: () => {
      index = (index + 1) % options.length;
    },
    select: (value) => {
      index = value;
    },
    render: (screen) => {
      screen.dataset.index = String(index);
      render(screen, index);
    },
  };
};

const areas: Record<string, { title: string; area: string }> = {
  movement: {
    title: "Walking and walls",
    area: `
|           |
|           |
| ♀    █    |
|           |
|           |`,
  },
  water: {
    title: "Shallow and deep water",
    area: `
|   ~≈≈≈≈   |
|   ~≈≈≈≈   |
| ♀ ~≈≈≈≈   |
|   ~≈≈≈≈   |
|   ~≈≈≈≈   |`,
  },
  pushing: {
    title: "Push a crate",
    area: `
|           |
|           |
| ♀ ■   █   |
|           |
|           |`,
  },
};
const worldScene = (id: string): Scene => {
  const { title, area } = areas[id];
  const world: World = createAreaWorld(area);
  let direction: Orientation = "right";
  let count = 0;
  const move = (orientation: Orientation) => {
    direction = orientation;
    holdMove(world, [direction]);
    const hero = assertHero(world);
    const start = { ...hero[POSITION] };
    const interval = getHasteInterval(world, getEntityStats(world, hero).haste);
    for (let frame = 0; frame < Math.ceil((interval * 2) / FRAME); frame += 1) {
      step(world);
      if (hero[POSITION].x !== start.x || hero[POSITION].y !== start.y) break;
    }
    holdMove(world, []);
    count += 1;
  };
  return {
    title,
    hint: "A live game world, drawn with HTML sprites. Play walks right. Use the direction buttons to explore.",
    play: () => move("right"),
    move,
    render(screen) {
      const grid = document.createElement("div");
      grid.className = "scene-grid";
      grid.style.setProperty("--columns", "11");
      const positioned = world.getEntities([POSITION, SPRITE]);
      for (let y = 0; y < 5; y += 1) {
        for (let x = 0; x < 11; x += 1) {
          const cell = document.createElement("span");
          cell.className = "sprite";
          for (const entity of positioned) {
            if (entity[POSITION].x !== x || entity[POSITION].y !== y) continue;
            const sprite = spriteElement(
              entity[SPRITE],
              entity[ORIENTABLE]?.facing
            );
            for (const layer of Array.from(sprite.children)) cell.append(layer);
          }
          grid.append(cell);
        }
      }
      screen.append(grid);
      const hero = assertHero(world);
      screen.dataset.x = String(hero[POSITION].x);
      screen.dataset.y = String(hero[POSITION].y);
      screen.dataset.steps = String(count);
      const stats = world.assertComponents(hero, [STATS])[STATS];
      text(
        screen,
        `Position ${hero[POSITION].x}, ${hero[POSITION].y} · Health ${Math.ceil(
          stats.hp
        )}/${stats.maxHp}`,
        "scene-status"
      );
    },
  };
};

export const createScene = (id: string): Scene => {
  if (id in areas) return worldScene(id);
  if (id === "classes") {
    const keys = Object.keys(
      classDefinitions
    ) as (keyof typeof classDefinitions)[];
    return catalog("Class definitions", keys, (screen, index) => {
      const key = keys[index];
      const { sprite, stats } = classDefinitions[key];
      screen.append(spriteElement(sprite));
      text(
        screen,
        `${
          key === "rogue" ? "Playable" : "Restricted in normal class selection"
        }: ${sprite.name}`,
        "scene-status"
      );
      text(
        screen,
        `HP ${stats.maxHp} · MP ${stats.maxMp} · Power ${stats.power} · Wisdom ${stats.wisdom} · Armor ${stats.armor} · Resist ${stats.resist} · Haste ${stats.haste}`
      );
    });
  }
  if (id === "abilities") {
    const spells = ["wave", "beam", "trap", "dash", "bolt", "blast"] as const;
    return catalog("Spell reference", [...spells], (screen, index) => {
      const item = { spell: spells[index], material: "wood" as const };
      const stats = getAbilityStats(item);
      itemRow(screen, item);
      text(
        screen,
        "Wood material, no element. These are spell values before the caster's stats."
      );
      text(
        screen,
        Object.entries(stats)
          .filter(([, value]) => value !== 0)
          .map(([key, value]) => `${key}: ${value}`)
          .join(" · "),
        "scene-status"
      );
    });
  }
  if (id === "crafting")
    return catalog(
      "Workbench recipes",
      craftingIngredients.map(({ item }) => getItemSprite(item).name),
      (screen, index) => {
        const recipe = craftingIngredients[index];
        text(screen, "Ingredients");
        recipe.parts.forEach((item) => itemRow(screen, item));
        text(screen, "Result", "scene-status");
        itemRow(screen, recipe.item);
      }
    );
  if (id === "brewing")
    return catalog(
      "Kettle recipes",
      brewingRecipes.map(
        ({ item }, index) => `${index + 1}. ${getItemSprite(item).name}`
      ),
      (screen, index) => {
        const recipe = brewingRecipes[index];
        recipe.options.forEach((parts, option) => {
          text(screen, `Ingredient option ${option + 1}`);
          parts.forEach((item) => itemRow(screen, item));
        });
        text(screen, "Result", "scene-status");
        itemRow(screen, recipe.item);
      }
    );
  if (id === "forging") {
    const bases: Item[] = [
      {
        weapon: "sword",
        material: "wood",
        amount: 1,
        carrier: 0,
        bound: false,
      },
      {
        offhand: "shield",
        material: "wood",
        amount: 1,
        carrier: 0,
        bound: false,
      },
      { spell: "wave", material: "wood", amount: 1, carrier: 0, bound: false },
      {
        tool: "pickaxe",
        material: "wood",
        amount: 1,
        carrier: 0,
        bound: false,
      },
    ];
    return catalog(
      "Forge upgrades",
      bases.map((item) => getItemSprite(item).name),
      (screen, index) => {
        text(screen, "Starting item");
        itemRow(screen, bases[index]);
        getForgeOptions(bases[index]).forEach((option) => {
          text(screen, "Add", "scene-status");
          itemRow(screen, option.add);
          itemRow(screen, option.result, "Result: ");
        });
      }
    );
  }
  if (id === "building")
    return catalog(
      "Construction plans",
      buildConstructions.map(({ sprite }) => sprite.name),
      (screen, index) => {
        const plan = buildConstructions[index];
        screen.append(spriteElement(plan.sprite));
        text(
          screen,
          `Hammer level ${plan.level} · Ground: ${plan.grounds.join(", ")}`,
          "scene-status"
        );
        plan.parts.forEach((item) => itemRow(screen, item));
        text(screen, `Work required: ${plan.effort}`);
      }
    );
  if (id === "harvesting") {
    const resources = [
      "tree",
      "oak",
      "palm",
      "mountain",
      "iron",
      "gold",
      "grass",
      "berry",
      "flower",
      "sand",
      "path",
    ] as const;
    return catalog("Gathering reference", [...resources], (screen, index) => {
      const resource = resources[index];
      const config = getHarvestConfig(resource);
      itemRow(screen, { tool: harvestTools[resource], material: "wood" });
      text(
        screen,
        `${resource} · Work required: ${config.harvestable.maximum}`,
        "scene-status"
      );
      config.yields.forEach((item) => itemRow(screen, item, "Drop: "));
    });
  }
  if (id === "farming") {
    const entries = Object.entries(plantConfigs);
    return catalog(
      "Planting reference",
      entries.map(([key]) => key),
      (screen, index) => {
        const [key, config] = entries[index];
        itemRow(screen, { stackable: key as Item["stackable"] });
        text(
          screen,
          `Typical growth: about ${
            config.duration * harvestDurationFactor
          } world ticks`,
          "scene-status"
        );
        if (config.crop) itemRow(screen, config.crop, "Crop: ");
        if (config.cell) text(screen, `Grows into: ${config.cell}`);
      }
    );
  }
  if (id === "fishing")
    return catalog(
      "Fishing catches",
      ["Level 1", "Level 2", "Level 3"],
      (screen, index) => {
        text(
          screen,
          `Catch distribution for level ${index + 1}`,
          "scene-status"
        );
        fishingDistributionLevels[index + 1].forEach(([weight, item]) =>
          itemRow(screen, item, `${weight}% · `)
        );
      }
    );
  if (id === "food") {
    const entries = Object.entries(stackableConsumptions);
    return catalog(
      "Food and other usable items",
      entries.map(([key]) => key),
      (screen, index) => {
        const [key, value] = entries[index];
        itemRow(screen, { stackable: key as Item["stackable"] });
        text(
          screen,
          `${value.amount > 0 ? "+" : ""}${value.amount}${
            value.percentage ? "%" : ""
          } ${value.countable.toUpperCase()}`,
          "scene-status"
        );
      }
    );
  }
  throw new Error(`Unknown scene: ${id}`);
};
