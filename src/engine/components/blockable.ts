import { Entity } from "ecs";
import { World } from "../ecs";

export type Blockable = {};

export const BLOCKABLE = "BLOCKABLE";

export default function addBlockable(
  world: World,
  entity: Entity,
  blockable: Blockable
) {
  world.addComponentToEntity(entity, BLOCKABLE, blockable);
}
