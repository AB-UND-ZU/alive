import { setupTown, skipTo } from "../../features/story/town";
import { countItems, giveItems, step } from "../../testing/harness";
import { createHero } from "./fate";
import { registerEntity } from "./map";
import { completeQuest } from "./trigger";
import { PLAYER } from "../components/player";
import { POPUP } from "../components/popup";
import { STATS } from "../components/stats";
import { LEVEL } from "../components/level";
import {
  shareQuestRewards,
  synchronizeRewards,
  recordDefeat,
} from "./cooperation";
import { createSnapshot, restoreSnapshot } from "../snapshot";

it("gives every character the chief's compass and experience exactly once", () => {
  const { world, hero, chief } = setupTown();
  world.metadata.warpPlayer = () => {};
  const second = createHero(world, hero);
  registerEntity(world, second);
  second[PLAYER].connected = false;
  completeQuest(world, hero, chief);
  for (const actor of [hero, second]) {
    expect(countItems(world, actor, { accessory: "compass" })).toBe(1);
    expect(actor[STATS].xp).toBe(3);
  }
  synchronizeRewards(world);
  expect(countItems(world, second, { accessory: "compass" })).toBe(1);
  expect(second[STATS].xp).toBe(3);
  const late = createHero(world, hero);
  late[PLAYER].rewardOffsets = {};
  registerEntity(world, late);
  synchronizeRewards(world);
  expect(countItems(world, late, { accessory: "compass" })).toBe(1);
  expect(late[STATS].xp).toBe(3);
});

it("shares the chosen quest tool while charging only the completing player", () => {
  const { world, hero, chief } = setupTown();
  world.metadata.warpPlayer = () => {};
  skipTo(world, chief, "wood");
  const second = createHero(world, hero);
  registerEntity(world, second);
  giveItems(world, hero, [
    { stackable: "resource", material: "wood", amount: 1 },
  ]);
  chief[POPUP].selections[0] = [0, 1];
  const choice = chief[POPUP].choices[1];
  expect(choice).toBeDefined();
  completeQuest(world, hero, chief);
  for (const actor of [hero, second]) {
    expect(countItems(world, actor, { tool: choice.tool })).toBe(1);
    expect(countItems(world, actor, { consume: "key", material: "iron" })).toBe(
      1
    );
  }
  expect(
    countItems(world, hero, { stackable: "resource", material: "wood" })
  ).toBe(0);
});

it("defers rewards for a dead character and preserves its receipt through a world restore", () => {
  const { world, hero } = setupTown();
  world.metadata.warpPlayer = () => {};
  const second = createHero(world, hero);
  registerEntity(world, second);
  second[PLAYER].ghost = true;
  shareQuestRewards(world, hero, [{ stackable: "coin", amount: 7 }]);
  expect(countItems(world, second, { stackable: "coin" })).toBe(0);
  const restored = restoreSnapshot(createSnapshot(world));
  restored.metadata.warpPlayer = () => {};
  const player = restored.assertByIdAndComponents(world.getEntityId(second), [
    PLAYER,
    "INVENTORY",
  ]);
  player[PLAYER].ghost = false;
  synchronizeRewards(restored);
  synchronizeRewards(restored);
  expect(countItems(restored, player, { stackable: "coin" })).toBe(7);
});

it("records shared boss quest progress for disconnected teammates", () => {
  const { world, hero } = setupTown();
  world.metadata.warpPlayer = () => {};
  const second = createHero(world, hero);
  registerEntity(world, second);
  second[PLAYER].connected = false;
  recordDefeat(world, "ilexElite");
  expect(hero[PLAYER].defeatedUnits.ilexElite).toBe(1);
  expect(second[PLAYER].defeatedUnits.ilexElite).toBe(1);
  expect(world.metadata.gameEntity[LEVEL].cooperativeDefeated?.ilexElite).toBe(
    1
  );
  step(world, 2);
  expect(second[PLAYER].kills).toBe(1);
});
