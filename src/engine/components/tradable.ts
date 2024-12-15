import { Entity } from "ecs";
import { World } from "../ecs";
import { Item } from "./item";

export type Tradable = {
  activation: Omit<Item, "carrier" | "bound">[];
  stock: number;
};

export const TRADABLE = "TRADABLE";

export default function addTradable(
  world: World,
  entity: Entity,
  tradable: Tradable
) {
  world.addComponentToEntity(entity, TRADABLE, tradable);
}
