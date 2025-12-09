import { Entity } from "ecs";
import { World } from "../ecs";
import { UnitStats } from "./stats";

export type Soul = {
  stats: Pick<UnitStats, "level" | "maxHp" | "maxMp" | "maxXp">;
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
