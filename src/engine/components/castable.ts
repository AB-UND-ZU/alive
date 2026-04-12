import { Entity } from "ecs";
import { World } from "../ecs";

export type DamageType = "melee" | "magic" | "true";
export type EffectType = "burn" | "freeze" | "heal";
export type ProcStats = { drain: number; knock: number };
export type BuffStats = {
  addHaste: number;
  addPower: number;
  addArmor: number;
  addWisdom: number;
  addResist: number;
};
export type AbilityStats = {
  duration: number;
  range: number;
  retrigger: number;
  reproc: number;
};

export const emptyProcStats = { drain: 0, knock: 0 };
export const emptyBuffStats = {
  addHaste: 0,
  addPower: 0,
  addArmor: 0,
  addWisdom: 0,
  addResist: 0,
};
export const emptyAbilityStats = {
  duration: 0,
  range: 0,
  retrigger: 0,
  reproc: 0,
};

export type Castable = {
  [K in DamageType]: number;
} & {
  [K in EffectType]: number;
} & ProcStats &
  BuffStats & {
    caster: number;
    retrigger: number;
    reproc: number;
    forceAffecting: boolean;
    affected: Record<
      string,
      { generation: number; delta: number; frame?: number }
    >;
  };

export const emptyCastable: Omit<Castable, "caster" | "affected"> = {
  forceAffecting: false,
  retrigger: 0,
  reproc: 0,
  melee: 0,
  magic: 0,
  true: 0,
  burn: 0,
  freeze: 0,
  heal: 0,
  ...emptyProcStats,
  ...emptyBuffStats,
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
