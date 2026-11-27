import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Blockable = {};

export const BLOCKABLE = "BLOCKABLE";

export default function addBlockable(
  world: World,
  entity: TypedEntity,
  blockable: Blockable
) {
  world.addComponentToEntity(entity, BLOCKABLE, blockable);
}
