import { Entity } from "ecs";
import { World } from "../ecs";

export type Gear = "weapon" | "shield" | "ring" | "amulet";
export type Slots = "torch" | "compass" | "boots" | "map" | "tool";
export type Equipment = Gear | Slots | "spell" | "skill";

export type Equippable = {
  [key in Equipment]?: number;
};

export const EQUIPPABLE = "EQUIPPABLE";

export default function addEquippable(
  world: World,
  entity: Entity,
  equippable: Equippable
) {
  world.addComponentToEntity(entity, EQUIPPABLE, equippable);
}
