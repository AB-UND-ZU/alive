import { Entity } from "ecs";
import { World } from "../ecs";

export type Particle = {
  offsetX: number;
  offsetY: number;
  animated: boolean;
};

export const PARTICLE = "PARTICLE";

export default function addParticle(
  world: World,
  entity: Entity,
  particle: Particle
) {
  world.addComponentToEntity(entity, PARTICLE, particle);
}
