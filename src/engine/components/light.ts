import { Entity } from "ecs";
import { World } from "../ecs";

export type Light = {
  brightness: number; // for rendered light
  visibility: number; // for fog of war
  darkness: number;
};

export const LIGHT = "LIGHT";

export default function addLight(world: World, entity: Entity, light: Light) {
  world.addComponentToEntity(entity, LIGHT, light);
}
