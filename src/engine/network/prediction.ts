import type { World } from "../ecs";
import type { StateFrame } from "./replica";
import type { Orientation } from "../components/orientable";
import { orientationPoints } from "../components/orientable";
import { Position } from "../components/position";
import { getLocalPlayer } from "../players";
import { isActionable } from "../systems/freeze";
import { isWalkable } from "../systems/movement";
import { normalize, signedDistance } from "../../game/math/std";
import {
  getMotion,
  previewBump,
  moveMotion,
  retargetMotion,
  setPredictedPosition,
  updateCameraMotion,
} from "../motion";

/** One speculative visual step; confirmed components are never modified. */
export const createPrediction = (world: World) => {
  let nextActionAt = 0;
  let pending:
    | {
        actor: NonNullable<ReturnType<typeof actor>>;
        to: Position;
        sequence: number;
      }
    | undefined;
  const actor = () => getLocalPlayer(world, ["POSITION", "MOVABLE", "PLAYER"]);
  const targetMotion = (
    entity: NonNullable<ReturnType<typeof actor>>,
    position: Position
  ) => {
    const size = world.metadata.gameEntity.LEVEL.size;
    if (!getMotion(entity))
      moveMotion(world, entity, entity.POSITION.x, entity.POSITION.y, size);
    const motion = getMotion(entity);
    if (motion)
      retargetMotion(
        motion,
        motion.x + signedDistance(motion.x, position.x, size),
        motion.y + signedDistance(motion.y, position.y, size),
        world.metadata.renderTime
      );
    updateCameraMotion(world, true, world.metadata.renderTime);
  };
  const cancel = () => {
    if (!pending) return;
    const { actor } = pending;
    setPredictedPosition(actor);
    targetMotion(actor, actor.POSITION);
    pending = undefined;
  };
  const move = (held: Orientation[], sequence: number) => {
    const hero = actor();
    if (
      pending ||
      !hero ||
      !held.length ||
      hero.PLAYER.popup ||
      hero.PLAYER.mount ||
      hero.PLAYER.ghost ||
      !isActionable(world, hero)
    )
      return;
    const reference = world.getEntityById(hero.MOVABLE.reference)?.REFERENCE;
    if (!reference) return;
    const offset = orientationPoints[held[0]],
      size = world.metadata.gameEntity.LEVEL.size;
    const to = {
      x: normalize(hero.POSITION.x + offset.x, size),
      y: normalize(hero.POSITION.y + offset.y, size),
    };
    if (!isWalkable(world, to, hero)) return;
    pending = {
      actor: hero,
      to,
      sequence: sequence,
    };
    setPredictedPosition(hero, to);
    targetMotion(hero, to);
  };
  return {
    move,
    action(kind: string) {
      const hero = actor();
      if (
        hero &&
        !hero.PLAYER.popup &&
        isActionable(world, hero) &&
        (kind === "spell" || kind === "skill") &&
        world.metadata.renderTime >= nextActionAt &&
        (hero.ACTIONABLE?.[kind] || (kind === "skill" && hero.ACTIONABLE?.tool))
      ) {
        nextActionAt =
          world.metadata.renderTime +
          (world.getEntityById(hero.MOVABLE.reference)?.REFERENCE?.tick || 350);
        previewBump(world, hero, hero.ORIENTABLE?.facing || "up");
      }
    },
    receive(frame: StateFrame, reset: boolean) {
      if (reset) {
        cancel();
        return;
      }
      if (!pending) return;
      const { actor, to, sequence } = pending;
      if ((frame.movementSequence ?? -1) < sequence) return;
      if (actor.POSITION.x === to.x && actor.POSITION.y === to.y) {
        setPredictedPosition(actor);
        pending = undefined;
      } else cancel();
    },
    owns(id: number) {
      return !!pending && world.getEntityId(pending.actor) === id;
    },
    clear() {
      cancel();
      nextActionAt = 0;
    },
  };
};
