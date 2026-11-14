import {
  createAreaWorld,
  assertHero,
  advance,
  giveItems,
} from "../../testing/harness";
import { createHero } from "../systems/fate";
import { moveEntity, registerEntity } from "../systems/map";
import {
  getPlayerFocus,
  setHighlight,
  setNeedle,
  getIdentifier,
} from "../utils";
import { ensurePlayerInterface } from "../../bindings/interface";
import { FOCUSABLE } from "../components/focusable";
import { PLAYER } from "../components/player";
import { EQUIPPABLE } from "../components/equippable";
import { TRACKABLE } from "../components/trackable";
import { getParticles } from "../systems/sequence";

const setup = () => {
  const world = createAreaWorld(
    "|             |\n| ♀           |\n|             |",
    { size: 32 }
  );
  advance(world, 2500);
  world.metadata.warpPlayer = () => {};
  const first = world.assertComponents(assertHero(world), [
    "PLAYER",
    "POSITION",
    "INVENTORY",
    "EQUIPPABLE",
  ]);
  const second = createHero(world, first);
  registerEntity(world, second);
  moveEntity(world, second, { x: 7, y: 1 });
  ensurePlayerInterface(world, first);
  ensurePlayerInterface(world, second);
  return { world, first, second };
};

it("keeps individual waypoint targets and displays both players' highlights", () => {
  const { world, first, second } = setup();
  setHighlight(world, "quest", second, undefined, first);
  setHighlight(world, "enemy", first, undefined, second);
  advance(world, 600);
  const one = getPlayerFocus(world, first)!,
    two = getPlayerFocus(world, second)!;
  expect(one[FOCUSABLE].target).toBe(world.getEntityId(second));
  expect(two[FOCUSABLE].target).toBe(world.getEntityId(first));
  world.metadata.localPlayerId = world.getEntityId(first);
  expect(getParticles(world, one).length).toBeGreaterThan(0);
  expect(getParticles(world, two).length).toBeGreaterThan(0);
  world.metadata.localPlayerId = world.getEntityId(second);
  expect(getParticles(world, two).length).toBeGreaterThan(0);
  expect(getParticles(world, one).length).toBeGreaterThan(0);
  setHighlight(world, undefined, undefined, undefined, first);
  expect(one[FOCUSABLE].pendingTarget).toBeUndefined();
  expect(two[FOCUSABLE].pendingTarget).toBe(world.getEntityId(first));
});

it("changes only the selected player's compass, including clearing it on death", () => {
  const { world, first, second } = setup();
  giveItems(world, first, [{ accessory: "compass", amount: 1 }]);
  giveItems(world, second, [{ accessory: "compass", amount: 1 }]);
  const firstCompass = world.assertByIdAndComponents(
    first[EQUIPPABLE]!.compass,
    [TRACKABLE]
  );
  const secondCompass = world.assertByIdAndComponents(
    second[EQUIPPABLE].compass,
    [TRACKABLE]
  );
  const spawn = getIdentifier(world, "spawn")!;
  setNeedle(world, spawn);
  setNeedle(world, undefined, first);
  expect(firstCompass[TRACKABLE].target).toBeUndefined();
  expect(secondCompass[TRACKABLE].target).toBe(world.getEntityId(spawn));
  expect(first[PLAYER].interface?.focus).not.toBe(
    second[PLAYER].interface?.focus
  );
});
