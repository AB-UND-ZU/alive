import { Entity } from "ecs";
import { World } from "../ecs";

export type Item = {
  dmg: number;
};

export const ITEM = "ITEM";

export default function addItem(world: World, entity: Entity, item: Item) {
  world.addComponentToEntity(entity, ITEM, item);
}
