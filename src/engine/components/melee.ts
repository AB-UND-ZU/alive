import { Entity } from "ecs";
import { World } from "../ecs";
import { Orientation } from "./orientable";

export type Melee = {
  facing?: Orientation,
  bumpGeneration: number,
};

export const MELEE = "MELEE";

export default function addMelee(world: World, entity: Entity, melee: Melee) {
  world.addComponentToEntity(entity, MELEE, melee);
}
