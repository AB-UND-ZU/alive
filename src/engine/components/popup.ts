import { Entity } from "ecs";
import { World } from "../ecs";
import { Item } from "./item";
import { Sprite } from "./sprite";
import { UnitKey } from "../../game/balancing/units";

export type Deal = {
  item: Omit<Item, "carrier" | "bound">;
  stock: number;
  prices: Omit<Item, "carrier" | "bound">[];
  carrier?: number;
};

export type Recipe = {
  item: Omit<Item, "carrier" | "bound">;
  options: Omit<Item, "carrier" | "bound">[][];
};

export type Target = {
  unit: UnitKey;
  amount: number;
};

export const shops = ["buy", "sell"] as const;

const popups = [
  ...shops,
  "craft",
  "forge",
  "quest",
  "info",
  "inspect",
  "stats",
  "gear",
  "class",
  "warp",
] as const;

export type Popup = {
  active: boolean;
  verticalIndezes: number[];
  horizontalIndex: number;
  selections: number[][];
  deals: Deal[];
  recipes: Recipe[];
  lines: Sprite[][][];
  targets: Target[];
  viewpoint: number;
  tabs: (typeof popups)[number][];
};

export const POPUP = "POPUP";

export default function addPopup(world: World, entity: Entity, popup: Popup) {
  world.addComponentToEntity(entity, POPUP, popup);
}
