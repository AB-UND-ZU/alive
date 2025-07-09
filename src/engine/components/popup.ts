import { Entity } from "ecs";
import { World } from "../ecs";
import { Item } from "./item";

export type Deal = {
  item: Omit<Item, "carrier" | "bound">;
  stock: number;
  price: Omit<Item, "carrier" | "bound">[];
};

export type Popup = {
  active: boolean;
  verticalIndex: number;
  deals: Deal[];
  viewpoint: number;
  transaction: "buy" | "sell" | "craft";
};

export const POPUP = "POPUP";

export default function addPopup(
  world: World,
  entity: Entity,
  popup: Popup
) {
  world.addComponentToEntity(entity, POPUP, popup);
}
