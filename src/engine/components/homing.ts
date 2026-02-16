import { Entity } from "ecs";
import { World } from "../ecs";
import { Position } from "./position";

export type Homing = {
  type: "oakTower" | "oakHedge" | "oakClover" | "ilexViolet" | "ironDisc" | "goldDisc" | "ironOrbit";
  target?: number;
  positions: Position[];
  ttl?: number;
  generation: number;
  decayedGeneration?: number;
};

export const HOMING = "HOMING";

export default function addHoming(
  world: World,
  entity: Entity,
  homing: Homing
) {
  world.addComponentToEntity(entity, HOMING, homing);
}
