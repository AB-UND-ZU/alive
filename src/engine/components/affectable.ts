import { Entity } from "ecs";
import { World } from "../ecs";

export type Affectable = {
  dot: number;
  burn: number;
  freeze: number;
  procs: Record<string, number>;
};

export const emptyAffectable: Omit<Affectable, "procs"> = {
  dot: 0,
  burn: 0,
  freeze: 0,
};

export const getEmptyAffectable = (): Affectable => ({
  ...emptyAffectable,
  procs: {},
});

export const AFFECTABLE = "AFFECTABLE";

export default function addAffectable(
  world: World,
  entity: Entity,
  affectable: Affectable
) {
  world.addComponentToEntity(entity, AFFECTABLE, affectable);
}
