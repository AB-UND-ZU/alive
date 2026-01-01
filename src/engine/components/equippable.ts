import { Entity } from "ecs";
import { World } from "../ecs";

export type Gear = "sword" | "shield" | "ring" | "amulet";
export type Tools = "torch" | "compass" | "boots";
export type Equipment = Gear | Tools | "primary" | "secondary";

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
