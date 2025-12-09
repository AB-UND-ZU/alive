import { Entity } from "ecs";
import { World } from "../ecs";

export type DamageType = "melee" | "magic" | "true";
export type EffectType = "burn" | "freeze" | "heal";

export type Castable = {
  [K in DamageType]: number;
} & {
  [K in EffectType]: number;
} & {
  caster: number;
  affected: Record<string, number>;
};

export const emptyCastable: Omit<Castable, "caster" | "affected"> = {
  melee: 0,
  magic: 0,
  true: 0,
  burn: 0,
  freeze: 0,
  heal: 0,
};

export const getEmptyCastable = (world: World, entity: Entity): Castable => ({
  ...emptyCastable,
  caster: world.getEntityId(entity),
  affected: {},
});

export const CASTABLE = "CASTABLE";

export default function addCastable(
  world: World,
  entity: Entity,
  castable: Castable
) {
  world.addComponentToEntity(entity, CASTABLE, castable);
}
