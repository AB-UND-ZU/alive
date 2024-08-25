import { Animation } from "../../engine/components/animatable";
import { ORIENTABLE } from "../../engine/components/orientable";

export const swordAttack: Animation<"melee"> = (world, entity, state) => {
  // align sword with facing direction
  const finished = state.elapsed > 150;
  const currentFacing = entity[ORIENTABLE].facing;
  const facing = finished ? undefined : state.args.facing;
  const updated = currentFacing !== facing;

  if (updated) {
    entity[ORIENTABLE].facing = facing;
  }

  return { finished, updated };
};

export const damageHit: Animation<"hit"> = (world, entity, state) => {
  return { finished: state.elapsed > 150, updated: false };
};
