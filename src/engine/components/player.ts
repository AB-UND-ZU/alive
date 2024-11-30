import { Entity } from "ecs";
import { World } from "../ecs";

export type Player = {
  ghost: boolean;
  inside: boolean;
  flying: boolean;
};

export const PLAYER = "PLAYER";

export default function addPlayer(
  world: World,
  entity: Entity,
  player: Player
) {
  world.addComponentToEntity(entity, PLAYER, player);
}
