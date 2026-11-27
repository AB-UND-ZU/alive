import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Material } from "./item";

export type Projectile = {
  damage: number;
  material: Material;
  moved: boolean;
  shadow: boolean;
};

export const PROJECTILE = "PROJECTILE";

export default function addProjectile(
  world: World,
  entity: TypedEntity,
  projectile: Projectile
) {
  world.addComponentToEntity(entity, PROJECTILE, projectile);
}
