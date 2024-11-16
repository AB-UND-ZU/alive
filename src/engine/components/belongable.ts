import { Entity } from "ecs";
import { World } from "../ecs";

export type Tribe =
  | "wild"
  | "unit"
  | "neutral"
  | "fire"
  | "water"
  | "earth"
  | "hostile";

export type Belongable = {
  tribe: Tribe;
};

export const BELONGABLE = "BELONGABLE";

export default function addBelongable(
  world: World,
  entity: Entity,
  belongable: Belongable
) {
  world.addComponentToEntity(entity, BELONGABLE, belongable);
}
