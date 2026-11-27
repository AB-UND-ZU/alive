import { resolveSprite } from "../../game/assets/spriteIds";
import { getBumpMotion, sampleMotion } from "../../engine/motion";
import { clickEntity } from "../../engine/systems/click";
import { CLICKABLE } from "../../engine/components/clickable";
import { COVERABLE } from "../../engine/components/coverable";
import { POPUP } from "../../engine/components/popup";
import { PLAYER } from "../../engine/components/player";
import {
  getTabSelections,
  getVerticalIndex,
  isInPopup,
} from "../../engine/systems/popup";
import { getUpdates } from "../../game/assets/updates";
import { POSITION } from "../../engine/components/position";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { SPRITE } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { WARPABLE } from "../../engine/components/warpable";
import { TypedEntity } from "../../engine/entities";
import { getSequence } from "../../engine/systems/sequence";
import { assertIdentifierAndComponents } from "../../engine/utils";
import {
  leverOff,
  leverOn,
  none,
  popupBlocked,
  popupSelection,
} from "../../game/assets/sprites";
import {
  advance,
  advanceUntil,
  assertHero,
  createTestWorld,
  step,
  trigger,
  walk,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { interact } from "../doors/helpers";
import { getDialogs, getFocus, getStep } from "./helpers";

const setupMenu = () => {
  const world = createTestWorld({ level: "LEVEL_MENU" });
  const hero = assertHero(world);
  const menu = world
    .getEntities([SEQUENCABLE])
    .find((entity) => getSequence(world, entity, "npc")?.name === "menuNpc")!;
  step(world, 5);
  return { world, hero, menu };
};

const getArrow = (world: ReturnType<typeof setupMenu>["world"], menu: any) =>
  world.assertByIdAndComponents(
    getSequence(world, menu, "npc")!.args.memory.arrow,
    [POSITION, SPRITE]
  );

const click = (entity: TypedEntity<"CLICKABLE">) => {
  entity[CLICKABLE].clicked = true;
};

describe("main menu", () => {
  it("explains how to move when the hero stands still", () => {
    const { world, hero } = setupMenu();

    advance(world, 5500);

    expect(getStep(world, hero, "quest")).toBe("move");
    expect(getDialogs(hero)[0]).toMatch(/to move$/);

    walk(world, "up");
    step(world, 5);

    expect(getDialogs(hero)).toEqual([]);
    expect(getStep(world, hero, "quest")).toBe("sign");
  });

  it("points to the menu sign after the first step", () => {
    const { world, hero } = setupMenu();
    const sign = assertIdentifierAndComponents(world, "menu_sign", [POSITION]);

    walk(world, "up");
    step(world, 5);

    expect(getStep(world, hero, "quest")).toBe("sign");
    expect(getDialogs(hero)).toEqual([]);
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(sign),
      highlight: "quest",
    });
  });

  it("points to the portal once the sign has been read", () => {
    const { world, hero } = setupMenu();
    const sign = assertIdentifierAndComponents(world, "menu_sign", [POSITION]);
    const portal = world.getEntities([WARPABLE])[0];

    walk(world, "down");
    walk(world, "right", 8);
    step(world, 10);
    interact(world, 30);
    trigger(world, "close");
    advanceUntil(world, () => !getSequence(world, hero, "quest"), 3000);

    expect(sign[POSITION]).toEqual({ x: 8, y: 2 });
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(portal),
      highlight: "quest",
    });
  });

  it("highlights the menu entry the hero walks onto", () => {
    const { world, menu } = setupMenu();
    const arrow = getArrow(world, menu);

    expect(arrow[SPRITE].id).toBe(none.id);

    walk(world, "down");
    step(world, 5);

    expect(getStep(world, menu)).toBe("tutorial");
    expect(arrow[SPRITE].id).toBe(popupSelection.id);
    expect(arrow[POSITION]).toEqual({ x: 33, y: 2 });

    walk(world, "up");
    step(world, 5);

    expect(getStep(world, menu)).toBe("wait");
    expect(arrow[SPRITE].id).toBe(none.id);
  });

  it("marks an unavailable menu entry as blocked", () => {
    const { world, menu } = setupMenu();
    const arrow = getArrow(world, menu);

    walk(world, "down", 7);
    step(world, 5);

    expect(getStep(world, menu)).toBe("continue");
    expect(arrow[SPRITE].id).toBe(popupBlocked.id);
    expect(arrow[POSITION]).toEqual({ x: 33, y: 8 });
  });

  it("opens the Updates list above Credits and reads each release", () => {
    const { world, hero, menu } = setupMenu();
    const sign = assertIdentifierAndComponents(world, "updates_sign", [
      POSITION,
      POPUP,
    ]);
    expect(sign[POSITION]).toEqual({ x: 8, y: 17 });
    expect(
      world
        .getEntities([POPUP, POSITION])
        .some(
          (entity) =>
            entity[POPUP].tabs.includes("credits") && entity[POSITION].y === 20
        )
    ).toBe(true);

    walk(world, "down", 16);
    walk(world, "right", 8);
    step(world, 10);
    expect(getStep(world, menu)).toBe("updates");
    interact(world, 30);
    expect(hero[PLAYER].popup).toBe(world.getEntityId(sign));

    const updates = getUpdates();
    for (let index = 0; index < updates.length; index += 1) {
      expect(getVerticalIndex(world, sign)).toBe(index);
      step(world, 10);
      const list = getSequence(world, sign, "popup")!;
      expect(list.args.detailsPadding).toBe(0);
      const row = index - (list.args.scrollIndex || 0);
      const cell = (column: number, rowIndex = row) =>
        resolveSprite(
          world.assertByIdAndComponents(
            list.particles[`popup-content-${rowIndex}-${column}`],
            [SPRITE]
          )[SPRITE]
        );
      expect(cell(1).layers.some((layer) => layer.char === "V")).toBe(true);
      const clockColumn = 17 - updates[index].description!.length;
      expect(cell(clockColumn).layers.some((layer) => layer.char === "└")).toBe(
        true
      );
      expect(
        [1, 2, 3, 4]
          .map((column) => cell(clockColumn + column).layers.at(-1)?.char)
          .join("")
      ).toBe(
        updates[index]
          .description!.slice(1, 5)
          .map((sprite) => sprite.layers[0].char)
          .join("")
      );
      expect(
        cell(9, row + (index === 0 ? 1 : -1)).layers.some(
          (layer) => layer.char === "2"
        )
      ).toBe(false);
      trigger(world, "right");
      advanceUntil(world, () => getTabSelections(world, sign).length === 1);
      expect(getTabSelections(world, sign)).toEqual([index]);
      expect(getVerticalIndex(world, sign)).toBe(0);
      step(world, 30);
      expect(getSequence(world, sign, "popup")?.args.contentHeight).toBe(
        updates[index].content.length
      );
      trigger(world, "left");
      advanceUntil(world, () => getTabSelections(world, sign).length === 0);
      expect(getVerticalIndex(world, sign)).toBe(index);
      if (index < updates.length - 1) {
        trigger(world, "down");
        advanceUntil(world, () => getVerticalIndex(world, sign) === index + 1);
      }
    }
    trigger(world, "close");
    advanceUntil(world, () => !isInPopup(world, hero));
    walk(world, "left");
    walk(world, "down", 3);
    walk(world, "right");
    interact(world, 30);
    expect(
      world.assertByIdAndComponents(hero[PLAYER].popup, [POPUP])[POPUP].tabs
    ).toEqual(["credits"]);
  });

  it("toggles the sound with a lever", () => {
    const { world } = setupMenu();
    const lever = assertIdentifierAndComponents(world, "settings_sound", [
      CLICKABLE,
      SPRITE,
      TOOLTIP,
    ]);

    expect(lever[SPRITE].id).toBe(leverOn.id);

    click(lever);
    step(world, 5);

    expect(lever[SPRITE].id).toBe(leverOff.id);
    expect(getDialogs(lever)).toEqual(["Sound off"]);

    click(lever);
    step(world, 5);

    expect(lever[SPRITE].id).toBe(leverOn.id);
    expect(getDialogs(lever)).toEqual(["Sound on"]);
    expect(playedSounds).toContain("lever");
  });

  it("flips the touch controls with a lever", () => {
    const { world } = setupMenu();
    const flips: boolean[] = [];
    world.metadata.setFlipped = (flipped: boolean) => flips.push(flipped);
    const lever = assertIdentifierAndComponents(world, "settings_controls", [
      CLICKABLE,
      SPRITE,
      TOOLTIP,
    ]);

    click(lever);
    step(world, 5);

    expect(getDialogs(lever)).toEqual(["Right side"]);

    click(lever);
    step(world, 5);

    expect(getDialogs(lever)).toEqual(["Left side"]);
    expect(flips).toEqual([true, false]);
  });

  it("sends a colored ripple from a clicked title block", () => {
    const { world, hero } = setupMenu();
    const blocks = world
      .getEntities([CLICKABLE, POSITION, SPRITE])
      .filter((entity) => !entity[SEQUENCABLE] && !entity[COVERABLE]);
    const block = blocks[0];
    const colors = () =>
      blocks
        .map((entity) => resolveSprite(entity[SPRITE]).layers[0].color)
        .join();
    const before = colors();

    clickEntity(world, hero, block, "up");
    const bump = getBumpMotion(hero)!;
    expect(bump).toBeDefined();
    expect(sampleMotion(bump, bump.startedAt).y).toBeCloseTo(-0.225);
    advance(world, 2500);

    expect(block[CLICKABLE].clicked).toBe(false);
    expect(colors()).not.toBe(before);
  });
});
