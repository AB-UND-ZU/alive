import { Entity } from "ecs";
import { World } from "../ecs";

export type Npc = {};

export const NPC = "NPC";

export default function addNpc(world: World, entity: Entity, npc: Npc) {
  world.addComponentToEntity(entity, NPC, npc);
}
