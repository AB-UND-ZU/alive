import { createText } from "../../game/assets/ui";
import { AFFECTABLE } from "../components/affectable";
import { assertIdentifierAndComponents } from "../utils";
import { POPUP } from "../components/popup";
import {
  openPopup,
  getTabSelections,
  createPopup,
  getVerticalIndex,
} from "../systems/popup";
import { createHero } from "../systems/fate";
import { createPlayerInput, isPlayerInput } from "./input";
import {
  advance,
  assertHero,
  createAreaWorld,
  giveItems,
} from "../../testing/harness";
import { INVENTORY } from "../components/inventory";
import { ACTIONABLE } from "../components/actionable";
import { PLAYER } from "../components/player";
import { POSITION } from "../components/position";
import { STATS } from "../components/stats";

const setup = () => {
  const world = createAreaWorld("|          |\n|    ♀     |\n|          |");
  advance(world, 2500);
  const hero = world.assertComponents(assertHero(world), [
    STATS,
    INVENTORY,
    ACTIONABLE,
    POSITION,
  ]);
  const input = createPlayerInput(world, world.getEntityId(hero));
  world.addSystem(() => input);
  return { world, hero, input };
};

describe("authoritative player input", () => {
  it.each([
    null,
    {},
    { sequence: 0 },
    { sequence: -1, move: [] },
    { sequence: 1, position: { x: 5, y: 1 } },
    { sequence: 1, playerId: 42, action: { kind: "spell" } },
    { sequence: 1, action: { kind: "give" } },
    { sequence: 1, action: { kind: "type", index: Infinity } },
    { sequence: 1, move: ["right", "right"] },
    { sequence: 1, move: ["teleport"] },
  ])("rejects state changes and malformed input: %j", (message) => {
    expect(isPlayerInput(message)).toBe(false);
  });

  it("does not advance the simulation or cast spells when flooded with messages", () => {
    const { world, hero, input } = setup();
    giveItems(world, hero, [{ spell: "wave", material: "wood", amount: 1 }]);
    hero[STATS].mp = 5;
    hero[STATS].maxMp = 5;
    const time = world.metadata.elapsed;
    for (let sequence = 0; sequence < 500; sequence += 1) {
      expect(input.receive({ sequence, action: { kind: "spell" } })).toBe(true);
    }
    expect(world.metadata.elapsed).toBe(time);
    expect(hero[STATS].mp).toBe(5);
    advance(world, 900);
    expect(hero[STATS].mp).toBe(4);
    expect(input.received).toBe(499);
  });

  it("rejects duplicate and out-of-order messages", () => {
    const { input } = setup();
    expect(input.receive({ sequence: 2, move: ["left"] })).toBe(true);
    expect(input.receive({ sequence: 2, move: ["right"] })).toBe(false);
    expect(input.receive({ sequence: 1, move: ["right"] })).toBe(false);
    expect(input.received).toBe(2);
  });

  it("uses the latest movement and stops after a connection stalls", () => {
    const { world, hero, input } = setup();
    const x = hero[POSITION].x;
    input.receive({ sequence: 0, move: ["right"] });
    input.receive({ sequence: 1, move: ["left"] });
    advance(world, 400);
    expect(hero[POSITION].x).toBeLessThan(x);
    advance(world, 1400);
    const stopped = { ...hero[POSITION] };
    advance(world, 1500);
    expect(hero[POSITION]).toEqual(stopped);
  });

  it("disconnect drops pending actions and movement", () => {
    const { world, hero, input } = setup();
    input.receive({ sequence: 0, move: ["right"], action: { kind: "spell" } });
    input.release();
    input.onUpdate();
    expect(hero[ACTIONABLE].spellTriggered).toBe(false);
    const before = { ...hero[POSITION] };
    advance(world, 1500);
    expect(hero[POSITION]).toEqual(before);
  });

  it("binds inputs to the authenticated actor, never the first player", () => {
    const world = createAreaWorld("| ♀       |");
    advance(world, 2500);
    createHero(world, assertHero(world));
    const players = world.getEntities([PLAYER, POSITION, ACTIONABLE]);
    expect(players).toHaveLength(2);
    const input = createPlayerInput(world, world.getEntityId(players[1]));
    input.receive({ sequence: 0, action: { kind: "skill" } });
    input.onUpdate();
    expect(players[0][ACTIONABLE].skillTriggered).toBe(false);
    expect(players[1][ACTIONABLE].skillTriggered).toBe(true);
  });
});

it("bounds queued chat edits and applies them only during server updates", () => {
  const { world, hero, input } = setup();
  const use = assertIdentifierAndComponents(world, "use", [POPUP]);
  use[POPUP].horizontalIndex = use[POPUP].tabs.indexOf("chat");
  openPopup(world, hero, use, true);
  world.metadata.warpPlayer = () => {};
  for (let sequence = 0; sequence < 100; sequence++)
    input.receive({ sequence, action: { kind: "text", index: 0 } });
  expect(getTabSelections(world, use)).toEqual([]);
  input.onUpdate();
  expect(getTabSelections(world, use)).toHaveLength(4);
  for (let step = 0; step < 20; step++) input.onUpdate();
  expect(getTabSelections(world, use)).toHaveLength(16);
  expect(
    isPlayerInput({ sequence: 101, action: { kind: "text", index: 120 } })
  ).toBe(false);
  input.receive({ sequence: 102, action: { kind: "text", index: 0 } });
  input.release();
  input.onUpdate();
  expect(getTabSelections(world, use)).toHaveLength(16);
});

it("keeps one short movement tap until the native player tick without repeating it", () => {
  const { world, hero, input } = setup();
  const before = { ...hero[POSITION] };
  input.receive({ sequence: 0, move: ["right"] });
  input.receive({ sequence: 1, move: [] });
  advance(world, 900);
  expect(hero[POSITION]).toEqual({ x: before.x + 1, y: before.y });
  advance(world, 900);
  expect(hero[POSITION]).toEqual({ x: before.x + 1, y: before.y });
});

it("discards spell attempts made while frozen instead of casting them after thawing", () => {
  const { world, hero, input } = setup();
  giveItems(world, hero, [{ spell: "wave", material: "wood", amount: 1 }]);
  hero[STATS].mp = 5;
  hero[STATS].maxMp = 5;
  const affected = world.assertComponents(hero, [AFFECTABLE]);
  affected[AFFECTABLE].freeze = 20;
  input.receive({ sequence: 0, action: { kind: "spell" } });
  advance(world, 500);
  affected[AFFECTABLE].freeze = 0;
  advance(world, 900);
  expect(hero[STATS].mp).toBe(5);
  expect(hero[ACTIONABLE].spellTriggered).toBe(false);
});

it("accepts normalized scrollbar positions and ignores coordinates outside the owned dialog", () => {
  const { world, hero, input } = setup();
  const use = assertIdentifierAndComponents(world, "use", [POPUP]);
  createPopup(world, use, {
    tabs: ["info"],
    lines: [
      Array.from({ length: 40 }, (_, index) => createText(`Line ${index}`)),
    ],
  });
  openPopup(world, hero, use, true);
  const tab = use[POPUP].horizontalIndex;
  expect(
    isPlayerInput({ sequence: 0, action: { kind: "scroll", index: 0.75 } })
  ).toBe(true);
  expect(
    isPlayerInput({ sequence: 0, action: { kind: "scroll", index: 2 } })
  ).toBe(false);
  input.receive({ sequence: 0, action: { kind: "tab", tab: 4096 } });
  advance(world, 500);
  expect(use[POPUP].horizontalIndex).toBe(tab);
  input.receive({
    sequence: 1,
    action: { kind: "content", index: 4096, offset: 4096 },
  });
  expect(() => advance(world, 500)).not.toThrow();
  expect(hero[PLAYER]!.popup).toBe(world.getEntityId(use));
  expect(use[POPUP].horizontalIndex).toBe(tab);
  input.receive({ sequence: 2, action: { kind: "scroll", index: 0.75 } });
  advance(world, 500);
  expect(getVerticalIndex(world, use)).toBeGreaterThan(0);
});
