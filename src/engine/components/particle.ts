import { Entity } from "ecs";
import { World } from "../ecs";
import { Point } from "../../game/math/std";

export type Particle = {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  animatedOrigin?: Point;
};

export const PARTICLE = "PARTICLE";

export default function addParticle(
  world: World,
  entity: Entity,
  particle: Particle
) {
  world.addComponentToEntity(entity, PARTICLE, particle);
}
