import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { INVENTORY } from "../../engine/components/inventory";
import { LOCKABLE } from "../../engine/components/lockable";
import { MOVABLE } from "../../engine/components/movable";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { REFERENCE } from "../../engine/components/reference";
import { Sprite } from "../../engine/components/sprite";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import { getSequence } from "../../engine/systems/sequence";
import {
  AreaWorldOptions,
  assertHero,
  createAreaWorld,
  findEntityAt,
  findInArea,
  step,
  trigger,
} from "../../testing/harness";

/**
 * Area world with the hero ready to act. Keep the hero away from the top left
 * corner, as the hero's own "use" popup is placed at 0,0.
 */
export const setup = (area: string, options?: AreaWorldOptions) => {
  const world = createAreaWorld(area, options);
  const hero = world.assertComponents(assertHero(world), [
    ACTIONABLE,
    INVENTORY,
    PLAYER,
    POSITION,
    STATS,
  ]);
  // let the hero notice adjacent interactions
  step(world, 5);
  return { world, hero };
};

/** The lock placed at a character of an area. */
export const getLock = (world: World, area: string, char: string) => {
  const lock = findEntityAt(world, findInArea(area, char), [
    LOCKABLE,
    POSITION,
  ]);
  if (!lock) throw new Error(`No lock at "${char}"`);
  return lock;
};

export const interact = (world: World, frames = 5) => {
  trigger(world, "interact");
  step(world, frames);
};

/** The controlled entity, which is the ghost while the hero is dead. */
export const assertPlayer = (world: World) => {
  const player = world.getEntity([PLAYER, POSITION, MOVABLE, ACTIONABLE]) as
    | TypedEntity<"PLAYER" | "POSITION" | "MOVABLE" | "ACTIONABLE">
    | undefined;
  if (!player) throw new Error("Player not found");
  return player;
};

/** Interact as the current player, including a ghost. */
export const interactAsPlayer = (world: World, frames = 5) => {
  const player = assertPlayer(world);
  const reference = world.assertByIdAndComponents(player[MOVABLE].reference, [
    REFERENCE,
  ])[REFERENCE];

  player[ACTIONABLE].interactTriggered = true;
  if (reference.suspensionCounter !== -1) reference.suspensionCounter += 1;
  reference.suspended = false;
  step(world, frames);
};

const getText = (line: Sprite[]) =>
  line
    .filter((sprite) => sprite.name === "text_generic")
    .map((sprite) => sprite.layers[sprite.layers.length - 1].char)
    .join("");

/** Lines of floating messages above an entity, e.g. "Need Key!". */
export const getMessageLines = (world: World, entity: TypedEntity) =>
  getSequence(world, entity, "message")?.args.messages.map(
    (message) => message.line
  ) || [];

export const getMessages = (world: World, entity: TypedEntity) =>
  getMessageLines(world, entity).map(getText);

/** Item icons within messages, without their background. */
export const getMessageIcons = (world: World, entity: TypedEntity) =>
  getMessageLines(world, entity).map((line) =>
    line
      .filter((sprite) => sprite.name !== "text_generic")
      .map((sprite) => ({
        ...sprite,
        layers: sprite.layers.slice(1),
        ...(sprite.terminal && {
          terminal: {
            ...sprite.terminal,
            layers: sprite.terminal.layers.slice(1),
          },
        }),
      }))
  );

/** Text of the interaction prompt shown on an entity, e.g. "OPEN". */
export const getPrompt = (world: World, entity: TypedEntity) => {
  const sequence = getSequence(world, entity, "interact");
  return sequence?.args.active ? sequence.args.text : undefined;
};
