import { World } from "../../engine";
import { createCell } from "../../bindings/creation";
import { ACTIONABLE } from "../../engine/components/actionable";
import { AFFECTABLE } from "../../engine/components/affectable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { INVENTORY } from "../../engine/components/inventory";
import { LAYER } from "../../engine/components/layer";
import { LIGHT } from "../../engine/components/light";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { STATS } from "../../engine/components/stats";
import { SWIMMABLE } from "../../engine/components/swimmable";
import { MOVABLE } from "../../engine/components/movable";
import { Orientation, ORIENTABLE } from "../../engine/components/orientable";
import { PLAYER } from "../../engine/components/player";
import { Position, POSITION } from "../../engine/components/position";
import { REFERENCE } from "../../engine/components/reference";
import { TypedEntity } from "../../engine/entities";
import { getEntityStats } from "../../engine/systems/damage";
import { registerEntity } from "../../engine/systems/map";
import {
  getHasteInterval,
  setMovementOrientations,
} from "../../engine/systems/movement";
import { assertHero, FRAME, step } from "../../testing/harness";

/** The controlled entity, which is the ghost while the hero is dead. */
export const assertPlayer = (world: World) => {
  const player = world.getEntity([PLAYER, POSITION, MOVABLE, ACTIONABLE]) as
    | TypedEntity<"PLAYER" | "POSITION" | "MOVABLE" | "ACTIONABLE">
    | undefined;
  if (!player) throw new Error("Player not found");
  return player;
};

const getPlayerReference = (world: World) =>
  world.assertByIdAndComponents(assertPlayer(world)[MOVABLE].reference, [
    REFERENCE,
  ])[REFERENCE];

/**
 * Hold a direction like `holdMove`, also for ghosts. Releasing with `[]` keeps
 * sliding players going, like the controls do.
 */
export const hold = (world: World, orientations: Orientation[]) => {
  setMovementOrientations(world, assertPlayer(world), orientations);
};

/** Hold a direction for a while and release it, even if blocked. */
export const tryMove = (
  world: World,
  orientation: Orientation,
  frames = 30
) => {
  hold(world, [orientation]);
  step(world, frames);
  hold(world, []);
};

/** Interact as the current player, e.g. as a ghost on its tombstone. */
export const interactAsPlayer = (world: World) => {
  const reference = getPlayerReference(world);

  assertPlayer(world)[ACTIONABLE].interactTriggered = true;
  if (reference.suspensionCounter !== -1) reference.suspensionCounter += 1;
  reference.suspended = false;
};

/** Move interval of an entity in ms, including terrain below it. */
export const getInterval = (world: World, entity: TypedEntity) =>
  getHasteInterval(world, getEntityStats(world, entity).haste);

/**
 * Hold a direction and count the frames between each of the next `moves`
 * steps of the player.
 */
export const measureSteps = (
  world: World,
  orientation: Orientation,
  moves: number
) => {
  const player = assertPlayer(world);
  const frames: number[] = [];
  let last = { ...player[POSITION] };
  let count = 0;

  hold(world, [orientation]);
  while (frames.length < moves) {
    step(world);
    count += 1;
    if (count * FRAME > 5000) throw new Error("Player did not move");
    if (player[POSITION].x === last.x && player[POSITION].y === last.y)
      continue;

    frames.push(count);
    last = { ...player[POSITION] };
    count = 0;
  }
  hold(world, []);

  return frames;
};

/** Add a cell's entities to an initialized position, e.g. a boat on water. */
export const addCell = (world: World, position: Position, cell: string) => {
  const { cell: entity, all } = createCell(
    world,
    position,
    cell,
    "visible",
    false
  );
  all.forEach((created) => registerEntity(world, created));
  return entity;
};

/** The living hero with the components these tests look at. */
export const assertUnit = (world: World) =>
  world.assertComponents(assertHero(world), [
    AFFECTABLE,
    EQUIPPABLE,
    INVENTORY,
    LAYER,
    LIGHT,
    MOVABLE,
    ORIENTABLE,
    PLAYER,
    POSITION,
    SPAWNABLE,
    STATS,
    SWIMMABLE,
  ]);
