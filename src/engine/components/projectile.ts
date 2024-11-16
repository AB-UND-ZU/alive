import { Entity } from "ecs";
import { World } from "../ecs";
import { Material } from "./item";

export type Projectile = {
  damage: number;
  material?: Material;
};

export const PROJECTILE = "PROJECTILE";

export default function addProjectile(
  world: World,
  entity: Entity,
  projectile: Projectile
) {
  world.addComponentToEntity(entity, PROJECTILE, projectile);
}
