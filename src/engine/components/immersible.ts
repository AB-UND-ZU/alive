import { Entity } from "ecs";
import { World } from "../ecs";

export type Immersible = {};

export const IMMERSIBLE = "IMMERSIBLE";

export default function addImmersible(
  world: World,
  entity: Entity,
  immersible: Immersible
) {
  world.addComponentToEntity(entity, IMMERSIBLE, immersible);
}
