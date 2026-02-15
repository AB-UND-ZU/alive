import { Entity } from "ecs";
import { World } from "../ecs";
import { Sprite } from "./sprite";
import { Position } from "./position";

export type Vanishable = {
  type: "plant" | "evaporate";
  spawns: { unit: string; delta: Position }[];
  remains: { sprite: Sprite; delta: Position }[];
  decayed: boolean;
  evaporate?: { sprite: Sprite; fast: boolean };
};

export const VANISHABLE = "VANISHABLE";

export default function addVanishable(
  world: World,
  entity: Entity,
  vanishable: Vanishable
) {
  world.addComponentToEntity(entity, VANISHABLE, vanishable);
}
