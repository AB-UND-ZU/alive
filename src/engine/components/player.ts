import { Entity } from "ecs";
import { World } from "../ecs";
import { UnitKey } from "../../game/balancing/units";

export type Player = {
  ghost: boolean;
  damageReceived: number;
  healingReceived: number;
  popup?: number;
  defeatedUnits: Partial<Record<UnitKey, number>>;
};

export const PLAYER = "PLAYER";

export default function addPlayer(
  world: World,
  entity: Entity,
  player: Player
) {
  world.addComponentToEntity(entity, PLAYER, player);
}
