import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Fishable = {
  population: number;
};

export const FISHABLE = "FISHABLE";

export default function addFishable(
  world: World,
  entity: TypedEntity,
  fishable: Fishable
) {
  world.addComponentToEntity(entity, FISHABLE, fishable);
}
