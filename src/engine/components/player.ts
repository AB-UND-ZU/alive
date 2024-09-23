import { Entity } from "ecs";
import { World } from "../ecs";

export type Player = {};

export const PLAYER = "PLAYER";

export default function addPlayer(
  world: World,
  entity: Entity,
  player: Player
) {
  world.addComponentToEntity(entity, PLAYER, player);
}
