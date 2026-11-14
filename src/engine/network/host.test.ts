import { moveEntity } from "../systems/map";
import { isWalkable } from "../systems/movement";
import { getClosestPlayer } from "../players";
import { openPopup } from "../systems/popup";
import { POPUP } from "../components/popup";
import { createHost } from "./host";
import { PLAYER } from "../components/player";
import { POSITION } from "../components/position";

it("owns independent actors and keeps them available for authenticated reconnects", () => {
  const host = createHost();
  const first = host.join("first");
  const second = host.join("second");
  expect(first).not.toBe(second);
  expect(
    host.world.getEntityByIdAndComponents(first, [PLAYER])?.PLAYER.accountId
  ).toBe("first");
  host.release("first");
  expect(host.join("first")).toBe(first);
  expect(host.actorId("second")).toBe(second);
  expect(host.world.getEntities([PLAYER])).toHaveLength(2);
});

it("preserves owned actor IDs, server time and positions through a server save", () => {
  const host = createHost();
  const id = host.join("first");
  expect(host.receive("first", { sequence: 0, move: ["right"] })).toBe(true);
  for (let frame = 0; frame < 20; frame++) host.step();
  host.release("first");
  const saved = host.save();
  const loaded = createHost(saved);
  expect(loaded.actorId("first")).toBe(id);
  expect(
    loaded.world.getEntityByIdAndComponents(id, [POSITION])?.POSITION
  ).toEqual(host.world.getEntityByIdAndComponents(id, [POSITION])?.POSITION);
  expect(loaded.world.metadata.elapsed).toBe(host.world.metadata.elapsed);
});

it("removes actors from interrupted unauthenticated joins", () => {
  const host = createHost();
  host.join("first");
  const abandoned = host.join("abandoned");
  host.forget("abandoned");
  expect(host.join("replacement")).not.toBe(abandoned);
  expect(host.actorId("abandoned")).toBeUndefined();
  expect(host.world.getEntities([PLAYER])).toHaveLength(2);
});

it("does not inherit another player's private quick items, chat or camera state", () => {
  const host = createHost();
  const first = host.join("first");
  const original = host.world.assertByIdAndComponents(first, [PLAYER]);
  original[PLAYER].kills = 7;
  original[PLAYER].chatHistory = [[1, 2]];
  original[PLAYER].quickItems = { "1": { weapon: "sword", material: "wood" } };
  const second = host.join("second");
  const created = host.world.assertByIdAndComponents(second, [PLAYER]);
  expect(created[PLAYER].kills).toBe(0);
  expect(created[PLAYER].chatHistory).toEqual([]);
  expect(created[PLAYER].quickItems).toEqual({});
  expect(
    host.world.assertByIdAndComponents(first, ["VIEWABLE"]).VIEWABLE
  ).not.toBe(host.world.assertByIdAndComponents(second, ["VIEWABLE"]).VIEWABLE);
});

it("keeps disconnected characters owned without blocking paths or attracting enemies", () => {
  const host = createHost();
  const first = host.join("first"),
    second = host.join("second");
  const hero = host.world.assertByIdAndComponents(first, [
    PLAYER,
    POSITION,
    "STATS",
    "AFFECTABLE",
  ]);
  moveEntity(host.world, hero, { x: 1, y: 0 });
  expect(isWalkable(host.world, hero[POSITION])).toBe(false);
  hero.STATS.hp = 20;
  hero.STATS.maxHp = 20;
  hero.STATS.xp = 19;
  host.disconnect("first");
  expect(hero[PLAYER].connected).toBe(false);
  expect(isWalkable(host.world, hero[POSITION])).toBe(true);
  expect(getClosestPlayer(host.world, hero[POSITION], [PLAYER])).toBe(
    host.world.getEntityById(second)
  );
  hero.AFFECTABLE.dot += 5;
  host.step();
  expect(hero.STATS.hp).toBe(20);
  expect(host.join("first")).toBe(first);
  host.step();
  expect(hero[PLAYER].connected).toBe(true);
  expect(hero.STATS.hp).toBe(20);
  expect(hero.STATS.xp).toBe(19);
  expect(isWalkable(host.world, hero[POSITION])).toBe(false);
});

it("releases an NPC dialog on disconnect and restores saved characters offline until authenticated", () => {
  const host = createHost();
  const first = host.join("first"),
    second = host.join("second");
  const hero = host.world.assertByIdAndComponents(first, [PLAYER]);
  const other = host.world.assertByIdAndComponents(second, [PLAYER]);
  const sign = host.world
    .getEntities([POPUP, "POSITION"])
    .find((entity) => entity[POPUP].tabs.includes("info"))!;
  openPopup(host.world, hero, sign, true);
  expect(openPopup(host.world, other, sign, true)).toBe(false);
  host.disconnect("first");
  expect(openPopup(host.world, other, sign, true)).not.toBe(false);
  const restored = createHost(host.save());
  expect(
    restored.world
      .getEntities([PLAYER])
      .every((player) => player[PLAYER].connected === false)
  ).toBe(true);
  expect(
    getClosestPlayer(restored.world, { x: 0, y: 0 }, [PLAYER])
  ).toBeUndefined();
  restored.join("second");
  expect(
    restored.world.assertByIdAndComponents(second, [PLAYER])[PLAYER].connected
  ).toBe(true);
});
