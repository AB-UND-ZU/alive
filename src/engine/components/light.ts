import { Entity } from "ecs";
import { World } from "../ecs";

export type Light = {
  brightness: number;
  darkness: number;
};

export const LIGHT = "LIGHT";

export default function addLight(world: World, entity: Entity, light: Light) {
  world.addComponentToEntity(entity, LIGHT, light);
}
