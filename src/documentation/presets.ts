import { createTestWorld, assertHero } from "../testing/harness";
import { populateInventory } from "../bindings/creation";
import { LEVEL, LevelName } from "../engine/components/level";
import { Item } from "../engine/components/item";
import { getIdentifierAndComponents } from "../engine/utils";
import { moveEntity } from "../engine/systems/map";
import { findAdjacentDroppable } from "../engine/systems/drop";
import { initializeCell } from "../engine/systems/initialize";
import { preloadLevel } from "../engine/ecs";
import { normalize } from "../game/math/std";
import { up4Center } from "../game/levels/tutorial/areas";
import { calculateVision } from "../engine/systems/visibility";

export const presets = {
  menu: {
    title: "Menu",
    description: "New game, Continue and controls.",
    level: "LEVEL_MENU",
  },
  dungeon: {
    title: "Dungeon",
    description: "Tutorial start with a wood sword and healing supplies.",
    level: "LEVEL_TUTORIAL",
  },
  bandit: {
    title: "Bandit Boss",
    description: "The Bandit's room with an iron sword, shield and bow.",
    level: "LEVEL_TUTORIAL",
  },
  island: {
    title: "Island",
    description: "Island start with an iron sword, map and harvesting tools.",
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
    description: "Oak encounter with a gold sword and fire beam.",
    level: "LEVEL_ISLAND",
    cell: "oak_boss",
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

export function createPresetWorld(name: PresetName) {
  const preset = presets[name];
  const world = createTestWorld({ level: preset.level as LevelName });
  if (name === "menu") return world;
  const hero = world.assertComponents(assertHero(world), [
    "INVENTORY",
    "POSITION",
    "STATS",
    "SPAWNABLE",
    "LIGHT",
  ]);
  const advanced = name !== "dungeon";
  const material = name === "oak" ? "gold" : advanced ? "iron" : "wood";
  const equipment: Omit<Item, "carrier">[] = [
    { weapon: "sword", material, amount: 1, bound: false },
    {
      skill: name === "bandit" || name === "nomad" ? "bow" : "slash",
      material,
      amount: 1,
      bound: false,
    },
    { accessory: "map", amount: 1, bound: false },
    { accessory: "compass", amount: 1, bound: false },
  ];
  if (advanced)
    equipment.push(
      { offhand: "shield", material, amount: 1, bound: false },
      { tool: "axe", material: "iron", amount: 1, bound: false }
    );
  if (name === "ilex" || name === "oak")
    equipment.push({
      spell: name === "oak" ? "beam" : "wave",
      material: "iron",
      element: "fire",
      amount: 1,
      bound: false,
    });
  populateInventory(
    world,
    hero,
    [
      { stackable: "apple", amount: 20 },
      { stackable: "coin", amount: 99 },
      { stackable: "arrow", amount: 99 },
      { stackable: "charge", amount: 99 },
      { consume: "potion", stat: "hp", material, amount: 10 },
      { stackable: "resource", material: "wood", amount: 99 },
      { stackable: "ore", amount: 99 },
      { tool: "pickaxe", material: "iron", amount: 1 },
      { tool: "hammer", material: "iron", amount: 1 },
    ],
    equipment
  );
  if (hero.STATS)
    Object.assign(hero.STATS, {
      hp: advanced ? 50 : 25,
      maxHp: advanced ? 50 : 25,
      mp: 25,
      maxMp: 25,
    });
  if (hero.LIGHT) Object.assign(hero.LIGHT, calculateVision(advanced ? 9 : 6));
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
