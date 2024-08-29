import { Entity } from "ecs";
import { World } from "../ecs";

export type Lootable = {};

export const LOOTABLE = "LOOTABLE";

export default function addLootable(
  world: World,
  entity: Entity,
  lootable: Lootable
) {
  world.addComponentToEntity(entity, LOOTABLE, lootable);
}
