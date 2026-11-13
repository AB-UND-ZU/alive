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

it("reuses actors from interrupted unauthenticated joins", () => {
  const host = createHost();
  host.join("first");
  const abandoned = host.join("abandoned");
  host.forget("abandoned");
  expect(host.join("replacement")).toBe(abandoned);
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
