/**
 * Headless, deterministic game harness.
 *
 * Boots a level exactly like `components/World` does, but synchronously and
 * without React, and advances the ECS in the same fixed steps as
 * `components/Systems`. Combined with the seeded `Math.random` from
 * `setupTests.ts`, every run of a test produces the identical world.
 */
import { createWorld, World } from "../engine";
import { createLevel, createSystems, preloadLevel } from "../engine/ecs";
import { LEVEL, LevelName } from "../engine/components/level";
import { CellType, insertArea, populateItems } from "../bindings/creation";
import { createMatrix } from "../game/math/matrix";
import { initializeCell } from "../engine/systems/initialize";
import { levelConfig } from "../game/levels";
import { getIdentifierAndComponents } from "../engine/utils";
import { POSITION } from "../engine/components/position";
import { MOVABLE } from "../engine/components/movable";
import { REFERENCE } from "../engine/components/reference";
import { Orientation } from "../engine/components/orientable";
import { SPRITE } from "../engine/components/sprite";
import { Player, PLAYER } from "../engine/components/player";
import { ACTIONABLE } from "../engine/components/actionable";
import { Entity, TypedEntity } from "../engine/entities";
import { isInPopup } from "../engine/systems/popup";
import { getHasteInterval } from "../engine/systems/movement";
import { getEntityStats } from "../engine/systems/damage";
import { getCellEntities } from "../engine/systems/map";
import { Item, ITEM } from "../engine/components/item";
import { INVENTORY } from "../engine/components/inventory";
import { ORIENTABLE } from "../engine/components/orientable";
import { slots } from "../engine/components/equippable";
import { getSequence } from "../engine/systems/sequence";
import { Position } from "../engine/components/position";

/** Fixed systems step, must match `systemsFrame` in components/Systems. */
export const FRAME = 1000 / 30;

export type TestWorldOptions = {
  level?: LevelName;
  /** replace default dimensions, e.g. to shrink the initialized area */
  dimensions?: Partial<World["metadata"]["dimensions"]>;
};

/** Create, generate and preload a level, ready to be ticked. */
export const createTestWorld = ({
  level = "LEVEL_MENU",
  dimensions,
}: TestWorldOptions = {}) => {
  const world = createWorld();
  if (dimensions) {
    world.metadata.dimensions = { ...world.metadata.dimensions, ...dimensions };
  }
  // test worlds are always running, i.e. title screen already dismissed
  world.metadata.initial = false;

  createLevel(world, level, levelConfig[level].size);
  createSystems(world);
  levelConfig[level].generator(world);
  preloadLevel(world);

  return world;
};

/**
 * Parse an area where every row is enclosed in `|`, so editors trimming
 * trailing whitespace can't change the map:
 *
 *   |♀  █|
 *   |    |
 */
export const parseArea = (area: string) => {
  const rows = area.trim().split("\n");
  return rows.map((row, index) => {
    const match = row.trim().match(/^\|(.*)\|$/);
    if (!match) throw new Error(`Row ${index} not enclosed in "|": ${row}`);
    if (match[1].length !== rows[0].trim().length - 2) {
      throw new Error(`Row ${index} differs in width: ${row}`);
    }
    return match[1];
  });
};

/** Position of the first occurrence of `char` within an area. */
export const findInArea = (area: string, char: string) => {
  const rows = parseArea(area);
  const y = rows.findIndex((row) => row.includes(char));
  if (y === -1) throw new Error(`"${char}" not found in area`);
  return { x: rows[y].indexOf(char), y };
};

export type AreaWorldOptions = {
  level?: LevelName;
  /** square map size, defaults to the larger side of the area */
  size?: number;
  /** extra characters mapped to any cell type, e.g. `{ D: "iron_door" }` */
  legend?: Record<string, string>;
};

/**
 * Create a world from an ASCII area using the legend of `insertArea` in
 * bindings/creation, e.g. "♀" for the hero, "█" for mountains and " " for air.
 * The top left character inside the `|` borders is placed at position 0,0 and
 * every position outside of the area is air. The map wraps around at `size`.
 */
export const createAreaWorld = (
  area: string,
  { level = "LEVEL_TUTORIAL", size, legend = {} }: AreaWorldOptions = {}
) => {
  const rows = parseArea(area);
  const width = rows[0].length;
  const height = rows.length;
  const mapSize = size ?? Math.max(width, height);
  const spawn = findInArea(area, "♀");

  const world = createWorld();
  world.metadata.initial = false;

  createLevel(world, level, mapSize);
  createSystems(world);

  const levelData = world.metadata.gameEntity[LEVEL];
  levelData.cells = createMatrix<CellType>(mapSize, mapSize, "air");
  levelData.objects = createMatrix(mapSize, mapSize, undefined);
  levelData.initialized = createMatrix(mapSize, mapSize, false);

  // insertArea centers the area on the given offset, override sets air cells
  const legendRows = rows.map((row) =>
    row
      .split("")
      .map((char) => (char in legend ? " " : char))
      .join("")
  );
  insertArea(
    world,
    legendRows.join("\n"),
    (width - 1) / 2,
    (height - 1) / 2,
    true
  );
  rows.forEach((row, y) =>
    row.split("").forEach((char, x) => {
      if (char in legend) levelData.cells[x][y] = legend[char] as CellType;
    })
  );
  initializeCell(world, spawn.x, spawn.y);
  preloadLevel(world);

  return world;
};

/** Run `frames` fixed system updates. */
export const step = (world: World, frames = 1) => {
  for (let frame = 0; frame < frames; frame += 1) {
    world.update(FRAME);
  }
};

/** Advance game time by `ms`, rounded up to whole frames. */
export const advance = (world: World, ms: number) =>
  step(world, Math.ceil(ms / FRAME));

/**
 * Step until `predicate` holds and return the number of frames it took.
 * Throws if it never holds within `timeout` ms of game time.
 */
export const advanceUntil = (
  world: World,
  predicate: () => boolean,
  timeout = 10000
) => {
  const maxFrames = Math.ceil(timeout / FRAME);
  for (let frame = 0; frame <= maxFrames; frame += 1) {
    if (predicate()) return frame;
    world.update(FRAME);
  }
  throw new Error(`Condition not met within ${timeout}ms of game time`);
};

export const getHero = (world: World) =>
  getIdentifierAndComponents(world, "hero", [POSITION, MOVABLE, PLAYER]) as
    | TypedEntity<"POSITION" | "MOVABLE" | "PLAYER">
    | undefined;

export const assertHero = (world: World) => {
  const hero = getHero(world);
  if (!hero) throw new Error("Hero not found");
  return hero;
};

/**
 * Hold (or release with `[]`) directional input for the hero.
 * Mirrors the essential part of `handleMove` in components/Controls.
 */
export const holdMove = (world: World, orientations: Orientation[]) => {
  const hero = assertHero(world);
  const reference = world.assertByIdAndComponents(hero[MOVABLE].reference, [
    REFERENCE,
  ])[REFERENCE];

  if (
    orientations.length &&
    !hero[MOVABLE].orientations.length &&
    isInPopup(world, hero)
  ) {
    reference.delta = reference.tick;
  }
  hero[MOVABLE].orientations = orientations;
  if (orientations[0]) hero[MOVABLE].pendingOrientation = orientations[0];

  if (orientations.length === 0) {
    reference.suspensionCounter = 0;
  } else {
    reference.suspensionCounter = -1;
    reference.suspended = false;
  }
};

export type HeroAction =
  | "spell"
  | "skill"
  | "interact"
  | NonNullable<Player["actionTriggered"]>;

/**
 * Trigger a single hero action, e.g. "interact" or "close".
 * Mirrors the essential part of `handleAction` in components/Controls.
 */
export const trigger = (world: World, action: HeroAction) => {
  const hero = assertHero(world);
  const actionable = world.assertComponents(hero, [ACTIONABLE])[ACTIONABLE];
  const reference = world.assertByIdAndComponents(hero[MOVABLE].reference, [
    REFERENCE,
  ])[REFERENCE];

  if (action === "spell") actionable.spellTriggered = true;
  else if (action === "skill") actionable.skillTriggered = true;
  else if (action === "interact") actionable.interactTriggered = true;
  else hero[PLAYER].actionTriggered = action;

  // wake up hero's reference frame to process the action on next tick
  if (reference.suspensionCounter !== -1) reference.suspensionCounter += 1;
  reference.suspended = false;
};

/** Trigger a hero action and wait until the hero has processed it. */
export const act = (world: World, action: HeroAction) => {
  const hero = world.assertComponents(assertHero(world), [ACTIONABLE, PLAYER]);
  trigger(world, action);
  advanceUntil(
    world,
    () =>
      !hero[ACTIONABLE].spellTriggered &&
      !hero[ACTIONABLE].skillTriggered &&
      !hero[ACTIONABLE].interactTriggered &&
      !hero[PLAYER].actionTriggered,
    1000
  );
  step(world);
};

/**
 * Walk `cells` steps into one direction and release input afterwards.
 * Throws if the hero gets stuck, so blocked paths fail loudly.
 */
export const walk = (world: World, orientation: Orientation, cells = 1) => {
  const hero = assertHero(world);
  const interval = getHasteInterval(world, getEntityStats(world, hero).haste);

  for (let cell = 0; cell < cells; cell += 1) {
    const { x, y } = hero[POSITION];
    holdMove(world, [orientation]);
    advanceUntil(
      world,
      () => hero[POSITION].x !== x || hero[POSITION].y !== y,
      interval * 2
    );
  }

  holdMove(world, []);
};

/**
 * Compact, order independent fingerprint of all positioned entities.
 * Useful to assert determinism and detect unintended world changes.
 */
export const snapshot = (world: World) =>
  world
    .getEntities([POSITION])
    .map((entity) => {
      const { x, y } = entity[POSITION];
      const sprite = (entity as TypedEntity<"SPRITE">)[SPRITE]?.name ?? "";
      return `${x},${y}:${sprite}`;
    })
    .sort()
    .join("|");

/** All entities registered in a cell. */
export const getEntitiesAt = (world: World, position: Position) =>
  getCellEntities(world, position);

/** First entity in a cell that has all given components. */
export const findEntityAt = <C extends keyof Entity>(
  world: World,
  position: Position,
  components: C[]
) =>
  getCellEntities(world, position).find((entity) =>
    components.every((component) => component in entity)
  ) as TypedEntity<C> | undefined;

export type GivenItem = Omit<Item, "carrier" | "bound"> & { bound?: boolean };

/**
 * Put items into an entity's inventory. Equipment is equipped if its slot is
 * free, like picking it up for the first time.
 */
export const giveItems = (
  world: World,
  entity: TypedEntity<"INVENTORY" | "POSITION">,
  items: GivenItem[]
) =>
  items.flatMap((item) =>
    populateItems(
      world,
      entity,
      [{ bound: false, ...item }],
      slots.some((slot) => item[slot])
    )
  );

/** Item data of everything an entity carries. */
export const getItems = (world: World, entity: TypedEntity<"INVENTORY">) =>
  entity[INVENTORY].items.map(
    (itemId) => world.assertByIdAndComponents(itemId, [ITEM])[ITEM]
  );

/** Total amount of carried items matching every given property. */
export const countItems = (
  world: World,
  entity: TypedEntity<"INVENTORY">,
  match: Partial<Item>
) =>
  getItems(world, entity)
    .filter((item) =>
      (Object.keys(match) as (keyof Item)[]).every(
        (key) => item[key] === match[key]
      )
    )
    .reduce((total, item) => total + item.amount, 0);

/** Turn the hero without moving, e.g. before casting or using a tool. */
export const face = (world: World, orientation: Orientation) => {
  const hero = assertHero(world);
  world.assertComponents(hero, [ORIENTABLE])[ORIENTABLE].facing = orientation;
  // a pending orientation would also step into a free cell
  hero[MOVABLE].pendingOrientation = undefined;
};

/** Text of the messages currently shown above an entity, e.g. "Need MP!". */
export const getMessages = (world: World, entity: TypedEntity) =>
  getSequence(world, entity, "message")?.args.messages.map((message) =>
    message.line
      .map((sprite) => sprite.layers[sprite.layers.length - 1]?.char || "")
      .join("")
  ) || [];
