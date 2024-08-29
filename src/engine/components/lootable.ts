import { Entity } from "ecs";
import { World } from "../ecs";

export type Lootable = {
  accessible: boolean;
  target?: number;
};

export const LOOTABLE = "LOOTABLE";

export default function addLootable(
  world: World,
  entity: Entity,
  lootable: Lootable
) {
  world.addComponentToEntity(entity, LOOTABLE, lootable);
}
