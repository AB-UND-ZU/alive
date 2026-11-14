import {
  getIndexFromKey,
  keyboardSize,
  keyboardColumns,
} from "../../components/Keyboard";
import { moveEntity } from "../systems/map";
import { isWalkable } from "../systems/movement";
import { getClosestPlayer } from "../players";
import { submitChat } from "../systems/popup";
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
  expect(openPopup(host.world, other, sign, true)).not.toBe(false);
  expect(hero[PLAYER].popup).not.toBe(other[PLAYER].popup);
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

it("treats slash commands as ordinary chat instead of allowing clients to grant equipment", () => {
  const host = createHost();
  const id = host.join("first");
  const hero = host.world.assertByIdAndComponents(id, [
    "INVENTORY",
    PLAYER,
    "TOOLTIP",
  ]);
  const before = [...hero.INVENTORY.items];
  submitChat(host.world, hero, "/give sword 10 gold");
  expect(hero.INVENTORY.items).toEqual(before);
  expect(hero.TOOLTIP.enemy).toBe(false);
  expect(hero.TOOLTIP.dialogs).toHaveLength(1);
});

it("keeps bounded server chat history separate from browser history and other characters", () => {
  localStorage.setItem("alive.chatHistory", JSON.stringify([[1, 2, 3]]));
  const host = createHost();
  const first = host.world.assertByIdAndComponents(host.join("first"), [
    PLAYER,
  ]);
  const second = host.world.assertByIdAndComponents(host.join("second"), [
    PLAYER,
  ]);
  for (let line = 0; line < 40; line++)
    submitChat(host.world, first, `Hello ${line}`);
  expect(first[PLAYER].chatHistory).toHaveLength(32);
  submitChat(host.world, second, "Hi");
  expect(second[PLAYER].chatHistory).toHaveLength(1);
  expect(JSON.parse(localStorage.getItem("alive.chatHistory")!)).toEqual([
    [1, 2, 3],
  ]);
  localStorage.removeItem("alive.chatHistory");
});

it("opens and submits private chat through authoritative intents in normal play", () => {
  const host = createHost();
  const id = host.join("first");
  host.join("second");
  let sequence = 0;
  const advance = () => {
    for (let frame = 0; frame < 20; frame++) host.step();
  };
  host.receive("first", { sequence: sequence++, action: { kind: "chat" } });
  advance();
  const hero = host.world.assertByIdAndComponents(id, [PLAYER, "TOOLTIP"]);
  const popup = host.world.assertByIdAndComponents(hero[PLAYER].popup, [POPUP]);
  expect(popup[POPUP].tabs[popup[POPUP].horizontalIndex]).toBe("chat");
  for (const character of "hello") {
    const key = getIndexFromKey(character)!;
    host.receive("first", {
      sequence: sequence++,
      action: {
        kind: "text",
        index:
          key.tab * keyboardSize + key.offset * keyboardColumns + key.content,
      },
    });
  }
  advance();
  host.receive("first", { sequence: sequence++, action: { kind: "right" } });
  advance();
  expect(hero[PLAYER].popup).toBeUndefined();
  expect(hero[PLAYER].chatHistory).toHaveLength(1);
  expect(
    host.world.assertByIdAndComponents(host.actorId("second"), [PLAYER])[PLAYER]
      .chatHistory
  ).toHaveLength(0);
  expect(hero.TOOLTIP.dialogs).toHaveLength(1);
});

it("closes a personal dialog while idle movement heartbeats continue", () => {
  const host = createHost();
  const id = host.join("first");
  host.join("second");
  let sequence = 0;
  const step = () => {
    for (let frame = 0; frame < 30; frame++) {
      if (frame % 7 === 0)
        host.receive("first", { sequence: sequence++, move: [] });
      host.step();
    }
  };
  step();
  host.receive("first", {
    sequence: sequence++,
    move: [],
    action: { kind: "stats" },
  });
  step();
  const hero = host.world.assertByIdAndComponents(id, [PLAYER]);
  expect(hero[PLAYER].popup).toBeDefined();
  host.receive("first", {
    sequence: sequence++,
    move: [],
    action: { kind: "close" },
  });
  step();
  expect(hero[PLAYER].popup).toBeUndefined();
});

it("ignores a second close arriving after the dialog is gone instead of blocking later actions", () => {
  const host = createHost();
  const id = host.join("first");
  const hero = host.world.assertByIdAndComponents(id, [PLAYER]);
  let sequence = 0;
  const action = (kind: "stats" | "close" | "chat") => {
    host.receive("first", { sequence: sequence++, action: { kind } });
    for (let frame = 0; frame < 20; frame++) host.step();
  };
  action("stats");
  expect(hero[PLAYER].popup).toBeDefined();
  action("close");
  action("close");
  expect(hero[PLAYER].actionTriggered).toBeUndefined();
  action("chat");
  const popup = host.world.assertByIdAndComponents(hero[PLAYER].popup, [POPUP]);
  expect(popup[POPUP].tabs[popup[POPUP].horizontalIndex]).toBe("chat");
});

it("opens independent personal windows after reconnecting to a restarted server", () => {
  let host = createHost();
  const first = host.join("first");
  const second = host.join("second");
  for (let frame = 0; frame < 100; frame++) host.step();
  host.disconnect("first");
  host.disconnect("second");
  host = createHost(host.save());
  expect(host.join("first")).toBe(first);
  expect(host.join("second")).toBe(second);
  host.receive("first", { sequence: 0, action: { kind: "gear" } });
  host.receive("second", { sequence: 0, action: { kind: "stats" } });
  for (let frame = 0; frame < 30; frame++) host.step();
  for (const [id, tab] of [
    [first, "gear"],
    [second, "stats"],
  ] as const) {
    const player = host.world.assertByIdAndComponents(id, [PLAYER]);
    const popup = host.world.assertByIdAndComponents(player[PLAYER].popup, [
      POPUP,
    ]);
    expect(popup[POPUP].owner).toBe(id);
    expect(popup[POPUP].tabs[popup[POPUP].horizontalIndex]).toBe(tab);
  }
});

it("keeps username but derives admin permissions and roster afresh after a save", () => {
  const host = createHost();
  host.join("first");
  host.identify("first", "Alice", true);
  host.roster([
    { id: "first", username: "Alice", admin: true, status: "online" },
  ]);
  const loaded = createHost(host.save());
  const player = loaded.world.assertByIdAndComponents(loaded.actorId("first"), [
    PLAYER,
  ]);
  expect(player[PLAYER].username).toBe("Alice");
  expect(player[PLAYER].admin).toBe(false);
  expect(loaded.world.metadata.gameEntity.LEVEL.serverPlayers).toEqual([]);
  expect(
    host.world.assertByIdAndComponents(host.actorId("first"), [PLAYER])[PLAYER]
      .admin
  ).toBe(true);
});

it("reconnects after saving while several players read the same NPC without stale dialog IDs", () => {
  const host = createHost();
  host.join("a");
  host.join("b");
  const source = host.world
    .getEntities([POPUP])
    .find((entity) => entity[POPUP].tabs.includes("info"))!;
  for (const account of ["a", "b"])
    openPopup(
      host.world,
      host.world.assertByIdAndComponents(host.actorId(account), [PLAYER]),
      source,
      true
    );
  const restored = createHost(host.save());
  for (const account of ["a", "b"]) {
    restored.join(account);
    expect(
      restored.world.assertByIdAndComponents(restored.actorId(account), [
        PLAYER,
      ])[PLAYER].popup
    ).toBeUndefined();
    expect(restored.receive(account, { sequence: 0, move: ["right"] })).toBe(
      true
    );
  }
  expect(
    restored.world.getEntities([POPUP]).some((entity) => entity[POPUP].source)
  ).toBe(false);
});
