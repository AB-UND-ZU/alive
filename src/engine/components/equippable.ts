import { Entity } from "ecs";
import { World } from "../ecs";

export type Gear = "sword" | "shield";
export type Slot = Gear | "active" | "passive";
export type Tools = "compass" | "map" | "haste" | "torch";
export type Equipment = Slot | Tools

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
