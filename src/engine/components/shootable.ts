import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Shootable = {
  shots: number;
};

export const SHOOTABLE = "SHOOTABLE";

export default function addShootable(
  world: World,
  entity: TypedEntity,
  shootable: Shootable
) {
  world.addComponentToEntity(entity, SHOOTABLE, shootable);
}
