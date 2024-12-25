import { Entity } from "ecs";
import { World } from "../ecs";

export const handhelds = ["sword", "shield"] as const;
export type Handheld = (typeof handhelds)[number];
export const gears = [...handhelds, "torch", "map", "compass"] as const;
export type Gear = (typeof gears)[number];
export type Equipment = Gear | "active" | "passive";

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
