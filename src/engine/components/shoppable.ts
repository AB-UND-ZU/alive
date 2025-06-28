import { Entity } from "ecs";
import { World } from "../ecs";
import { Item } from "./item";

export type Deal = {
  item: Omit<Item, "carrier" | "bound">;
  stock: number;
  price: Omit<Item, "carrier" | "bound">[];
};

export type Shoppable = {
  active: boolean;
  selectedIndex: number;
  deals: Deal[];
  viewpoint: number;
};

export const SHOPPABLE = "SHOPPABLE";

export default function addShoppable(
  world: World,
  entity: Entity,
  shoppable: Shoppable
) {
  world.addComponentToEntity(entity, SHOPPABLE, shoppable);
}
