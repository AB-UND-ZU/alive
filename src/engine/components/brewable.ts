import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Item } from "./item";

export type Brewable = {
  queue: {
    item: Omit<Item, "carrier" | "bound">;
    generation?: number;
    duration: number;
  }[];
};

export const BREWABLE = "BREWABLE";

export default function addBrewable(
  world: World,
  entity: TypedEntity,
  brewable: Brewable
) {
  world.addComponentToEntity(entity, BREWABLE, brewable);
}
