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
    description: "New game, Continue and controls.",
    level: "LEVEL_MENU",
  },
  dungeon: {
    title: "Dungeon",
    description: "Begin the Dungeon empty-handed at level 1.",
    level: "LEVEL_TUTORIAL",
  },
  bandit: {
    title: "Bandit Boss",
    description: "The Bandit's room with an iron sword, shield and bow.",
    level: "LEVEL_TUTORIAL",
  },
  island: {
    title: "Island",
    description:
      "Continue after the Dungeon at level 2 with a wood sword and supplies.",
    level: "LEVEL_ISLAND",
  },
  earth: {
    title: "Earth Town",
    description: "Town workshops with tools, coins and crafting supplies.",
    level: "LEVEL_ISLAND",
    target: "earth_town",
  },
  ilex: {
    title: "Ilex Boss",
    description: "Ilex encounter with an iron sword and fire wave.",
    level: "LEVEL_ISLAND",
    cell: "ilex_elite",
  },
  oak: {
    title: "Oak Boss",
    description:
      "Quest equipment at level 4: iron sword, beam, slash and wood potions.",
    level: "LEVEL_ISLAND",
    cell: "oak_boss",
  },
  worm: {
    title: "Worm Boss",
    description:
      "Level 6 with a gold sword, earth wave, iron bubble and exploration tools. Attack the small worm to begin.",
    level: "LEVEL_ISLAND",
    cell: "worm_bait",
  },
  haven: {
    title: "Fire Haven",
    description: "Haven workshops with iron gear and crafting supplies.",
    level: "LEVEL_ISLAND",
    target: "fire_haven",
  },
  nomad: {
    title: "Nomad",
    description: "The nomad's house with an axe, bow and trade supplies.",
    level: "LEVEL_ISLAND",
    target: "nomad_house",
  },
} as const;
export type PresetName = keyof typeof presets;

export const islandPreviewSeed = 2026;

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
  const levelNumber =
    name === "dungeon"
      ? 1
      : name === "island" || name === "bandit"
      ? 2
      : name === "oak"
      ? 4
      : name === "worm"
      ? 6
      : 3;
  const stats = getLevelStats("rogue", levelNumber);
  Object.assign(hero.STATS, stats, {
    level: levelNumber,
    xp: 0,
    hp: stats.maxHp,
    mp: stats.maxMp,
  });
  const equipment: Omit<Item, "carrier">[] = [];
  const items: Omit<Item, "carrier" | "bound">[] = [];
  const potion = (
    stat: "hp" | "mp",
    material: Item["material"],
    amount: number
  ) => items.push({ consume: "potion", stat, material, amount });
  if (name !== "dungeon")
    equipment.push({
      weapon: "sword",
      material: name === "island" ? "wood" : name === "worm" ? "gold" : "iron",
      amount: 1,
      bound: false,
    });
  if (name === "island") {
    potion("hp", "wood", 10);
    items.push(
      { stackable: "resource", material: "iron", amount: 1 },
      { stackable: "coin", amount: 5 },
      { stackable: "apple", amount: 3 },
      { stackable: "banana", amount: 2 }
    );
  } else if (name === "oak" || name === "worm") {
    const worm = name === "worm";
    equipment.push(
      { ...commandItems.compass, amount: 1, bound: false },
      {
        spell: worm ? "wave" : "beam",
        material: worm ? "iron" : "wood",
        ...(worm ? { element: "earth" as const } : {}),
        amount: 1,
        bound: false,
      },
      {
        skill: worm ? "block" : "slash",
        material: worm ? "iron" : "wood",
        amount: 1,
        bound: false,
      },
      {
        tool: worm ? "pickaxe" : "axe",
        material: "wood",
        amount: 1,
        bound: false,
      }
    );
    if (worm) {
      equipment.push({
        accessory: "boots",
        material: "iron",
        amount: 1,
        bound: false,
      });
      items.push(
        { tool: "hook", material: "wood", amount: 1 },
        { stackable: "worm", amount: 10 }
      );
    }
    items.push({ stackable: "charge", amount: worm ? 20 : 10 });
    potion("hp", worm ? "iron" : "wood", 20);
    potion("mp", worm ? "iron" : "wood", 10);
  } else if (name !== "dungeon") {
    equipment.push(
      { ...commandItems.compass, amount: 1, bound: false },
      { offhand: "shield", material: "iron", amount: 1, bound: false },
      {
        skill: name === "bandit" || name === "nomad" ? "bow" : "slash",
        material: "iron",
        amount: 1,
        bound: false,
      },
      { tool: "axe", material: "wood", amount: 1, bound: false }
    );
    if (name === "ilex")
      equipment.push({
        spell: "wave",
        material: "iron",
        element: "fire",
        amount: 1,
        bound: false,
      });
    items.push(
      { stackable: "coin", amount: 20 },
      { stackable: "apple", amount: 5 },
      { stackable: "charge", amount: 10 },
      { stackable: "arrow", amount: 20 },
      { stackable: "resource", material: "wood", amount: 10 }
    );
    potion("hp", "wood", 10);
    potion("mp", "wood", 5);
  }
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
