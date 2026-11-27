import {
  createCell,
  createChest,
  createNpc,
  flipArea,
  populateItems,
} from "../../bindings/creation";
import { createAnchor, createMarker } from "../../engine/entities";
import {
  disposeEntity,
  getCell,
  getCellEntities,
  registerEntity,
} from "../../engine/systems/map";
import { isWalkable } from "../../engine/systems/movement";
import { isQuestCompleted, createPopup } from "../../engine/systems/popup";
import { createSequence } from "../../engine/systems/sequence";
import { getIdentifier } from "../../engine/utils";
import { assertHero, createAreaWorld } from "../../testing/harness";
import { fireChiefNpc } from "../assets/npcs";
import { mapSpawn, none } from "../assets/sprites";
import { createText } from "../assets/ui";
import { createUnitName, npcSequence, questSequence } from "../assets/utils";
import { unitDefinitions } from "../balancing/units";
import { spawnArea } from "../levels/island/areas";
import { upgradeIsland } from "./upgradeIsland";

const glacier = () => {
  const world = createAreaWorld("|♀     |", {
    level: "LEVEL_ISLAND",
    size: 24,
  });
  const guard = createNpc(world, "waterGuard", { x: 12, y: 12 });
  const chief = createNpc(world, "fireChief", { x: 4, y: 0 });
  return { world, guard, chief, hero: assertHero(world) };
};

it("keeps the island and its glacier recipient when the boat quest is issued after upgrading", () => {
  const { world, guard, chief, hero } = glacier();
  const level = world.metadata.gameEntity.LEVEL;
  const cells = level.cells.map((column) => [...column]);
  const [gift] = populateItems(
    world,
    guard,
    [{ stackable: "apple", amount: 2, bound: false }],
    false
  );
  const sword = world.assertByIdAndComponents(guard.EQUIPPABLE.weapon!, [
    "ITEM",
  ]);
  const initialPotion = guard.INVENTORY.items
    .map((id) => world.assertByIdAndComponents(id, ["ITEM"]))
    .find((item) => item.ITEM.consume === "potion")!;
  guard.INVENTORY.items.splice(
    guard.INVENTORY.items.indexOf(world.getEntityId(initialPotion)),
    1
  );
  world.removeEntity(initialPotion, false);
  sword.ITEM.material = "iron";
  const id = world.getEntityId(guard);
  guard.STATS.hp = 17;
  upgradeIsland(world);
  expect(getIdentifier(world, "waterChief")).toBe(world.assertById(id));
  expect(guard).toMatchObject({
    POSITION: { x: 12, y: 12 },
    FOG: { visibility: "hidden" },
    STATS: { hp: 17 },
    REMAINABLE: { cell: unitDefinitions.waterChief.remains },
    SPRITE: { id: unitDefinitions.waterChief.sprite.id },
    NPC: { type: "waterChief" },
  });
  expect(level.cells).toEqual(cells);
  expect(guard.EQUIPPABLE.offhand).toBeUndefined();
  expect(sword.ITEM).toMatchObject({ weapon: "sword", element: "water" });
  expect(sword.ITEM.material).toBeUndefined();
  expect(guard.INVENTORY.items).toContain(world.getEntityId(gift));
  expect(
    guard.INVENTORY.items.map(
      (id) => world.assertByIdAndComponents(id, ["ITEM"]).ITEM
    )
  ).toContainEqual(
    expect.objectContaining({
      consume: "potion",
      material: "iron",
      amount: Infinity,
    })
  );

  npcSequence(world, chief, "fireChiefNpc", {});
  const state = chief.SEQUENCABLE.states.npc!;
  state.args.step = "boat";
  fireChiefNpc(world, chief, state);
  expect(isQuestCompleted(world, hero, chief)).toBe(false);
  guard.FOG.visibility = "visible";
  expect(isQuestCompleted(world, hero, chief)).toBe(true);
});

it("retains an active glacier quest, its waypoint and discovery progress", () => {
  const { world, guard, chief, hero } = glacier();
  const popup = createPopup(world, chief, {
    tabs: ["quest"],
    targets: [{ identifier: "waterGuard", unit: "waterGuard", amount: 1 }],
    focuses: [{ identifier: "waterGuard", highlight: "quest" }],
    lines: [
      [
        createText("island. Give the"),
        [...createUnitName("waterGuard"), ...createText(".")],
      ],
    ],
    active: true,
    verticalIndezes: [1],
  }).POPUP;
  questSequence(world, hero, "waypointQuest", {
    identifier: "waterGuard",
    distance: 2,
  });
  const waypoint = hero.SEQUENCABLE.states.quest!;
  waypoint.elapsed = 920;
  guard.FOG.visibility = "fog";
  upgradeIsland(world);
  expect(popup.targets[0]).toEqual({
    identifier: "waterChief",
    unit: "waterChief",
    amount: 1,
  });
  expect(popup.focuses[0].identifier).toBe("waterChief");
  expect(popup.lines[0][1]).toEqual([
    ...createUnitName("waterChief"),
    ...createText("."),
  ]);
  expect(popup.active).toBe(true);
  expect(popup.verticalIndezes).toEqual([1]);
  expect(waypoint).toMatchObject({
    elapsed: 920,
    args: { memory: { identifier: "waterChief" } },
  });
  expect(isQuestCompleted(world, hero, chief)).toBe(true);
});

it("preserves the guard and chief when both already exist", () => {
  const { world, guard } = glacier();
  const chief = createNpc(world, "waterChief", { x: 17, y: 12 });
  upgradeIsland(world);
  expect(getIdentifier(world, "waterChief")).toBe(chief);
  expect(getIdentifier(world, "waterGuard")).toBe(guard);
});

it("restores fire handling for rotten wood and dormant or awakened plants", () => {
  const world = createAreaWorld("|♀ P Q |", {
    legend: { P: "rose", Q: "clover" },
  });
  const plants = [...world.getEntities(["NPC", "HARVESTABLE", "BURNABLE"])];
  expect(plants).toHaveLength(2);
  const trunk = createChest(world, "rotten", { x: 2, y: 0 });
  const wood = world.assertComponents(trunk, ["BURNABLE"]);
  for (const entity of [...plants, wood])
    world.removeComponentFromEntity(entity, "BURNABLE", false);
  world.removeComponentFromEntity(plants[1], "HARVESTABLE", false);
  upgradeIsland(world);
  for (const entity of [...plants, wood])
    expect(entity.BURNABLE.burning).toBe(false);
  wood.BURNABLE.burning = true;
  upgradeIsland(world);
  expect(wood.BURNABLE.burning).toBe(true);
});

it("restores a weather anchor to its last particle origin and retains the storm clock", () => {
  const world = createAreaWorld("|♀      |");
  const origin = { x: 0, y: 0 };
  const anchor = createAnchor(world, {
    POSITION: { ...origin },
    RENDERABLE: { generation: 0 },
    SEQUENCABLE: { states: {} },
    SPRITE: none,
  });
  registerEntity(world, anchor);
  const viewable = { x: 3, y: 0 };
  createSequence(world, anchor, "weather", "weatherStorm", {
    viewable,
    position: origin,
    generation: 3,
    intensity: 1,
    drops: [],
    start: 0,
    end: Infinity,
    type: "snow",
  });
  Object.assign(anchor, { STICKY: {} });
  const storm = anchor.SEQUENCABLE.states.weather!;
  storm.elapsed = 1600;
  upgradeIsland(world);
  const id = world.getEntityId(anchor);
  expect(getCell(world, origin)[id]).toBeUndefined();
  expect(getCell(world, viewable)[id]).toBe(anchor);
  expect(anchor).not.toHaveProperty("STICKY");
  expect(storm.args).not.toHaveProperty("viewable");
  expect(storm).toMatchObject({
    elapsed: 1600,
    args: { position: origin, generation: 3, end: Infinity },
  });
});

const releasedSpawn = (inverted: boolean) => {
  const template = spawnArea.replace("???ß▒ß???", "???ß&ß???");
  const area = flipArea(template, inverted, false)
    .split("\n")
    .map((row) => "|" + row + "|")
    .join("\n");
  const world = createAreaWorld(area, { level: "LEVEL_ISLAND", size: 24 });
  createMarker(world, {
    FOG: { type: "terrain", visibility: "hidden" },
    POI: { sprite: mapSpawn },
    POSITION: { x: 4, y: 4 },
    RENDERABLE: { generation: 0 },
  });
  const exit = { x: 4, y: inverted ? 2 : 6 };
  const cell = getCellEntities(world, exit);
  const hedge = cell.find(
    (entity) => entity.HARVESTABLE?.resource === "hedge"
  )!;
  const path = cell.find((entity) => entity.HARVESTABLE?.resource === "path")!;
  return { world, exit, hedge, path };
};

it.each([false, true])(
  "opens only the original hedge across the spawn path (inverted %s)",
  (inverted) => {
    const { world, exit, hedge, path } = releasedSpawn(inverted);
    const level = world.metadata.gameEntity.LEVEL;
    const neighbor = { x: exit.x + 1, y: exit.y };
    const id = world.getEntityId(hedge);
    expect(isWalkable(world, exit)).toBe(false);
    upgradeIsland(world);
    expect(world.getEntityById(id)).toBeUndefined();
    expect(isWalkable(world, exit)).toBe(true);
    expect(isWalkable(world, neighbor)).toBe(false);
    expect(getCellEntities(world, exit)).toContain(path);
    expect(level.cells[exit.x][exit.y]).toBe("path");
    expect(level.cellPositions.path_hedge).toBeUndefined();
    expect(level.cellPositions.path).toContainEqual(exit);
  }
);

it("preserves a player's replacement hedge on the old spawn path", () => {
  const { world, exit, hedge } = releasedSpawn(false);
  disposeEntity(world, hedge, false);
  const replacement = createCell(world, exit, "hedge", "visible", false).cell;
  registerEntity(world, replacement);
  upgradeIsland(world);
  expect(getCellEntities(world, exit)).toContain(replacement);
  expect(isWalkable(world, exit)).toBe(false);
});
