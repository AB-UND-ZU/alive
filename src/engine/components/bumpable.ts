import { Entity } from "ecs";
import { World } from "../ecs";
import { Orientation } from "./orientable";

export type Bumpable = {
  generation: number;
  orientation?: Orientation;
};

export const BUMPABLE = "BUMPABLE";

export default function addBumpable(
  world: World,
  entity: Entity,
  bumpable: Bumpable
) {
  world.addComponentToEntity(entity, BUMPABLE, bumpable);
}
