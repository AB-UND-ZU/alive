import { Entity } from "ecs";
import { World } from "../ecs";

export type DamageType = "physical" | "magic" | "true";

export type Castable = {
  caster: number;
  affected: Record<string, number>;
  damage: number;
  burn: number;
  freeze: number;
  heal: number;
  medium: DamageType;
};

export const CASTABLE = "CASTABLE";

export default function addCastable(
  world: World,
  entity: Entity,
  castable: Castable
) {
  world.addComponentToEntity(entity, CASTABLE, castable);
}
