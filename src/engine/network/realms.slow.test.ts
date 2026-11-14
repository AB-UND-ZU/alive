import { getIdentifier } from "../utils";
import { INVENTORY } from "../components/inventory";
import { SPAWNABLE } from "../components/spawnable";
import { createHost } from "./host";
import { LEVEL, LevelName } from "../components/level";
import { PLAYER } from "../components/player";
import { POPUP } from "../components/popup";
import { WARPABLE } from "../components/warpable";
import { STATS } from "../components/stats";
import { POSITION } from "../components/position";
import { EQUIPPABLE } from "../components/equippable";
import { ITEM } from "../components/item";
import { initiateWarp } from "../systems/trigger";
import { levelConfig } from "../../game/levels";
import { giveItems, getItems } from "../../testing/harness";
import { createReplica } from "./replica";

type Host = ReturnType<typeof createHost>;
const player = (host: Host, account: string) =>
  host
    .worldFor(account)!
    .assertByIdAndComponents(host.actorId(account), [
      PLAYER,
      STATS,
      POSITION,
      EQUIPPABLE,
      INVENTORY,
      SPAWNABLE,
    ]);
const warp = (host: Host, account: string, level: LevelName) => {
  const world = host.worldFor(account)!;
  const portal = world
    .getEntities([WARPABLE, POPUP])
    .find((portal) => portal[POPUP].tabs.includes("warp"))!;
  expect(portal).toBeDefined();
  portal[POPUP].horizontalIndex = portal[POPUP].tabs.indexOf("warp");
  portal[POPUP].verticalIndezes[portal[POPUP].horizontalIndex] =
    levelConfig[level].mapOffsetY;
  initiateWarp(world, portal, player(host, account));
  host.step();
};

it("transfers one character through a native portal while another remains in the multiplayer menu", () => {
  const host = createHost();
  host.join("first");
  host.join("second");
  const second = player(host, "second");
  warp(host, "first", "LEVEL_TUTORIAL");
  expect(host.worldFor("first")!.metadata.gameEntity[LEVEL].name).toBe(
    "LEVEL_TUTORIAL"
  );
  expect(host.worldFor("second")).toBe(host.world);
  expect(player(host, "second")).toBe(second);
  expect(host.world.getEntities([PLAYER])).toEqual([second]);
  expect(player(host, "first")[PLAYER].accountId).toBe("first");
  const third = host.join("third");
  expect(
    host.world.assertByIdAndComponents(third, [PLAYER])[PLAYER].accountId
  ).toBe("third");
  warp(host, "second", "LEVEL_TUTORIAL");
  expect(host.worldFor("second")).toBe(host.worldFor("first"));
  expect(host.worldFor("first")!.getEntities([PLAYER])).toHaveLength(2);
  for (let tick = 0; tick < 40; tick++) host.step();
});

it("carries inventory, selected equipment, stats and private quick items into an existing realm without applying bonuses twice", () => {
  const host = createHost();
  host.join("first");
  host.join("second");
  warp(host, "first", "LEVEL_TUTORIAL");
  warp(host, "second", "LEVEL_TUTORIAL");
  const world = host.worldFor("first")!;
  const hero = player(host, "first");
  giveItems(world, hero, [
    { weapon: "sword", material: "iron", amount: 1 },
    { accessory: "boots", material: "iron", amount: 1 },
    { accessory: "amulet", material: "iron", amount: 1 },
    { consume: "potion", material: "wood", stat: "hp", amount: 10 },
  ]);
  for (let tick = 0; tick < 30; tick++) host.step();
  hero[STATS].xp = 23;
  hero[PLAYER].quickItems = { "1": { weapon: "sword", material: "iron" } };
  const maxHp = hero[STATS].maxHp;
  const inventory = getItems(world, hero).map(({ carrier, ...item }) => item);
  // A queued native server warp is validated against the current level's exits.
  world.metadata.warpPlayer!(
    world.getEntityId(hero),
    "LEVEL_ISLAND",
    hero.SPAWNABLE.classKey,
    hero.SPAWNABLE.hairColor,
    false
  );
  host.step();
  const nextWorld = host.worldFor("first")!,
    next = player(host, "first");
  expect(nextWorld.metadata.gameEntity[LEVEL].name).toBe("LEVEL_ISLAND");
  expect(getItems(nextWorld, next).map(({ carrier, ...item }) => item)).toEqual(
    inventory
  );
  expect(
    getItems(nextWorld, next).every(
      (item) => item.carrier === nextWorld.getEntityId(next)
    )
  ).toBe(true);
  expect(
    nextWorld.assertByIdAndComponents(next[EQUIPPABLE].weapon, [ITEM])[ITEM]
      .material
  ).toBe("iron");
  for (let tick = 0; tick < 30; tick++) host.step();
  expect(next[STATS].xp).toBe(23);
  expect(next[STATS].maxHp).toBe(maxHp);
  expect(next[PLAYER].quickItems).toEqual({
    "1": { weapon: "sword", material: "iron" },
  });
  expect(host.worldFor("second")).toBe(world);
});

it("persists separate realms and reconnects each character to its own progressed world", () => {
  const host = createHost();
  host.join("first");
  host.join("second");
  warp(host, "first", "LEVEL_TUTORIAL");
  player(host, "first")[STATS].xp = 37;
  const loaded = createHost(host.save());
  expect(loaded.worldFor("first")!.metadata.gameEntity[LEVEL].name).toBe(
    "LEVEL_TUTORIAL"
  );
  expect(loaded.worldFor("second")!.metadata.gameEntity[LEVEL].name).toBe(
    "LEVEL_MENU"
  );
  const first = loaded.join("first");
  expect(
    loaded.worldFor("first")!.assertByIdAndComponents(first, [STATS])[STATS].xp
  ).toBe(37);
  expect(loaded.world.getEntities([PLAYER])).toHaveLength(1);
});

it("replaces colliding replica IDs when changing realms while keeping increasing server timestamps", () => {
  const host = createHost();
  host.join("first");
  const replica = createReplica();
  replica.receive(host.frame("first"));
  const original = replica.world.getEntityById(host.actorId("first"));
  warp(host, "first", "LEVEL_TUTORIAL");
  replica.world.metadata.localPlayerId = host.actorId("first");
  expect(replica.receive(host.frame("first"))).toBe(true);
  expect(replica.world.metadata.gameEntity[LEVEL].name).toBe("LEVEL_TUTORIAL");
  expect(replica.world.getEntityById(host.actorId("first"))).not.toBe(original);
  expect(replica.world.getEntities([PLAYER])).toHaveLength(1);
});

it("brings a late teammate to the shared checkpoint with current quest kill progress", () => {
  const host = createHost();
  host.join("first");
  host.join("second");
  warp(host, "first", "LEVEL_TUTORIAL");
  const world = host.worldFor("first")!;
  const spawn = getIdentifier(world, "spawn")!;
  spawn.POSITION = { x: 0, y: 71 };
  world.metadata.gameEntity[LEVEL].cooperativeDefeated = { banditKnight: 4 };
  warp(host, "second", "LEVEL_TUTORIAL");
  const arriving = player(host, "second");
  expect(arriving[POSITION]).toEqual({ x: 0, y: 71 });
  expect(arriving[PLAYER].defeatedUnits.banditKnight).toBe(4);
});
