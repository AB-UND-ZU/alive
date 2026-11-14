import { World } from "../ecs";
import { Entity } from "ecs";
import { LEVEL } from "../components/level";
import { PLAYER } from "../components/player";
import { INVENTORY } from "../components/inventory";
import { STATS } from "../components/stats";
import { Item } from "../components/item";
import { UnitKey } from "../../game/balancing/units";
import { grantInventoryItem } from "./collect";
import { rerenderEntity } from "./renderer";

export const synchronizeRewards = (world: World) => {
  if (!world.metadata.warpPlayer) return;
  const level = world.metadata.gameEntity[LEVEL];
  const rewards = level.cooperativeRewards || [];
  for (const player of world.getEntities([PLAYER, INVENTORY, STATS])) {
    if (player[PLAYER].ghost || player[STATS].hp <= 0) continue;
    const offsets = (player[PLAYER].rewardOffsets ||= {});
    for (
      let index = offsets[level.name] || 0;
      index < rewards.length;
      index++
    ) {
      for (const item of rewards[index])
        grantInventoryItem(world, player, item);
      offsets[level.name] = index + 1;
    }
  }
};

export const shareQuestRewards = (
  world: World,
  player: Entity,
  items: Omit<Item, "carrier" | "bound">[]
) => {
  if (!world.metadata.warpPlayer || !items.length) return;
  const level = world.metadata.gameEntity[LEVEL];
  const rewards = (level.cooperativeRewards ||= []);
  rewards.push(items.map((item) => ({ ...item })));
  (player[PLAYER]!.rewardOffsets ||= {})[level.name] = rewards.length;
  synchronizeRewards(world);
};

export const recordDefeat = (world: World, unit: UnitKey) => {
  const players = world.metadata.warpPlayer
    ? world.getEntities([PLAYER])
    : [world.getEntity([PLAYER])].filter(Boolean);
  if (world.metadata.warpPlayer) {
    const totals = (world.metadata.gameEntity[LEVEL].cooperativeDefeated ||=
      {});
    totals[unit] = (totals[unit] || 0) + 1;
  }
  for (const player of players) {
    if (!player) continue;
    player[PLAYER].defeatedUnits[unit] =
      (player[PLAYER].defeatedUnits[unit] || 0) + 1;
    player[PLAYER].kills += 1;
    rerenderEntity(world, player);
  }
};

export default function setupCooperation(world: World) {
  return { onUpdate: () => synchronizeRewards(world) };
}
