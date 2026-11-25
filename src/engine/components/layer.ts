import { Entity } from "ecs";
import { World } from "../ecs";

export type Layer = {
  structure?: number;
};

export const LAYER = "LAYER";

export const isInside = (world: World, entity: Entity) =>
  !!entity[LAYER]?.structure;

export default function addLayer(world: World, entity: Entity, layer: Layer) {
  world.addComponentToEntity(entity, LAYER, layer);
}
