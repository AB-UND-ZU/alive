import { Entity } from "ecs";
import { World } from "../ecs";

export type Particle = {
  ttl: number;
  reference: number;
};

export const PARTICLE = "PARTICLE";

export default function addParticle(
  world: World,
  entity: Entity,
  particle: Particle
) {
  world.addComponentToEntity(entity, PARTICLE, particle);
}
