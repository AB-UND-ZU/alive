import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Renderable = {
  generation: number;
};

export const RENDERABLE = "RENDERABLE";

export default function addRenderable(world: World, entity: TypedEntity, renderable: Renderable) {
  world.addComponentToEntity(entity, RENDERABLE, renderable);
}
