import { openSpriteBuilder } from "../game/assets/spriteBuilder";
import { disposeSequence } from "../engine/systems/map";
import { createItemAsDrop } from "../engine/systems/drop";
import { getItemSprite } from "../game/assets/utils";
import { createItem, createViewpoint } from "../engine/entities";
import { none } from "../game/assets/sprites";
import { normalize } from "../game/math/std";
import { spawnArea } from "../game/levels/island/areas";
import { createPopup } from "../engine/systems/popup";
import { purchasableItems, getItemBuyPrice } from "../game/balancing/trading";
import { commandItems } from "../game/assets/commands";
import { createAreaWorld, assertHero, act } from "../testing/harness";
import {
  createCell,
  populateInventory,
  assignBuilding,
} from "../bindings/creation";
import { preloadLevel } from "../engine/ecs";
import { initializeArea } from "../engine/systems/initialize";
import { getClassData, ClassKey } from "../game/balancing/classes";
import { SPRITE } from "../engine/components/sprite";
import { STATS } from "../engine/components/stats";
import { LIGHT } from "../engine/components/light";
import { SPAWNABLE } from "../engine/components/spawnable";
import { VIEWABLE } from "../engine/components/viewable";
import { calculateVision, getEntityVision } from "../engine/systems/visibility";
import { Item } from "../engine/components/item";
import { setIdentifier } from "../engine/utils";

export const sceneDefinitions = {
  clients: {
    title: "Renderer",
    instruction:
      "Move with the arrow keys, cast with Space, or press Enter at the workbench.",
    keys: ["ArrowRight", "ArrowRight", " ", "ArrowLeft", "ArrowLeft"],
  },
  game: {
    title: "Game",
    instruction: "Choose a preset below, then use the normal game controls.",
    keys: [],
  },
  interface: {
    title: "Interface",
    instruction: "The labels identify the game controls.",
    keys: [],
  },
  touch: {
    title: "Touch",
    instruction: "Tap CRAFT to open the workbench, or drag to move.",
    keys: [],
  },
  trading: {
    title: "Shop",
    instruction: "Press Enter to open the trader, then choose Buy or Sell.",
    keys: ["Enter"],
  },
  combat: {
    title: "Melee",
    instruction: "Move right into the enemy to attack with the equipped sword.",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight", "ArrowRight"],
  },
  gear: {
    title: "Gear",
    instruction: "Press G to inspect the equipped gear.",
    keys: ["g"],
  },
  movement: {
    title: "Movement",
    instruction:
      "Follow the maze, collect the Apple, then leave through the opening on the right.",
    keys: [],
  },
  water: {
    title: "Water",
    instruction:
      "Follow the path to the beach, or cross the ice and other ground.",
    keys: Array.from({ length: 8 }, () => "ArrowRight"),
  },
  light: {
    title: "Vision",
    instruction: "Move right to see how the mountain blocks sight.",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight"],
  },
  structures: {
    title: "House",
    instruction: "Enter the house, then move up to the workbench.",
    keys: ["Enter", "ArrowUp", "ArrowUp"],
  },
  pushing: {
    title: "Containers",
    instruction: "Move right into the box to push it toward the wall.",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight"],
  },
  classes: {
    title: "Character",
    instruction: "Press T to inspect this class's stats.",
    keys: ["t"],
  },
  abilities: {
    title: "Spells",
    instruction: "Face right, then press Space to cast the selected spell.",
    keys: ["ArrowRight", " "],
  },
  skills: {
    title: "Skills",
    instruction: "Face right, then press Shift to use the selected skill.",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight", "Shift"],
  },
  harvesting: {
    title: "Tools",
    instruction: "Press Shift, then a direction to use the selected tool.",
    keys: ["Shift", "ArrowRight"],
  },
  farming: {
    title: "Planting",
    instruction: "Press Enter to plant in the prepared soil.",
    keys: ["Enter"],
  },
  fishing: {
    title: "Fishing",
    instruction:
      "Face the water, press Shift, then choose a direction to cast.",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight", "Shift", "ArrowRight"],
  },
  crafting: {
    title: "Crafting",
    instruction: "Press Enter to open the workbench recipes.",
    keys: ["Enter"],
  },
  brewing: {
    title: "Brewing",
    instruction: "Press Enter to open the kettle and choose a recipe.",
    keys: ["Enter", "Enter", "Enter"],
  },
  building: {
    title: "Building",
    instruction: "Press Shift to open the available building plans.",
    keys: ["Shift"],
  },
  food: {
    title: "Food",
    instruction: "Press E to inspect and use the carried food.",
    keys: ["e"],
  },
  forging: {
    title: "Forging",
    instruction: "Choose the wood sword, then Iron, to preview its upgrade.",
    keys: ["Enter", "Enter", "ArrowDown", "Enter"],
  },
  sprites: {
    title: "Sprite Builder",
    instruction:
      "Edit a sprite, add a layer, then choose its color and character.",
    keys: [],
  },
  chat: {
    title: "Chat",
    instruction:
      "Type a command; Tab or a right swipe accepts the gray suggestion.",
    keys: [],
  },
} as const;
export type SceneName = keyof typeof sceneDefinitions;
export const sceneLayout = (name: SceneName) => {
  const topHudRows =
    name === "game" || name === "interface"
      ? 4
      : name === "clients"
      ? 2
      : name === "abilities" || name === "food"
      ? 1
      : 0;
  const rows = name === "game" || name === "interface" ? 20 : 18 + topHudRows;
  return { topHudRows, rows, height: rows * 32 };
};

export const movementGoals = [
  { x: 11, y: 1 },
  { x: 14, y: 1 },
] as const;
export const movementArea = `
|█████████████|
|█     █      |
|█ ███ █ ███ █|
|█   █   █   █|
|███ █████ ███|
|█   █     █ █|
|█ ███ ███ █ █|
|█♀    █     █|
|█████████████|`;
const terrainArea = `
|███%%%++░░~≈≈|
|██%%%%+░░░~≈≈|
|█%%%%+,,░░~≈≈|
|%%%%+,,▒░░~≈≈|
|,,♀▒▒▒▒▒░░~≈≈|
|,,,,,,,▒░░~≈≈|
|,,, ,,,,░░~≈≈|
|,,,,,,,░░░~≈≈|
|,,,,,,░░░░~≈≈|`;

const createClientWorld = () => {
  const rows: string[][] = Array.from({ length: 15 }, (_, y) =>
    Array.from({ length: 23 }, (_, x) =>
      y === 0 || y === 14 || x === 0 || x === 22 ? "█" : ","
    )
  );
  rows[7][8] = "♀";
  const world = createAreaWorld(
    rows.map((row) => `|${row.join("")}|`).join("\n"),
    { size: 96 }
  );
  const hero = world.assertComponents(assertHero(world), [
    STATS,
    SPAWNABLE,
    SPRITE,
    LIGHT,
    VIEWABLE,
    "INVENTORY",
    "POSITION",
  ]);
  const data = getClassData("rogue");
  Object.assign(hero[STATS]!, data.stats, {
    hp: data.stats.maxHp,
    mp: data.stats.maxMp,
  });
  hero[SPRITE] = data.sprite;
  hero[SPAWNABLE]!.classKey = "rogue";
  hero[LIGHT] = calculateVision(7);
  for (let x = 4; x <= 16; x++)
    createCell(world, { x, y: 7 }, "path", "hidden");
  for (let y = 2; y <= 12; y++) {
    for (let x = 18; x <= 21; x++)
      createCell(
        world,
        { x, y },
        x === 18 ? "water_shallow" : "water_deep",
        "hidden"
      );
    if (y >= 4 && y <= 10)
      createCell(world, { x: 15, y }, "mountain", "hidden");
  }
  createCell(world, { x: 5, y: 4 }, "tree", "hidden");
  createCell(world, { x: 6, y: 10 }, "bush", "hidden");
  createCell(world, { x: 10, y: 5 }, "bench", "hidden");
  createCell(world, { x: 12, y: 7 }, "dummy", "hidden");
  createCell(world, { x: 13, y: 10 }, "woodChest", "hidden");
  populateInventory(
    world,
    hero,
    [
      { stackable: "charge", amount: 20 },
      { stackable: "apple", amount: 3 },
      { stackable: "stick", amount: 10 },
      { stackable: "leaf", amount: 10 },
    ],
    [
      { weapon: "sword", material: "wood", amount: 1, bound: false },
      {
        spell: "wave",
        material: "wood",
        element: "fire",
        amount: 1,
        bound: false,
      },
      { skill: "slash", material: "wood", amount: 1, bound: false },
      { ...commandItems.compass, amount: 1, bound: false },
    ]
  );
  createViewpoint(world, {
    POSITION: { x: 11, y: 7 },
    VIEWABLE: { active: true, priority: 80, spring: { duration: 0 } },
    RENDERABLE: { generation: 0 },
  });
  initializeArea(world, { x: 0, y: 0 }, { x: 22, y: 14 });
  preloadLevel(world);
  return world;
};

export const createPreviewWorld = (name: SceneName, option = "") => {
  if (name === "clients") return createClientWorld();
  const terrain =
    name === "movement"
      ? movementArea
      : name === "water"
      ? terrainArea
      : name === "structures"
      ? `
|             |
|   ╒╦╦╦╦╕    |
|   ╠╬╬╬╬╣    |
|   ╞╪╪╪╪╡    |
|   └G┴─┴┘    |
|    ♀        |
|             |
|             |`
      : name === "fishing"
      ? `
|             |
|      ~≈≈≈≈≈ |
|      ~≈≈≈≈≈ |
|      ~≈≈≈≈≈ |
|  ♀   ~≈≈≈≈≈ |
|      ~≈≈≈≈≈ |
|      ~≈≈≈≈≈ |
|             |`
      : name === "pushing"
      ? `
|             |
|             |
|             |
|             |
|  ♀ ■    █   |
|             |
|             |
|             |`
      : `
|             |
|             |
|             |
|             |
|  ♀      █   |
|             |
|             |
|             |`;
  const area =
    name === "interface"
      ? spawnArea
          .split("\n")
          .map((row) => `|${row}|`)
          .join("\n")
      : terrain;
  const world = createAreaWorld(area, {
    size: 32,
    ...(name === "light" ? { level: "LEVEL_ISLAND" as const } : {}),
  });
  const hero = world.assertComponents(assertHero(world), [
    STATS,
    SPAWNABLE,
    SPRITE,
    LIGHT,
    VIEWABLE,
    "INVENTORY",
    "POSITION",
  ]);
  if (name === "movement") {
    const apple = createItemAsDrop(
      world,
      { ...movementGoals[0] },
      createItem,
      {
        ITEM: { stackable: "apple", amount: 1, bound: false },
        SPRITE: getItemSprite({ stackable: "apple" }),
      },
      false
    );
    setIdentifier(world, apple, "maze_apple");
    for (let x = 13; x <= 16; x++)
      for (let y = 0; y <= 2; y++)
        createCell(world, { x, y }, "grass", "hidden");
  }
  if (name === "water") {
    for (let y = -2; y <= 10; y++)
      for (let x = -4; x <= 16; x++) {
        if (x >= 0 && x <= 12 && y >= 0 && y <= 8) continue;
        const cell =
          x >= 11
            ? "water_deep"
            : x === 10
            ? "water_shallow"
            : x === 9
            ? "beach"
            : x === 8
            ? "sand"
            : x < 3 && y < 1
            ? "mountain"
            : "grass";
        createCell(
          world,
          { x: normalize(x, 32), y: normalize(y, 32) },
          cell,
          "visible"
        );
      }
    for (let y = 0; y < 9; y++)
      createCell(world, { x: 9, y }, "beach", "visible");
    createCell(world, { x: 4, y: 6 }, "rubble", "visible");
    createCell(world, { x: 5, y: 6 }, "soil", "visible");
    createCell(world, { x: 6, y: 6 }, "soil_wet", "visible");
  }
  const data = getClassData(
    name === "classes" && option ? (option as ClassKey) : "rogue"
  );
  Object.assign(hero[STATS], data.stats, {
    hp: data.stats.maxHp,
    mp: data.stats.maxMp,
  });
  hero[SPRITE] = data.sprite;
  hero[SPAWNABLE].classKey =
    name === "classes" && option ? (option as ClassKey) : "rogue";
  hero[LIGHT] = calculateVision(6);
  hero[VIEWABLE].active = true;
  setIdentifier(world, hero, "hero");
  const equipment: Omit<Item, "carrier">[] = [];
  const items: Omit<Item, "bound" | "carrier">[] = [];
  if (name === "structures") {
    createCell(world, { x: 7, y: 2 }, "bench", "hidden");
    assignBuilding(world, { x: 6, y: 2 });
    items.push({ consume: "key", material: "wood", amount: 1 });
  }
  if (name === "light") {
    for (let y = 0; y < 9; y++)
      for (let x = 0; x < 14; x++)
        createCell(world, { x, y }, "grass", "hidden");
    for (let y = 2; y < 7; y++)
      createCell(world, { x: 8, y }, "mountain", "hidden");
    createCell(world, { x: 10, y: 4 }, "tree", "hidden");
    equipment.push({ ...commandItems.torch, amount: 1, bound: false });
  }
  if (name === "forging")
    items.push(
      { weapon: "sword", material: "wood", amount: 1 },
      { stackable: "resource", material: "iron", amount: 99 }
    );
  if (["skills", "forging", "combat", "gear"].includes(name)) {
    equipment.push({
      weapon: "sword",
      material: "wood",
      amount: 1,
      bound: false,
    });
  }
  if (name === "interface") {
    equipment.push(
      { weapon: "sword", material: "wood", amount: 1, bound: false },
      {
        spell: "wave",
        material: "wood",
        element: "fire",
        amount: 1,
        bound: false,
      },
      { skill: "slash", material: "wood", amount: 1, bound: false },
      { ...commandItems.compass, amount: 1, bound: false },
      { ...commandItems.map, amount: 1, bound: false }
    );
    items.push(
      { stackable: "charge", amount: 5 },
      { stackable: "apple", amount: 3 }
    );
  }
  if (name === "abilities")
    equipment.push({
      spell: (option || "wave") as Item["spell"],
      material: "wood",
      element: "fire",
      amount: 1,
      bound: false,
    });
  if (["abilities", "skills", "chat", "combat"].includes(name)) {
    const target = createCell(
      world,
      { x: name === "abilities" && option === "trap" ? 4 : 6, y: 4 },
      "dummy",
      "visible"
    ).cell;
    setIdentifier(world, target, "target");
  }
  const stations: Record<string, string> = {
    crafting: "bench",
    touch: "bench",
    brewing: "kettle",
    forging: "anvil",
    farming: "soil_wet",
  };
  const station = stations[name];
  if (station)
    createCell(
      world,
      { x: name === "touch" ? 1 : 3, y: 4 },
      station,
      "visible"
    );
  if (name === "skills") {
    equipment.push({
      ...commandItems[option || "slash"],
      material: "wood",
      amount: 1,
      bound: false,
    });
    items.push(
      { stackable: "charge", amount: 99 },
      { stackable: "arrow", amount: 99 }
    );
  }
  if (name === "harvesting") {
    equipment.push({
      tool: (option || "axe") as Item["tool"],
      material: "wood",
      amount: 1,
      bound: false,
    });
    createCell(
      world,
      { x: 3, y: 4 },
      option === "pickaxe" ? "mountain" : option === "shovel" ? "sand" : "tree",
      "visible"
    );
  }
  if (name === "fishing") {
    equipment.push({ tool: "hook", material: "wood", amount: 1, bound: false });
    items.push({ stackable: "worm", amount: 20 });
    createCell(world, { x: 7, y: 4 }, "fish", "visible");
  }
  if (name === "building")
    equipment.push({
      tool: "hammer",
      material: "iron",
      amount: 1,
      bound: false,
    });
  if (["crafting", "brewing", "building", "farming", "touch"].includes(name)) {
    for (const stackable of [
      "stick",
      "leaf",
      "ore",
      "berry",
      "flower",
      "grain",
      "sand",
      "gravel",
      "plank",
    ] as const)
      items.push({ stackable, amount: 99 });
    items.push(
      { stackable: "resource", material: "wood", amount: 99 },
      { stackable: "resource", material: "iron", amount: 99 }
    );
  }
  if (name === "food") {
    hero[STATS].hp = 10;
    items.push(
      { stackable: "apple", amount: 5 },
      { stackable: "shroom", amount: 5 }
    );
  }
  if (name === "trading") {
    const merchant = createCell(
      world,
      { x: 3, y: 4 },
      "earthTrader",
      "visible"
    ).cell;
    if (merchant.BEHAVIOUR) merchant.BEHAVIOUR.patterns = [];
    createPopup(world, merchant, {
      tabs: ["buy", "sell"],
      deals: purchasableItems.map((item) => ({
        item: { ...item, amount: 1 },
        stock: 9,
        prices: getItemBuyPrice(item),
      })),
    });
    items.push(
      { stackable: "coin", amount: 99 },
      { stackable: "apple", amount: 5 }
    );
  }
  populateInventory(world, hero, items, equipment);
  if (name === "light") hero[LIGHT] = getEntityVision(world, hero);
  if (name !== "interface") {
    for (let y = -3; y <= 11; y++)
      for (let x = -5; x <= 17; x++) {
        if (x !== -5 && x !== 17 && y !== -3 && y !== 11) continue;
        const wall = createCell(
          world,
          { x: normalize(x, 32), y: normalize(y, 32) },
          "mountain",
          "visible"
        ).cell;
        wall[SPRITE] = none;
        world.removeComponentFromEntity(
          world.assertComponents(wall, ["HARVESTABLE"]),
          "HARVESTABLE"
        );
      }
  }
  createViewpoint(world, {
    POSITION: name === "interface" ? { ...hero.POSITION } : { x: 6, y: 4 },
    VIEWABLE: { active: true, priority: 80, spring: { duration: 0 } },
    RENDERABLE: { generation: 0 },
  });
  if (name !== "interface" && name !== "light")
    initializeArea(world, { x: 0, y: 0 }, { x: 31, y: 31 });
  preloadLevel(world);
  if (name !== "interface") {
    for (const entity of world.getEntities(["POSITION", "FOG"])) {
      const x = normalize(entity.POSITION.x + 5, 32) - 5;
      const y = normalize(entity.POSITION.y + 3, 32) - 3;
      if (
        !["light", "movement"].includes(name) ||
        ((x === -5 || x === 17 || y === -3 || y === 11) &&
          x >= -5 &&
          x <= 17 &&
          y >= -3 &&
          y <= 11)
      ) {
        entity.FOG.visibility = "visible";
        entity.FOG.fixed =
          entity.FOG.type === "air" ||
          !(entity.LAYER || entity.STRUCTURABLE || entity.FRAGMENT);
      }
    }
  }
  if (name === "interface" && hero.SEQUENCABLE?.states.message)
    disposeSequence(world, hero, "message");
  if (name === "chat") act(world, "chat");
  if (name === "sprites") openSpriteBuilder(world, hero);
  return world;
};
