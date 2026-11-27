import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Layer = {
  structure?: number;
};

export const LAYER = "LAYER";

export const isInside = (world: World, entity: TypedEntity) =>
  !!entity[LAYER]?.structure;

export default function addLayer(world: World, entity: TypedEntity, layer: Layer) {
  world.addComponentToEntity(entity, LAYER, layer);
}
