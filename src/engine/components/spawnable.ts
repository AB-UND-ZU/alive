import { Entity } from "ecs";
import { World } from "../ecs";
import { Position } from "./position";
import { Light } from "./light";
import { Viewable } from "./viewable";

export type Spawnable = {
  position: Position;
  light: Light;
  viewable: Viewable;
  compassId?: number;
};

export const SPAWNABLE = "SPAWNABLE";

export default function addSpawnable(
  world: World,
  entity: Entity,
  spawnable: Spawnable
) {
  world.addComponentToEntity(entity, SPAWNABLE, spawnable);
}
