import { Entity } from "ecs";
import { World } from "../ecs";
import { Sprite } from "./sprite";
import { UnitKey } from "../../game/balancing/units";
import { Position } from "./position";

export type Vanishable = {
  spawns: { unit: UnitKey; delta: Position }[];
  remains: { sprite: Sprite; delta: Position }[];
  decayed: boolean;
};

export const VANISHABLE = "VANISHABLE";

export default function addVanishable(
  world: World,
  entity: Entity,
  vanishable: Vanishable
) {
  world.addComponentToEntity(entity, VANISHABLE, vanishable);
}
