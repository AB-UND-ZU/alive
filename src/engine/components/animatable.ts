import { Entity } from "ecs";
import { World } from "../ecs";
import * as animations from "../../game/assets/animations";
import { Orientation } from "./orientable";
import { Sprite } from "./sprite";

export type AnimationArgument = {
  counter: { facing: Orientation; amount: number };
  decay: {};
  collect: { facing: Orientation; itemId: number };
  focus: { offset: number };
  melee: { facing: Orientation };
  quest: { step: string };
  dialog: {
    orientation: Orientation;
    text: Sprite[];
    active: boolean;
    timestamp: number;
    lengthOffset: number;
    after?: number;
    dialog: boolean;
  };
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
