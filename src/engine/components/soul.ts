import type { TypedEntity } from "../entities";
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
  entity: TypedEntity,
  soul: Soul
) {
  world.addComponentToEntity(entity, SOUL, soul);
}
