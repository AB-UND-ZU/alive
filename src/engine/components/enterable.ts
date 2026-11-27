import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Sprite } from "./sprite";
import { Orientation } from "./orientable";

export type Enterable = {
  sprite: Sprite;
  orientation?: Orientation | null;
};

export const ENTERABLE = "ENTERABLE";

export default function addEnterable(
  world: World,
  entity: TypedEntity,
  enterable: Enterable
) {
  world.addComponentToEntity(entity, ENTERABLE, enterable);
}
