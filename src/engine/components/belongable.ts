import { Entity } from "ecs";
import { World } from "../ecs";

export const tribes = ["settler", "nomad", "fire", "water", "earth"] as const;
export const enemies = ["wild", "hostile"] as const;
export const neutrals = ["unit"] as const;

export type Faction =
  | (typeof tribes)[number]
  | (typeof enemies)[number]
  | (typeof neutrals)[number];

export type Belongable = {
  faction: Faction;
};

export const BELONGABLE = "BELONGABLE";

export default function addBelongable(
  world: World,
  entity: Entity,
  belongable: Belongable
) {
  world.addComponentToEntity(entity, BELONGABLE, belongable);
}
