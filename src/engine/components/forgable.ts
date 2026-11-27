import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Item } from "./item";

export type ForgeStep = {
  item: Omit<Item, "carrier" | "bound" | "amount">;
  width: number;
  offset: number;
  misses?: ("miss" | "ouch")[];
  result?: "hit" | "ace" | "failed";
};

export type Forgable = {
  steps: ForgeStep[];
  progress: number;
  lastElapsed: number;
  lastAction?: "swing" | "trigger" | "hit" | "miss" | "ouch";
  target?: number;
  xp?: number;
  imperfect?: boolean;
  hitIndex?: number;
  completed?: Omit<Item, "carrier" | "bound" | "amount">;
};

export const FORGABLE = "FORGABLE";

export default function addForgable(
  world: World,
  entity: TypedEntity,
  forgable: Forgable
) {
  world.addComponentToEntity(entity, FORGABLE, forgable);
}
