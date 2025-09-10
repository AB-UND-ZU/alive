import { Entity } from "ecs";
import { World } from "../ecs";

export const npcTypes = [
  "guide",
  "nomad",
  "chief",
  "elder",
  "scout",
  "smith",
  "trader",
  "druid",
  "hunter",
  "mage",
  "bandit",
  "prism",
  "goldPrism",
  "eye",
  "goldEye",
  "orb",
  "goldOrb",
  "diamondOrb",
  "fairy",
  "waveTower",
  "chestBoss",
] as const;
export type NpcType = (typeof npcTypes)[number];

export type Npc = { type: NpcType };

export const NPC = "NPC";

export default function addNpc(world: World, entity: Entity, npc: Npc) {
  world.addComponentToEntity(entity, NPC, npc);
}
