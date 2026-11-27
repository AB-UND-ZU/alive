import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Orientation } from "./orientable";

export type Bumpable = {
  generation: number;
  orientation?: Orientation;
};

export const BUMPABLE = "BUMPABLE";

export default function addBumpable(
  world: World,
  entity: TypedEntity,
  bumpable: Bumpable
) {
  world.addComponentToEntity(entity, BUMPABLE, bumpable);
}
