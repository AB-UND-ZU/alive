import { Entity } from "ecs";
import { World } from "../ecs";

export type Pattern = {
  name:
    | "passive"
    | "chase"
    | "chase_slow"
    | "prism"
    | "eye"
    | "orb"
    | "fairy"
    | "archer"
    | "rose"
    | "violet"
    | "clover"
    | "wave_tower"
    | "chest_boss"
    | "wait"
    | "action"
    | "invincible"
    | "vulnerable"
    | "move"
    | "kill"
    | "dialog"
    | "lock"
    | "unlock"
    | "collect"
    | "drop"
    | "sell"
    | "enrage"
    | "soothe"
    | "tumbleweed"
    | "spawner"
    | "dummy"
    | "guard"
    | "watch";
  memory: any;
};

export type Behaviour = {
  patterns: Pattern[];
};

export const BEHAVIOUR = "BEHAVIOUR";

export default function addBehaviour(
  world: World,
  entity: Entity,
  behaviour: Behaviour
) {
  world.addComponentToEntity(entity, BEHAVIOUR, behaviour);
}
