import { Entity } from "ecs";
import { World } from "../ecs";
import { Orientation } from "./orientable";

export type Light = {
  brightness: number; // for rendered light
  visibility: number; // for fog of war
  darkness: number;
  orientation?: Orientation // for half blocks
};

export const LIGHT = "LIGHT";

export default function addLight(world: World, entity: Entity, light: Light) {
  world.addComponentToEntity(entity, LIGHT, light);
}
