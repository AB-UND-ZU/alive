import { Entity } from "ecs";
import { World } from "../ecs";

export type Map = {
  entities: {},
  listeners: {},
};

export const MAP = "MAP";

export default function addMap(world: World, entity: Entity, map: Map) {
  world.addComponentToEntity(entity, MAP, map);
}
