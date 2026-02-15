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
    | "ilex"
    | "oak_boss"
    | "oak_tower"
    | "oak_clover"
    | "worm_boss"
    | "chest_boss"
    | "wave_tower"
    | "wait"
    | "action"
    | "invincible"
    | "vulnerable"
    | "move"
    | "kill"
    | "heal"
    | "dialog"
    | "shout"
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
