import { Entity } from "ecs";
import { World } from "../ecs";
import * as animations from "../../game/assets/animations";
import { Orientation } from "./orientable";

export type AnimationArgument = {
  melee: { facing: Orientation };
  counter: { facing: Orientation; amount: number };
};
export type AnimationState<A extends keyof AnimationArgument> = {
  name: keyof typeof animations; // TODO: only allow valid keys
  reference: number;
  elapsed: number;
  args: AnimationArgument[A];
  particles: Record<string, number>;
};
export type Animation<K extends keyof AnimationArgument> = (
  world: World,
  entity: Entity,
  state: AnimationState<K>
) => { finished: boolean; updated: boolean };

export type Animatable = {
  states: Partial<{
    [A in keyof AnimationArgument]: AnimationState<A>;
  }>;
};

export const ANIMATABLE = "ANIMATABLE";

export default function addAnimatable(
  world: World,
  entity: Entity,
  animatable: Animatable
) {
  world.addComponentToEntity(entity, ANIMATABLE, animatable);
}
