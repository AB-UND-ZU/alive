import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Orientation } from "./orientable";

export type Melee = {
  facing?: Orientation;
  hits: 0;
};

export const MELEE = "MELEE";

export default function addMelee(world: World, entity: TypedEntity, melee: Melee) {
  world.addComponentToEntity(entity, MELEE, melee);
}
