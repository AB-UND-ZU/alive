import { Entity } from "ecs";
import { World } from "../ecs";
import { Sprite } from "./sprite";

export type Poi = {
  sprite: Sprite;
};

export const POI = "POI";

export default function addPoi(world: World, entity: Entity, poi: Poi) {
  world.addComponentToEntity(entity, POI, poi);
}
