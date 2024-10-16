import { Entity } from "ecs";
import { World } from "../ecs";
import * as animations from "../../game/assets/animations";
import { Orientation } from "./orientable";
import { Sprite } from "./sprite";
import { Position } from "./position";
import { Viewable } from "./viewable";
import { Light } from "./light";

export type AnimationArgument = {
  counter: { facing: Orientation; amount: number };
  decay: {};
  burn: { generation: 0 };
  dispose: {};
  revive: {
    tombstoneId: number;
    target: Position;
    viewable: Viewable;
    light: Light;
    compassId?: number;
  };
  collect: { origin: Position; itemId: number; drop?: number };
  unlock: { origin: Position; itemId: number };
  focus: {};
  waypoint: { target: number; distance: number; initialized?: true };
  melee: { facing: Orientation; damage: number };
  quest: { step: string; memory: any; giver: number };
  dialog: {
    orientation?: Orientation;
    text: Sprite[];
    active: boolean;
    timestamp: number;
    lengthOffset: number;
    after?: number;
    isDialog: boolean;
    isIdle: boolean;
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
