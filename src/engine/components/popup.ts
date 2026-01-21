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

export type Objective =
  | {
      item: Omit<Item, "carrier" | "bound" | "amount">;
      identifier?: never;
      title?: Sprite[];
      description?: Sprite[][];
      available: boolean;
    }
  | {
      item?: never;
      identifier?: string;
      title: Sprite[];
      description: Sprite[][];
      available: boolean;
    };

export const shops = ["buy", "sell"] as const;

const popups = [
  ...shops,
  "craft",
  "forge",
  "quest",
  "info",
  "talk",
  "inspect",
  "stats",
  "gear",
  "map",
  "class",
  "style",
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
  objectives: Objective[];
  choices: Omit<Item, "carrier" | "bound">[];
  viewpoint: number;
  tabs: (typeof popups)[number][];
};

export const POPUP = "POPUP";

export default function addPopup(world: World, entity: Entity, popup: Popup) {
  world.addComponentToEntity(entity, POPUP, popup);
}
