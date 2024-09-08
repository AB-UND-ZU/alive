import { Entity } from "ecs";
import { World } from "../ecs";

export type Reference = {
  tick: number;
  delta: number;
  suspended: boolean;
  suspensionCounter: number;
};

export const isProcessable = (reference: Reference) =>
  reference.tick > 0 && reference.delta >= reference.tick;

export const REFERENCE = "REFERENCE";

export default function addReference(
  world: World,
  entity: Entity,
  reference: Reference
) {
  world.addComponentToEntity(entity, REFERENCE, reference);
}
