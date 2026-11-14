import {
  createAreaWorld,
  assertHero,
  advance,
  advanceUntil,
} from "../../testing/harness";
import { createHero } from "../systems/fate";
import { registerEntity, moveEntity } from "../systems/map";
import { ensurePlayerInterface } from "../../bindings/interface";
import { createPlayerInput } from "./input";
import { getInteraction, assertPlayerInterface } from "../players";
import { PLAYER } from "../components/player";
import { VIEWABLE } from "../components/viewable";
import { POSITION } from "../components/position";
import { POPUP } from "../components/popup";
import { SEQUENCABLE } from "../components/sequencable";
import { getParticles, getSequence } from "../systems/sequence";
import { PARTICLE } from "../components/particle";
import { createSnapshot, restoreSnapshot } from "../snapshot";

const setup = () => {
  const world = createAreaWorld(
    "|                |\n| ♀ ¾       ¾    |\n|                |",
    { size: 32 }
  );
  advance(world, 2500);
  const first = world.assertComponents(assertHero(world), [PLAYER, POSITION]);
  first[PLAYER].accountId = "first";
  ensurePlayerInterface(world, first);
  const second = createHero(world, first);
  second[PLAYER].accountId = "second";
  expect(second[VIEWABLE]).not.toBe(first[VIEWABLE]);
  expect(second[VIEWABLE].owner).toBe(world.getEntityId(second));
  // New joins do not inherit interface IDs; respawns do.
  second[PLAYER].interface = undefined;
  ensurePlayerInterface(world, second);
  registerEntity(world, second);
  moveEntity(world, second, { x: 10, y: 1 });
  return { world, first, second };
};

it("opens independent personal tabs from simultaneous authoritative inputs", () => {
  const { world, first, second } = setup();
  const one = createPlayerInput(world, world.getEntityId(first));
  const two = createPlayerInput(world, world.getEntityId(second));
  one.receive({ sequence: 0, action: { kind: "gear" } });
  two.receive({ sequence: 0, action: { kind: "stats" } });
  one.onUpdate();
  two.onUpdate();
  advanceUntil(
    world,
    () => !!first[PLAYER].popup && !!second[PLAYER].popup,
    1000
  );
  const firstPopup = assertPlayerInterface(world, first, "use", [POPUP]);
  const secondPopup = assertPlayerInterface(world, second, "use", [POPUP]);
  expect(firstPopup).not.toBe(secondPopup);
  expect(firstPopup[POPUP].tabs[firstPopup[POPUP].horizontalIndex]).toBe(
    "gear"
  );
  expect(secondPopup[POPUP].tabs[secondPopup[POPUP].horizontalIndex]).toBe(
    "stats"
  );
  expect(first[PLAYER].popup).toBe(world.getEntityId(firstPopup));
  expect(second[PLAYER].popup).toBe(world.getEntityId(secondPopup));
});

it("maintains independent nearby interaction targets and hides foreign prompts", () => {
  const { world, first, second } = setup();
  moveEntity(world, first, { x: 2, y: 1 });
  advanceUntil(
    world,
    () =>
      !!getInteraction(world, first).active &&
      !!getInteraction(world, second).active,
    1000
  );
  const a = getInteraction(world, first),
    b = getInteraction(world, second);
  expect(a.active).not.toBe(b.active);
  const prompts = [first, second].map((player) =>
    world.assertByIdAndComponents(
      player[PLAYER].interface!.prompts![getInteraction(world, player).active!],
      [SEQUENCABLE]
    )
  );
  advance(world, 300);
  expect(getSequence(world, prompts[0], "interact")?.args.owner).toBe(
    world.getEntityId(first)
  );
  expect(getSequence(world, prompts[1], "interact")?.args.owner).toBe(
    world.getEntityId(second)
  );
  world.metadata.localPlayerId = world.getEntityId(first);
  expect(
    getParticles(world, prompts[0]).some(
      (p) => p[PARTICLE]?.owner === world.getEntityId(first)
    )
  ).toBe(true);
  expect(getParticles(world, prompts[1])).toEqual([]);
});

it("restores personal interface IDs and selections instead of sharing or duplicating them", () => {
  const { world, first, second } = setup();
  const original = assertPlayerInterface(world, second, "use", [POPUP]);
  original[POPUP].horizontalIndex = 4;
  const restored = restoreSnapshot(createSnapshot(world));
  const one = restored.assertByIdAndComponents(world.getEntityId(first), [
    PLAYER,
  ]);
  const two = restored.assertByIdAndComponents(world.getEntityId(second), [
    PLAYER,
  ]);
  const before = restored.getEntities([POPUP]).length;
  ensurePlayerInterface(restored, one);
  ensurePlayerInterface(restored, two);
  expect(restored.getEntities([POPUP])).toHaveLength(before);
  expect(
    assertPlayerInterface(restored, two, "use", [POPUP])[POPUP].horizontalIndex
  ).toBe(4);
  expect(one[PLAYER].interface!.use).not.toBe(two[PLAYER].interface!.use);
});
