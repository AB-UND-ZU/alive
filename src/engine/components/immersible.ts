import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Immersible = {
  type: "water";
  deep: boolean;
};

export const IMMERSIBLE = "IMMERSIBLE";

export default function addImmersible(
  world: World,
  entity: TypedEntity,
  immersible: Immersible
) {
  world.addComponentToEntity(entity, IMMERSIBLE, immersible);
}
