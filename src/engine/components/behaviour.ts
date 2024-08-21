import { Entity } from "ecs";
import { World } from "../ecs";

type Pattern = 'triangle';

export type Behaviour = {
  patterns: Pattern[]
};

export const BEHAVIOUR = "BEHAVIOUR";

export default function addCollidable(
  world: World,
  entity: Entity,
  behaviour: Behaviour
) {
  world.addComponentToEntity(entity, BEHAVIOUR, behaviour);
}
