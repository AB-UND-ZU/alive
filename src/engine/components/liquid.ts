import { Entity } from "ecs";
import { World } from "../ecs";

export type Liquid = {};

export const LIQUID = "LIQUID";

export default function addLiquid(
  world: World,
  entity: Entity,
  liquid: Liquid
) {
  world.addComponentToEntity(entity, LIQUID, liquid);
}
