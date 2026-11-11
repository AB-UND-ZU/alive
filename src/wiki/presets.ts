import { createRng } from "../game/math/rng";
import { createTestWorld, assertHero } from "../testing/harness";
import { populateInventory } from "../bindings/creation";
import { LEVEL, LevelName } from "../engine/components/level";
import { Item } from "../engine/components/item";
import { getIdentifierAndComponents } from "../engine/utils";
import { getClassData } from "../game/balancing/classes";
import { getLevelStats } from "../engine/systems/leveling";
import { getEntityVision } from "../engine/systems/visibility";
import { disposeEntity, moveEntity } from "../engine/systems/map";
import { findAdjacentDroppable } from "../engine/systems/drop";
import { initializeCell } from "../engine/systems/initialize";
import { preloadLevel } from "../engine/ecs";
import { normalize } from "../game/math/std";
import { up4Center } from "../game/levels/tutorial/areas";
import { commandItems } from "../game/assets/commands";

export const presets = {
  menu: {
    title: "Menu",
    description: "Start or continue.",
    level: "LEVEL_MENU",
  },
  dungeon: {
    title: "Dungeon",
    description: "Begin the tutorial.",
    level: "LEVEL_TUTORIAL",
  },
  bandit: {
    title: "Bandit Boss",
    description: "Fight at the final gate.",
    level: "LEVEL_TUTORIAL",
  },
  island: {
    title: "Island",
    description: "Continue after the Dungeon.",
    level: "LEVEL_ISLAND",
  },
  earth: {
    title: "Earth Town",
    description: "Visit Earth Town.",
    level: "LEVEL_ISLAND",
    target: "earth_town",
  },
  ilex: {
    title: "Ilex Boss",
    description: "Fight in the forest.",
    level: "LEVEL_ISLAND",
    cell: "ilex_elite",
  },
  oak: {
    title: "Oak Boss",
    description: "Fight after the town quests.",
    level: "LEVEL_ISLAND",
    cell: "oak_boss",
  },
  haven: {
    title: "Fire Haven",
    description: "Visit Fire Haven.",
    level: "LEVEL_ISLAND",
    target: "fire_haven",
  },
  nomad: {
    title: "Nomad",
    description: "Visit the nomad's house.",
    level: "LEVEL_ISLAND",
    target: "nomad_house",
  },
  worm: {
    title: "Worm Boss",
    description: "Attack the bait worm.",
    level: "LEVEL_ISLAND",
    cell: "worm_bait",
  },
} as const;
export type PresetName = keyof typeof presets;

export const islandPreviewSeed = 2026;

export function getPresetLoadout(name: PresetName) {
  if (name === "menu") return { level: undefined, items: [], equipment: [] };
  const level =
    name === "dungeon" || name === "bandit"
      ? 1
      : name === "island" || name === "earth"
      ? 2
      : name === "ilex"
      ? 3
      : name === "oak"
      ? 4
      : name === "worm"
      ? 6
      : 5;
  const equipment: Omit<Item, "carrier">[] = [];
  const items: Omit<Item, "carrier" | "bound">[] = [];
  const equip = (item: Partial<Item>) =>
    equipment.push({ ...item, amount: 1, bound: false });
  const potion = (
    stat: "hp" | "mp",
    material: Item["material"],
    amount: number
  ) => items.push({ consume: "potion", stat, material, amount });
  if (name === "dungeon") return { level, items, equipment };
  equip({
    weapon: "sword",
    material: ["bandit", "island", "earth", "ilex"].includes(name)
      ? "wood"
      : name === "worm"
      ? "gold"
      : "iron",
  });
  if (["bandit", "island", "earth", "ilex"].includes(name)) {
    potion("hp", "wood", 10);
    items.push(
      { stackable: "apple", amount: 3 },
      { stackable: "banana", amount: 2 }
    );
    if (name === "island")
      items.push(
        { stackable: "resource", material: "iron", amount: 1 },
        { stackable: "coin", amount: 5 }
      );
    if (name === "earth" || name === "ilex") {
      equip(commandItems.compass);
      equip({ tool: "axe", material: "wood" });
    }
    if (name === "ilex") equip({ spell: "wave", material: "wood" });
  } else {
    const worm = name === "worm",
      nomad = name === "nomad",
      haven = name === "haven";
    equip(commandItems.compass);
    equip({
      spell: nomad ? "wave" : haven ? "dash" : "beam",
      material: name === "oak" ? "wood" : "iron",
      ...(name !== "oak" ? { element: "earth" as const } : {}),
    });
    equip({
      skill: worm ? "block" : haven ? "bow" : "slash",
      material: name === "oak" ? "wood" : "iron",
    });
    equip({
      tool: haven || nomad || worm ? "pickaxe" : "axe",
      material: "wood",
    });
    items.push({
      stackable: haven ? "arrow" : "charge",
      amount: name === "oak" ? 10 : 20,
    });
    potion("hp", nomad || worm ? "iron" : "wood", nomad || worm ? 30 : 20);
    potion("mp", nomad || worm ? "iron" : "wood", nomad || worm ? 20 : 10);
    if (haven || nomad) {
      equip({ accessory: "amulet", material: "wood" });
      equip(
        nomad ? commandItems.map : { accessory: "boots", material: "wood" }
      );
      items.push({ stackable: "resource", material: "gold", amount: 3 });
    }
    if (worm) {
      items.push(
        { tool: "hook", material: "wood", amount: 1 },
        { stackable: "worm", amount: 10 }
      );
    }
  }
  return { level, items, equipment };
}

export function createPresetWorld(name: PresetName) {
  const preset = presets[name];
  const nativeRandom = Math.random;
  let world: ReturnType<typeof createTestWorld>;
  try {
    Math.random = createRng(islandPreviewSeed);
    world = createTestWorld({ level: preset.level as LevelName });
  } finally {
    Math.random = nativeRandom;
  }
  if (name === "menu") return world;
  const hero = world.assertComponents(assertHero(world), [
    "INVENTORY",
    "POSITION",
    "STATS",
    "SPAWNABLE",
    "LIGHT",
  ]);
  for (const item of world.getEntities(["ITEM"]))
    if (item.ITEM.carrier === world.getEntityId(hero))
      disposeEntity(world, item, false);
  hero.INVENTORY.items = [];
  hero.EQUIPPABLE = {};
  const classData = getClassData("rogue", hero.SPAWNABLE.hairColor);
  hero.SPAWNABLE.classKey = "rogue";
  hero.SPRITE = classData.sprite;
  if (hero.SWIMMABLE) hero.SWIMMABLE.sprite = classData.swimming;
  const { level: levelNumber, items, equipment } = getPresetLoadout(name);
  const stats = getLevelStats("rogue", levelNumber!);
  Object.assign(hero.STATS, stats, {
    level: levelNumber,
    xp: 0,
    hp: stats.maxHp,
    mp: stats.maxMp,
  });
  populateInventory(world, hero, items, equipment);
  hero.LIGHT = getEntityVision(world, hero);
  const level = world.metadata.gameEntity[LEVEL];
  let target =
    name === "bandit"
      ? {
          x: normalize(up4Center.x, level.size),
          y: normalize(up4Center.y + 4, level.size),
        }
      : undefined;
  if ("target" in preset)
    target = getIdentifierAndComponents(world, preset.target, [
      "POSITION",
    ])?.POSITION;
  if ("cell" in preset) {
    for (let x = 0; x < level.size && !target; x++)
      for (let y = 0; y < level.size; y++)
        if (String(level.cells[x][y]) === preset.cell) {
          target = { x, y };
          break;
        }
  }
  if (name !== "island" && name !== "dungeon" && !target)
    throw new Error(`No start position for ${preset.title}`);
  if (target) {
    for (let dx = -4; dx <= 4; dx++)
      for (let dy = -4; dy <= 4; dy++)
        initializeCell(
          world,
          normalize(target.x + dx, level.size),
          normalize(target.y + dy, level.size)
        );
    const position = findAdjacentDroppable(world, target);
    moveEntity(world, hero, position);
    if (hero.SPAWNABLE) hero.SPAWNABLE.position = { ...position };
  }
  preloadLevel(world);
  return world;
}
