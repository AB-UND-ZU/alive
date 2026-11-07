import { disposeSequence } from "../engine/systems/map";
import { createViewpoint } from "../engine/entities";
import { none } from "../game/assets/sprites";
import { normalize } from "../game/math/std";
import { spawnArea } from "../game/levels/island/areas";
import { createPopup } from "../engine/systems/popup";
import { purchasableItems, getItemBuyPrice } from "../game/balancing/trading";
import { commandItems } from "../game/assets/commands";
import { createAreaWorld, assertHero } from "../testing/harness";
import { createCell, populateInventory } from "../bindings/creation";
import { preloadLevel } from "../engine/ecs";
import { getClassData, ClassKey } from "../game/balancing/classes";
import { SPRITE } from "../engine/components/sprite";
import { STATS } from "../engine/components/stats";
import { LIGHT } from "../engine/components/light";
import { SPAWNABLE } from "../engine/components/spawnable";
import { VIEWABLE } from "../engine/components/viewable";
import { calculateVision } from "../engine/systems/visibility";
import { Item } from "../engine/components/item";
import { setIdentifier } from "../engine/utils";

export const sceneDefinitions = {
  game: { title: "Game", keys: [] },
  interface: { title: "Interface", keys: [] },
  trading: {
    title: "Shop",
    keys: ["Enter"],
  },
  combat: {
    title: "Melee",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight", "ArrowRight"],
  },
  gear: { title: "Gear", keys: ["g"] },
  movement: {
    title: "Movement",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight"],
  },
  water: {
    title: "Water",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight", "ArrowRight"],
  },
  pushing: {
    title: "Containers",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight"],
  },
  classes: { title: "Character", keys: ["t"] },
  abilities: { title: "Spells", keys: ["ArrowRight", " "] },
  skills: {
    title: "Skills",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight", "Shift"],
  },
  harvesting: {
    title: "Tools",
    keys: ["Shift", "ArrowRight"],
  },
  farming: { title: "Planting", keys: ["Enter"] },
  fishing: {
    title: "Fishing",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight", "Shift", "ArrowRight"],
  },
  crafting: {
    title: "Crafting",
    keys: ["Enter"],
  },
  brewing: {
    title: "Brewing",
    keys: ["Enter"],
  },
  building: {
    title: "Building",
    keys: ["Shift"],
  },
  food: { title: "Food", keys: ["e"] },
  forging: { title: "Forging", keys: ["Enter"] },
  chat: { title: "Chat", keys: [] },
} as const;
export type SceneName = keyof typeof sceneDefinitions;

export const createPreviewWorld = (name: SceneName, option = "") => {
  const terrain =
    name === "water" || name === "fishing"
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
  const world = createAreaWorld(area, { size: 32 });
  const hero = world.assertComponents(assertHero(world), [
    STATS,
    SPAWNABLE,
    SPRITE,
    LIGHT,
    VIEWABLE,
    "INVENTORY",
    "POSITION",
  ]);
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
      { skill: "slash", material: "wood", amount: 1, bound: false }
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
    const target = createCell(world, { x: 6, y: 4 }, "dummy", "visible").cell;
    setIdentifier(world, target, "target");
  }
  const stations: Record<string, string> = {
    crafting: "bench",
    brewing: "kettle",
    forging: "anvil",
    farming: "soil_wet",
  };
  const station = stations[name];
  if (station) createCell(world, { x: 3, y: 4 }, station, "visible");
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
  if (
    ["crafting", "brewing", "building", "forging", "farming"].includes(name)
  ) {
    for (const stackable of [
      "stick",
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
  if (name !== "interface") {
    for (let y = -2; y <= 10; y++)
      for (let x = -4; x <= 16; x++) {
        if (x !== -4 && x !== 16 && y !== -2 && y !== 10) continue;
        const wall = createCell(
          world,
          { x: normalize(x, 32), y: normalize(y, 32) },
          "mountain",
          "visible"
        ).cell;
        wall[SPRITE] = none;
      }
  }
  createViewpoint(world, {
    POSITION: name === "interface" ? { x: 4, y: 4 } : { x: 6, y: 4 },
    VIEWABLE: { active: true, priority: 80, spring: { duration: 0 } },
    RENDERABLE: { generation: 0 },
  });
  preloadLevel(world);
  if (name === "interface" && hero.SEQUENCABLE?.states.message)
    disposeSequence(world, hero, "message");
  return world;
};
