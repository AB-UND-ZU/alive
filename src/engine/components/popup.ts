import { Entity } from "ecs";
import { World } from "../ecs";
import { Item } from "./item";
import { Sprite } from "./sprite";
import { UnitKey } from "../../game/balancing/units";

export type Deal = {
  item: Omit<Item, "carrier" | "bound">;
  stock: number;
  price: Omit<Item, "carrier" | "bound">[];
};

export type Target = {
  unit: UnitKey;
  amount: number;
};

export const shops = ["buy", "sell", "craft"] as const;

const popups = [...shops, "quest", "info"] as const;

export type Popup = {
  active: boolean;
  verticalIndex: number;
  deals: Deal[];
  lines: Sprite[][];
  targets: Target[];
  viewpoint: number;
  transaction: (typeof popups)[number];
};

export const POPUP = "POPUP";

export default function addPopup(world: World, entity: Entity, popup: Popup) {
  world.addComponentToEntity(entity, POPUP, popup);
}
