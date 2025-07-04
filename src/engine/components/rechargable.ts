import { Entity } from "ecs";
import { World } from "../ecs";

export type Rechargable = {
  hit: boolean;
};

export const RECHARGABLE = "RECHARGABLE";

export default function addRechargable(
  world: World,
  entity: Entity,
  rechargable: Rechargable
) {
  world.addComponentToEntity(entity, RECHARGABLE, rechargable);
}
