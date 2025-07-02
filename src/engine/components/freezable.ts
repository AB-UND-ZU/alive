import { Entity } from "ecs";
import { World } from "../ecs";
import { Sprite } from "./sprite";

export type Freezable = {
  frozen: boolean;
  sprite: Sprite;
};

export const FREEZABLE = "FREEZABLE";

export default function addFreezable(
  world: World,
  entity: Entity,
  freezable: Freezable
) {
  world.addComponentToEntity(entity, FREEZABLE, freezable);
}
