import { Entity } from "ecs";
import { World } from "../ecs";

export type Equippable = {
  melee?: number;
  key?: number;
};

export const EQUIPPABLE = "EQUIPPABLE";

export default function addEquippable(
  world: World,
  entity: Entity,
  equippable: Equippable
) {
  world.addComponentToEntity(entity, EQUIPPABLE, equippable);
}
