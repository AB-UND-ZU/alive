import { Entity } from "ecs";
import { World } from "../ecs";

export type Melee = {
  item: number
};

export const MELEE = "MELEE";

export default function addMelee(world: World, entity: Entity, melee: Melee) {
  world.addComponentToEntity(entity, MELEE, melee);
}
