import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FORGABLE } from "../../engine/components/forgable";
import { INVENTORY } from "../../engine/components/inventory";
import { Popup, POPUP } from "../../engine/components/popup";
import { MOVABLE } from "../../engine/components/movable";
import { PLAYER } from "../../engine/components/player";
import { Position, POSITION } from "../../engine/components/position";
import { getMotion, sampleMotion } from "../../engine/motion";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import {
  createPopup,
  getVerticalIndex,
  isInPopup,
} from "../../engine/systems/popup";
import { getSequence } from "../../engine/systems/sequence";
import { createNpc } from "../../bindings/creation";
import {
  hittingOffset,
  hittingWidth,
} from "../../game/balancing/forging";
import {
  act,
  advanceUntil,
  assertHero,
  step,
  trigger,
} from "../../testing/harness";

export type PopupEntity = TypedEntity<"POPUP" | "POSITION" | "SEQUENCABLE">;
export type AnvilEntity = TypedEntity<
  "FORGABLE" | "POPUP" | "POSITION" | "SEQUENCABLE"
>;

export const getShopper = (world: World) =>
  world.assertComponents(assertHero(world), [
    ACTIONABLE,
    EQUIPPABLE,
    INVENTORY,
    MOVABLE,
    PLAYER,
    POSITION,
    STATS,
  ]);

export { getTraderDeal } from "../../game/balancing/trading";

/** Place a guide with a shop popup, like the traders in the levels. */
export const createShop = (
  world: World,
  position: Position,
  popup: Pick<Popup, "tabs"> & Partial<Popup>
) => {
  const trader = createNpc(world, "guide", position);
  createPopup(world, trader, popup);
  return trader as unknown as PopupEntity;
};

/** Open the adjacent popup and wait for its window to unroll. */
export const openStation = (world: World) => {
  const hero = getShopper(world);
  advanceUntil(world, () => hero[ACTIONABLE].popup !== undefined, 1000);
  trigger(world, "interact");
  advanceUntil(world, () => !!isInPopup(world, hero), 1000);
  step(world, 30);
  return world.assertByIdAndComponents(hero[PLAYER].popup, [
    POPUP,
    POSITION,
    SEQUENCABLE,
  ]);
};

/** Scroll the current tab to a row. */
export const selectRow = (world: World, popup: PopupEntity, row: number) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const index = getVerticalIndex(world, popup);
    if (index === row) return;
    act(world, index < row ? "down" : "up");
  }
  throw new Error(`Unable to select row ${row}`);
};

export const closeStation = (world: World) => {
  const hero = getShopper(world);
  trigger(world, "close");
  advanceUntil(world, () => !isInPopup(world, hero), 1000);
};

/** Hammer position when striking on this frame. */
export const getHammerIndex = (world: World, anvil: AnvilEntity) => {
  const popupSequence = getSequence(world, anvil, "popup");
  if (!popupSequence) throw new Error("Anvil popup not shown");

  const hammer = world.assertById(popupSequence.particles.hammer);
  const position = sampleMotion(getMotion(hammer)!, world.metadata.elapsed);
  return Math.round(position.x + (hittingWidth + 1) / 2);
};

/**
 * Swing the hammer once it is above one of `hitIndexes` and wait for the next
 * swing.
 */
export const hitAt = (
  world: World,
  anvil: AnvilEntity,
  hitIndexes: number[]
) => {
  advanceUntil(
    world,
    () =>
      anvil[FORGABLE].lastAction === "swing" &&
      hitIndexes.includes(getHammerIndex(world, anvil)),
    5000
  );
  act(world, "right");
  const actualIndex = anvil[FORGABLE].hitIndex;
  advanceUntil(
    world,
    () => !anvil[FORGABLE].lastAction || anvil[FORGABLE].lastAction === "swing",
    5000
  );
  return actualIndex;
};

/** Hit the current step on the anvil. */
export const hitStep = (world: World, anvil: AnvilEntity) => {
  const { offset, width } = anvil[FORGABLE].steps[anvil[FORGABLE].progress];
  return hitAt(
    world,
    anvil,
    Array.from({ length: width }, (_, index) => hittingOffset + offset + index)
  );
};
