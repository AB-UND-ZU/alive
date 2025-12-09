import { Entity } from "ecs";
import { World } from "../ecs";
import { UnitKey } from "../../game/balancing/units";
import { Countable } from "./stats";
import { Castable } from "./castable";

export type Player = {
  ghost: boolean;
  receivedStats: Record<
    keyof (Pick<Countable, "hp" | "maxHp" | "mp" | "maxMp" | "xp"> &
      Pick<Castable, "melee" | "magic">),
    number
  >;
  popup?: number;
  inspectTriggered: boolean;
  defeatedUnits: Partial<Record<UnitKey, number>>;
};

export const emptyReceivedStats = {
  hp: 0,
  maxHp: 0,
  mp: 0,
  maxMp: 0,
  xp: 0,
  melee: 0,
  magic: 0,
  heal: 0,
};

export const PLAYER = "PLAYER";

export default function addPlayer(
  world: World,
  entity: Entity,
  player: Player
) {
  world.addComponentToEntity(entity, PLAYER, player);
}
