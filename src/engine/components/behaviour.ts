import { Entity } from "ecs";
import { World } from "../ecs";

type Pattern = {
  name: 'triangle' | 'move' | 'kill' | 'dialog' | 'lock' | 'unlock' | 'collect' | 'drop' | 'sell';
  memory: any;
}

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
