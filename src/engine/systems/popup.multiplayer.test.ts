import {
  createAreaWorld,
  assertHero,
  advance,
  advanceUntil,
} from "../../testing/harness";
import { createHero } from "./fate";
import { registerEntity, moveEntity } from "./map";
import {
  createPopup,
  openPopup,
  closePopup,
  removePopup,
  getVerticalIndex,
} from "./popup";
import { getParticles } from "./sequence";
import { getPopupPlayer } from "../players";
import { PLAYER } from "../components/player";
import { MOVABLE } from "../components/movable";
import { POSITION } from "../components/position";
import { POPUP } from "../components/popup";
import { REFERENCE } from "../components/reference";
import { STATS } from "../components/stats";
import { PARTICLE } from "../components/particle";
import { createText } from "../../game/assets/ui";

const setup = () => {
  const world = createAreaWorld(
    "|            |\n| ♀  ¾  ¾    |\n|            |",
    { size: 32 }
  );
  advance(world, 2500);
  const first = world.assertComponents(assertHero(world), [
    PLAYER,
    MOVABLE,
    STATS,
  ]);
  const second = createHero(world, first);
  registerEntity(world, second);
  moveEntity(world, second, { x: 6, y: 1 });
  const signs = world
    .getEntities([POPUP, POSITION])
    .filter((sign) => sign[POPUP].tabs.includes("credits"));
  for (const sign of signs)
    createPopup(world, sign, {
      tabs: ["info"],
      lines: [
        Array.from({ length: 30 }, (_, index) => createText(`Line ${index}`)),
      ],
    });
  return { world, first, second, signs };
};

it("processes two independent dialog inputs in the same server world", () => {
  const { world, first, second, signs } = setup();
  openPopup(world, first, signs[0], true);
  openPopup(world, second, signs[1], true);
  advance(world, 500);
  for (const actor of [first, second]) {
    actor[MOVABLE].orientations = ["down"];
    actor[MOVABLE].pendingOrientation = "down";
    const frame = world.assertByIdAndComponents(actor[MOVABLE].reference, [
      REFERENCE,
    ]);
    frame[REFERENCE].suspended = false;
    frame[REFERENCE].suspensionCounter = -1;
  }
  advanceUntil(
    world,
    () =>
      getVerticalIndex(world, signs[0]) > 0 &&
      getVerticalIndex(world, signs[1]) > 0,
    2000
  );
  expect(getPopupPlayer(world, signs[0], [STATS])).toBe(first);
  expect(getPopupPlayer(world, signs[1], [STATS])).toBe(second);
});

it("does not allow another player to take over or close an active NPC dialog", () => {
  const { world, first, second, signs } = setup();
  openPopup(world, first, signs[0], true);
  expect(openPopup(world, second, signs[0], true)).toBe(false);
  closePopup(world, second, signs[0]);
  expect(first[PLAYER].popup).toBe(world.getEntityId(signs[0]));
  expect(second[PLAYER].popup).toBeUndefined();
  expect(signs[0][POPUP].active).toBe(true);
  closePopup(world, first, signs[0]);
  openPopup(world, second, signs[0], true);
  expect(second[PLAYER].popup).toBe(world.getEntityId(signs[0]));
  expect(signs[0][POPUP].owner).toBe(world.getEntityId(second));
});

it("renders dialog particles only in their owner's selected view", () => {
  const { world, first, second, signs } = setup();
  openPopup(world, first, signs[0], true);
  openPopup(world, second, signs[1], true);
  advance(world, 500);
  const firstId = world.getEntityId(first),
    secondId = world.getEntityId(second);
  expect(
    getParticles(world, signs[0]).some(
      (particle) => particle[PARTICLE]?.owner === firstId
    )
  ).toBe(true);
  expect(
    getParticles(world, signs[1]).some(
      (particle) => particle[PARTICLE]?.owner === secondId
    )
  ).toBe(true);
  world.metadata.localPlayerId = firstId;
  expect(
    getParticles(world, signs[1]).some(
      (particle) => particle[PARTICLE]?.owner === secondId
    )
  ).toBe(false);
  world.metadata.localPlayerId = secondId;
  expect(
    getParticles(world, signs[0]).some(
      (particle) => particle[PARTICLE]?.owner === firstId
    )
  ).toBe(false);
  expect(
    getParticles(world, signs[1]).some(
      (particle) => particle[PARTICLE]?.owner === secondId
    )
  ).toBe(true);
});

it("removing the second actor's dialog leaves the first actor's dialog open", () => {
  const { world, first, second, signs } = setup();
  openPopup(world, first, signs[0], true);
  openPopup(world, second, signs[1], true);
  removePopup(world, signs[1]);
  expect(second[PLAYER].popup).toBeUndefined();
  expect(first[PLAYER].popup).toBe(world.getEntityId(signs[0]));
  expect(signs[0][POPUP].active).toBe(true);
});

it("starts a new reader at the beginning without inheriting the previous reader's selections", () => {
  const { world, first, second, signs } = setup();
  const sign = signs[0];
  openPopup(world, first, sign, true);
  sign[POPUP].verticalIndezes = [5];
  sign[POPUP].selections = [[2]];
  closePopup(world, first, sign);
  openPopup(world, second, sign, true);
  expect(sign[POPUP].verticalIndezes).toEqual([0]);
  expect(sign[POPUP].selections).toEqual([[]]);
});
