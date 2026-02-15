import { Entity } from "ecs";
import { World } from "../ecs";

export const npcTypes = [
  "dummy",
  "guide",
  "earthSmith",
  "earthTrader",
  "earthDruid",
  "earthChief",
  "earthGuard",
  "banditKnight",
  "banditArcher",
  "prism",
  "goldPrism",
  "eye",
  "goldEye",
  "orb",
  "goldOrb",
  "diamondOrb",
  "fairy",
  "rose",
  "violet",
  "clover",
  "tutorialBoss",
  "ilexElite",
  "oakBoss",
  "oakTower",
  "oakClover",
  "wormBoss",
  "chestBoss",
  "waveTower",
] as const;
export type NpcType = (typeof npcTypes)[number];

export type Npc = { type: NpcType };

export const NPC = "NPC";

export default function addNpc(world: World, entity: Entity, npc: Npc) {
  world.addComponentToEntity(entity, NPC, npc);
}
