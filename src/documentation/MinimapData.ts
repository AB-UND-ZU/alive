import { createTestWorld, assertHero } from "../testing/harness";
import { populateInventory } from "../bindings/creation";
import { initializeArea, initializeCell } from "../engine/systems/initialize";
import { moveEntity } from "../engine/systems/map";
import setupVisibility, { getEntityVision } from "../engine/systems/visibility";
import { createPopup, openPopup, mapScroll } from "../engine/systems/popup";
import { rerenderEntity } from "../engine/systems/renderer";
import { findPath } from "../game/math/path";
import { getPlayableMatrix, toMatrix } from "../testing/island";
import { normalize, getDistance } from "../game/math/std";
import { iterateMatrixFromCenter } from "../game/math/matrix";
import { Item } from "../engine/components/item";
import { unitDefinitions, UnitKey } from "../game/balancing/units";
import { mapHouse, mapFortress, mapNomad } from "../game/assets/sprites";
import { warpBlink } from "../game/assets/warp";
import { popupParticles } from "./DialogSnapshot";

export function createMinimapWorld() {
  const world = createTestWorld({ level: "LEVEL_ISLAND" });
  const hero = world.assertComponents(assertHero(world), [
    "POSITION",
    "INVENTORY",
    "EQUIPPABLE",
    "LIGHT",
  ]);
  const level = world.metadata.gameEntity.LEVEL;
  const landmarks = world
    .getEntities(["POI", "POSITION"])
    .filter((entity) =>
      [mapHouse, mapFortress, mapNomad].includes(entity.POI.sprite)
    );
  const reveal = (position: { x: number; y: number }, radius: number) =>
    initializeArea(
      world,
      { x: position.x - radius, y: position.y - radius },
      { x: position.x + radius, y: position.y + radius }
    );
  reveal(hero.POSITION, 20);
  for (const landmark of landmarks) reveal(landmark.POSITION, 20);
  for (let x = 0; x < level.size; x++)
    for (let y = 0; y < level.size; y++)
      if (level.cells[x][y] === "path") reveal({ x, y }, 3);
  const matrix = getPlayableMatrix(world);
  const route: { x: number; y: number }[] = [];
  const visitedLandmarks: string[] = [];
  let origin = { ...hero.POSITION };
  for (const landmark of landmarks) {
    const target = iterateMatrixFromCenter(
      matrix,
      toMatrix(world, landmark.POSITION),
      (_x, _y, value) => value === 1,
      8
    );
    if (!target) continue;
    const segment = findPath(
      matrix,
      toMatrix(world, origin),
      target,
      true,
      true,
      { x: 0, y: 0 }
    ).map((position) => ({
      x: position.x - level.size / 2,
      y: position.y - level.size / 2,
    }));
    if (!segment.length) continue;
    route.push(...segment);
    origin = segment[segment.length - 1];
    visitedLandmarks.push(
      landmark.POI.sprite === mapHouse
        ? "Earth Town"
        : landmark.POI.sprite === mapFortress
        ? "Fire Haven"
        : "Nomad"
    );
  }
  if (!visitedLandmarks.includes("Earth Town"))
    throw new Error("Minimap reference cannot reach Earth Town");
  for (const position of route) reveal(position, 8);
  populateInventory(
    world,
    hero,
    [],
    [
      { accessory: "map", material: "gold", amount: 1, bound: false },
      { accessory: "torch", material: "wood", amount: 1, bound: false },
    ]
  );
  hero.LIGHT = getEntityVision(world, hero);
  const visibility = setupVisibility(world);
  for (const position of [hero.POSITION, ...route]) {
    moveEntity(world, hero, {
      x: normalize(position.x, level.size),
      y: normalize(position.y, level.size),
    });
    rerenderEntity(world, world.metadata.gameEntity);
    visibility.onUpdate(0);
  }
  const viewpoint = [...route]
    .reverse()
    .find((position) =>
      landmarks.every(
        (landmark) =>
          getDistance(position, landmark.POSITION, level.size, 1) > 6
      )
    );
  if (!viewpoint)
    throw new Error("Minimap reference has no viewpoint away from landmarks");
  moveEntity(world, hero, {
    x: normalize(viewpoint.x, level.size),
    y: normalize(viewpoint.y, level.size),
  });
  rerenderEntity(world, world.metadata.gameEntity);
  visibility.onUpdate(0);
  createPopup(world, hero, { tabs: ["map"] });
  openPopup(world, hero, hero);
  return { world, hero, route, visitedLandmarks };
}

export function prepareMinimaps() {
  const { world, hero, route, visitedLandmarks } = createMinimapWorld();
  while (
    world.metadata.gameEntity.RENDERABLE.generation % (warpBlink * 2) >=
    warpBlink
  )
    rerenderEntity(world, world.metadata.gameEntity);
  const rows = Array.from({ length: mapScroll }, (_, index) => {
    hero.POPUP!.verticalIndezes[0] = index;
    rerenderEntity(world, hero);
    return popupParticles(world, hero);
  });
  const fog = world.getEntities(["FOG"]).map((entity) => entity.FOG.visibility);
  return {
    rows,
    roadSteps: route.length,
    reachedTown: visitedLandmarks.includes("Earth Town"),
    visitedLandmarks,
    heroOnPoi: world
      .getEntities(["POI", "POSITION"])
      .some(
        (entity) =>
          entity.POSITION.x === hero.POSITION.x &&
          entity.POSITION.y === hero.POSITION.y
      ),
    worldItems: islandItemSources(world),
    hidden: fog.filter((v) => v === "hidden").length,
    remembered: fog.filter((v) => v === "fog").length,
    visible: fog.filter((v) => v === "visible").length,
  };
}

export function islandItemSources(world: ReturnType<typeof createTestWorld>) {
  const level = world.metadata.gameEntity.LEVEL;
  const patterns = new Set<string>();
  for (let x = 0; x < level.size; x++)
    for (let y = 0; y < level.size; y++) {
      const pattern = JSON.stringify([
        level.biomes[x][y],
        level.cells[x][y],
        level.objects[x][y],
      ]);
      if (patterns.has(pattern)) continue;
      patterns.add(pattern);
      initializeCell(world, x, y);
    }
  const sources = new Map<string, { item: Partial<Item>; biome: string }>();
  const add = (value: Partial<Item>, position: { x: number; y: number }) => {
    const item: Partial<Item> = { ...value };
    delete item.amount;
    delete item.carrier;
    delete item.bound;
    const biome =
      level.biomes[normalize(position.x, level.size)][
        normalize(position.y, level.size)
      ];
    sources.set(JSON.stringify([item, biome]), { item, biome });
  };
  for (const entity of world.getEntities(["ITEM"])) {
    const carrier = world.getEntityById(entity.ITEM.carrier);
    const position = entity.POSITION || carrier?.POSITION;
    if (
      !entity.ITEM.bound &&
      entity.ITEM.amount &&
      !carrier?.PLAYER &&
      position
    )
      add(entity.ITEM, position);
  }
  for (const entity of world.getEntities(["NPC", "POSITION"])) {
    const pending: string[] = [entity.NPC.type];
    const visited = new Set<string>();
    while (pending.length) {
      const key = pending.pop()!;
      if (visited.has(key) || !(key in unitDefinitions)) continue;
      visited.add(key);
      const unit = unitDefinitions[key as UnitKey];
      for (const drop of unit.drops)
        if (drop.chance)
          for (const item of drop.items)
            if (item.amount) add(item, entity.POSITION);
      for (const child of unit.vanish?.cells || []) pending.push(child.cell);
    }
  }
  return [...sources.values()];
}
