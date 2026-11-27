import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Sprite } from "./sprite";
import { Position } from "./position";
import { CellType } from "../../bindings/creation";

export type Vanishable = {
  type: "plant" | "evaporate";
  color?: string;
  cells: { cell: CellType; delta: Position }[];
  decayed: boolean;
  evaporate?: { sprite: Sprite; fast: boolean };
};

export const VANISHABLE = "VANISHABLE";

export default function addVanishable(
  world: World,
  entity: TypedEntity,
  vanishable: Vanishable
) {
  world.addComponentToEntity(entity, VANISHABLE, vanishable);
}
