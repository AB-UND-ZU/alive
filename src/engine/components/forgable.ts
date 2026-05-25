import { Entity } from "ecs";
import { World } from "../ecs";
import { Item } from "./item";

export type ForgeStep = {
  item: Omit<Item, "carrier" | "bound" | "amount">;
  width: number;
  offset: number;
};

export type Forgable = {
  steps: ForgeStep[];
  progress: number;
  lastElapsed: number;
  lastAction?: "swing" | "trigger" | "hit" | "miss";
  hitIndex?: number;
  completed?: Omit<Item, "carrier" | "bound" | "amount">;
};

export const FORGABLE = "FORGABLE";

export default function addForgable(
  world: World,
  entity: Entity,
  forgable: Forgable
) {
  world.addComponentToEntity(entity, FORGABLE, forgable);
}
