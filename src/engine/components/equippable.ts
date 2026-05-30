import { Entity } from "ecs";
import { World } from "../ecs";

export const gear = ["weapon", "offhand", "spell", "skill", "tool"] as const;
export const slots = ["accessory", ...gear] as const;
export const accessories = [
  "ring",
  "amulet",
  "torch",
  "compass",
  "boots",
  "map",
] as const;
export const equipments = [...gear, ...accessories];

export type Slot = (typeof slots)[number];
export type Gear = (typeof gear)[number];
export type Accessory = (typeof accessories)[number];
export type Equipment = (typeof equipments)[number];

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
