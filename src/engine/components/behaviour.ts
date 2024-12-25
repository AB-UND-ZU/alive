import { Entity } from "ecs";
import { World } from "../ecs";

export type Pattern = {
  name:
    | "prism"
    | "eye"
    | "orb"
    | "fairy"
    | "wait"
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
    | "tumbleweed";
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
