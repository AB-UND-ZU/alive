import { Entity } from "ecs";
import { World } from "../ecs";

export type Bubble = {};

export const BUBBLE = "BUBBLE";

export default function addBubble(
  world: World,
  entity: Entity,
  bubble: Bubble
) {
  world.addComponentToEntity(entity, BUBBLE, bubble);
}
