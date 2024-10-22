import { Entity } from "ecs";
import { World } from "../ecs";

export type Soul = {
  ready: boolean;
  tombstoneId?: number;
};

export const SOUL = "SOUL";

export default function addSoul(
  world: World,
  entity: Entity,
  soul: Soul
) {
  world.addComponentToEntity(entity, SOUL, soul);
}
