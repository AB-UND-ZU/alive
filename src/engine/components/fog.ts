import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Fog = {
  visibility: "hidden" | "fog" | "visible";
  type: "air" | "terrain" | "object" | "unit" | "float";
  fixed?: boolean;
};

export const FOG = "FOG";

export default function addFog(world: World, entity: TypedEntity, fog: Fog) {
  world.addComponentToEntity(entity, FOG, fog);
}
