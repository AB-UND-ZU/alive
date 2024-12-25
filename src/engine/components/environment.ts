import { Entity } from "ecs";
import { World } from "../ecs";

export type Biome = "desert" | "beach"

export type Environment = {
  biomes: Biome[]
};

export const ENVIRONMENT = "ENVIRONMENT";

export default function addEnvironment(
  world: World,
  entity: Entity,
  environment: Environment
) {
  world.addComponentToEntity(entity, ENVIRONMENT, environment);
}
