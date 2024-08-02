import { Entity } from "ecs";
import { World } from "../ecs";

export type Renderable = {
  generation: number;
};

export const RENDERABLE = "RENDERABLE";

export default function addRenderable(world: World, entity: Entity, renderable: Renderable) {
  world.addComponentToEntity(entity, RENDERABLE, renderable);
}
