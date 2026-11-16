import {
  advanceUntil,
  assertHero,
  createAreaWorld,
  findInArea,
  step,
  holdMove,
  FRAME,
  trigger,
  walk,
} from "../../testing/harness";
import { ACTIONABLE } from "../components/actionable";
import { RESTORABLE } from "../components/restorable";
import { POPUP } from "../components/popup";
import { POSITION } from "../components/position";
import { PLAYER } from "../components/player";
import {
  createPopup,
  openPopup,
  closePopup,
  removePopup,
  getTab,
  getVerticalIndex,
  getTabSelections,
  setVerticalIndex,
  isInPopup,
} from "./popup";
import { STATS } from "../components/stats";
import { MOVABLE } from "../components/movable";
import { REFERENCE } from "../components/reference";
import { RENDERABLE } from "../components/renderable";
import { rerenderEntity } from "./renderer";
import { getEntityHaste, getHasteInterval } from "./movement";
import { World } from "../ecs";
import { getCellEntities } from "./map";
import { TypedEntity } from "../entities";
import { getSequence } from "./sequence";
import { createText } from "../../game/assets/ui";

// ♀ hero, ¾ credits sign
const area = `
|         |
| ♀     ¾ |
|         |
`;

const sign = findInArea(area, "¾");

const getSign = (world: World) =>
  world
    .getEntities([POPUP, POSITION])
    .find(
      (entity) => entity[POSITION].x === sign.x && entity[POSITION].y === sign.y
    )!;

// walk next to the sign
const setup = () => {
  const world = createAreaWorld(area);
  const hero = world.assertComponents(assertHero(world), [
    ACTIONABLE,
    PLAYER,
    MOVABLE,
    POSITION,
    STATS,
  ]);
  walk(world, "right", 5);
  step(world, 15);

  return { world, hero };
};

describe("popup interaction", () => {
  it("offers the adjacent sign as interaction", () => {
    const { world, hero } = setup();

    expect(hero[POSITION]).toEqual({ x: sign.x - 1, y: sign.y });
    expect(hero[ACTIONABLE].popup).toBe(world.getEntityId(getSign(world)));
  });

  it("removes an active completed quest only once, including its viewpoint", () => {
    const { world, hero } = setup();
    const sign = getSign(world);
    createPopup(world, sign, { tabs: ["quest"], lines: [[]] });
    openPopup(world, hero, sign, true);
    sign[POPUP].selections[0] = [0, 0];
    const viewpoint = sign[POPUP].viewpoint;
    expect(() => removePopup(world, sign)).not.toThrow();
    expect(sign[POPUP]).toBeUndefined();
    expect(hero[PLAYER].popup).toBeUndefined();
    step(world);
    expect(world.getEntityById(viewpoint)).toBeUndefined();
  });

  it("replacing a popup removes its old viewpoint and registers the replacement immediately", () => {
    const { world } = setup();
    const sign = getSign(world);
    const old = world.assertByIdAndComponents(sign[POPUP].viewpoint, [
      POSITION,
    ]);
    createPopup(world, sign, { tabs: ["quest"], lines: [[]] });
    const current = world.assertByIdAndComponents(sign[POPUP].viewpoint, [
      POSITION,
    ]);
    expect(getCellEntities(world, current.POSITION)).toContain(current);
    expect(getCellEntities(world, old.POSITION)).not.toContain(old);
    removePopup(world, sign);
    world.cleanup();
    expect(world.getEntityId(old)).toBeUndefined();
    expect(world.getEntityId(current)).toBeUndefined();
  });

  it("maps text scrollbar percentages to its rendered endpoints", () => {
    const { world, hero } = setup();
    const popup = getSign(world);
    createPopup(world, popup, {
      tabs: ["info"],
      lines: [
        Array.from({ length: 30 }, (_, index) => createText(`Line ${index}`)),
      ],
    });
    openPopup(world, hero, popup, true);
    step(world, 30);
    const maximum = getSequence(world, popup, "popup")!.args.scrollMax!;
    expect(maximum).toBeGreaterThan(0);
    for (const percentage of [1, 0.5, 0]) {
      hero[PLAYER].contentTriggered = percentage;
      trigger(world, "scroll");
      advanceUntil(world, () => !hero[PLAYER].actionTriggered);
      expect(getVerticalIndex(world, popup)).toBe(
        Math.round(percentage * maximum)
      );
    }
  });

  it("opens, scrolls and closes the credits popup", () => {
    const { world, hero } = setup();

    trigger(world, "interact");
    advanceUntil(world, () => !!isInPopup(world, hero), 1000);

    const popup = world.getEntityById(hero[PLAYER].popup) as TypedEntity<
      "POPUP" | "SEQUENCABLE"
    >;
    expect(getTab(world, popup)).toBe("credits");
    expect(popup[RESTORABLE]).toBeUndefined();
    expect(getVerticalIndex(world, popup)).toBe(0);

    // let opening animation settle before navigating
    step(world, 30);
    trigger(world, "down");
    advanceUntil(world, () => getVerticalIndex(world, popup) === 1, 1000);

    trigger(world, "close");
    advanceUntil(world, () => !isInPopup(world, hero), 1000);
  });
});

describe("dialog navigation timing", () => {
  it("moves at most once per reference tick even when hero stats redraw", () => {
    const { world, hero } = setup();
    const popup = getSign(world);
    openPopup(world, hero, popup, true);
    step(world, 30);
    holdMove(world, ["down"]);
    advanceUntil(world, () => getVerticalIndex(world, popup) === 1);
    const reference = world.assertByIdAndComponents(hero[MOVABLE].reference, [
      RENDERABLE,
    ]);
    const generation = reference[RENDERABLE].generation;
    rerenderEntity(world, hero);
    world.update(1);
    expect(reference[RENDERABLE].generation).toBe(generation);
    expect(getVerticalIndex(world, popup)).toBe(1);
    for (let elapsed = FRAME; elapsed < 140; elapsed += FRAME) {
      rerenderEntity(world, hero);
      world.update(FRAME);
      expect(getVerticalIndex(world, popup)).toBe(1);
    }
    advanceUntil(world, () => getVerticalIndex(world, popup) === 2, 200);
  });

  it.each([
    ["credits", 0],
    ["chat", 0],
    ["credits", 5],
    ["chat", 5],
  ] as const)(
    "restores walking speed immediately after leaving %s with haste %s",
    (tab, haste) => {
      const { world, hero } = setup();
      const popup = getSign(world);
      popup[POPUP].tabs = [tab];
      world.assertComponents(hero, [STATS])[STATS].haste = haste;
      openPopup(world, hero, popup, true);
      step(world, 30);
      const reference = world.assertByIdAndComponents(hero[MOVABLE].reference, [
        REFERENCE,
      ]);
      expect(reference[REFERENCE].tick).toBe(tab === "chat" ? 10 : 175);
      closePopup(world, hero, popup);
      const walkingTick = getHasteInterval(world, getEntityHaste(world, hero));
      holdMove(world, ["left"]);
      let lastX = hero[POSITION].x;
      const steps: number[] = [];
      for (let elapsed = 0; elapsed <= walkingTick * 2; elapsed += FRAME) {
        world.update(FRAME);
        if (hero[POSITION].x !== lastX) {
          steps.push(elapsed);
          lastX = hero[POSITION].x;
        }
      }
      expect(reference[REFERENCE].tick).toBe(walkingTick);
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps[1] - steps[0]).toBeGreaterThanOrEqual(walkingTick - FRAME);
    }
  );
});

describe("dialog entries", () => {
  it("reads long text, clamps scrolling and restores the selected entry on back", () => {
    const { world, hero } = setup();
    const popup = getSign(world);
    createPopup(world, popup, {
      tabs: ["dialog"],
      dialogs: [
        {
          title: "Short",
          description: createText("A note"),
          content: [createText("Hello")],
        },
        {
          title: "Long",
          description: createText("A book"),
          content: Array.from({ length: 30 }, (_, index) =>
            createText(`Line ${index}`)
          ),
        },
      ],
    });
    openPopup(world, hero, popup, true);
    step(world, 30);
    setVerticalIndex(world, popup, 1);
    trigger(world, "right");
    advanceUntil(world, () => getTabSelections(world, popup).length === 1);
    step(world, 30);
    const state = getSequence(world, popup, "popup")!;
    expect(state.args.contentClickable).toBe(false);
    expect(state.args.backButton).toBe(true);
    expect(state.args.scrollMax).toBeGreaterThan(0);
    hero[PLAYER].contentTriggered = 1;
    trigger(world, "scroll");
    advanceUntil(world, () => !hero[PLAYER].actionTriggered);
    expect(getVerticalIndex(world, popup)).toBe(state.args.scrollMax);
    trigger(world, "down");
    advanceUntil(world, () => !hero[PLAYER].actionTriggered);
    expect(getVerticalIndex(world, popup)).toBe(state.args.scrollMax);
    trigger(world, "right");
    advanceUntil(world, () => !hero[PLAYER].actionTriggered);
    expect(getTabSelections(world, popup)).toEqual([1]);
    trigger(world, "left");
    advanceUntil(world, () => getTabSelections(world, popup).length === 0);
    expect(getVerticalIndex(world, popup)).toBe(1);
    step(world, 30);
    expect(state.args.contentClickable).toBe(true);
    setVerticalIndex(world, popup, 0);
    trigger(world, "right");
    advanceUntil(world, () => getTabSelections(world, popup).length === 1);
    step(world, 30);
    expect(state.args.scrollMax).toBeUndefined();
    expect(state.args.contentHeight).toBe(1);
    popup[POPUP].dialogs![0].content.push(createText("Another line"));
    rerenderEntity(world, popup);
    step(world, 30);
    expect(state.args.contentHeight).toBe(2);
    trigger(world, "close");
    advanceUntil(world, () => !isInPopup(world, hero));
  });

  it("leaves an empty dialog list open without selecting a missing entry", () => {
    const { world, hero } = setup();
    const popup = getSign(world);
    createPopup(world, popup, { tabs: ["dialog"] });
    openPopup(world, hero, popup, true);
    step(world, 30);
    trigger(world, "right");
    advanceUntil(world, () => !hero[PLAYER].actionTriggered);
    expect(getTabSelections(world, popup)).toEqual([]);
    expect(getVerticalIndex(world, popup)).toBe(0);
    expect(isInPopup(world, hero)).toBe(true);
    expect(getSequence(world, popup, "popup")?.args.contentClickable).toBe(
      false
    );
  });
});
