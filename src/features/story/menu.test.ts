import { CLICKABLE } from "../../engine/components/clickable";
import { COVERABLE } from "../../engine/components/coverable";
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

    expect(arrow[SPRITE]).toBe(none);

    walk(world, "down");
    step(world, 5);

    expect(getStep(world, menu)).toBe("tutorial");
    expect(arrow[SPRITE]).toBe(popupSelection);
    expect(arrow[POSITION]).toEqual({ x: 33, y: 2 });

    walk(world, "up");
    step(world, 5);

    expect(getStep(world, menu)).toBe("wait");
    expect(arrow[SPRITE]).toBe(none);
  });

  it("marks an unavailable menu entry as blocked", () => {
    const { world, menu } = setupMenu();
    const arrow = getArrow(world, menu);

    walk(world, "down", 7);
    step(world, 5);

    expect(getStep(world, menu)).toBe("continue");
    expect(arrow[SPRITE]).toBe(popupBlocked);
    expect(arrow[POSITION]).toEqual({ x: 33, y: 8 });
  });

  it("toggles the sound with a lever", () => {
    const { world } = setupMenu();
    const lever = assertIdentifierAndComponents(world, "settings_sound", [
      CLICKABLE,
      SPRITE,
      TOOLTIP,
    ]);

    expect(lever[SPRITE]).toBe(leverOn);

    click(lever);
    step(world, 5);

    expect(lever[SPRITE]).toBe(leverOff);
    expect(getDialogs(lever)).toEqual(["Sound off"]);

    click(lever);
    step(world, 5);

    expect(lever[SPRITE]).toBe(leverOn);
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
    const { world } = setupMenu();
    const blocks = world
      .getEntities([CLICKABLE, POSITION, SPRITE])
      .filter((entity) => !entity[SEQUENCABLE] && !entity[COVERABLE]);
    const block = blocks[0];
    const colors = () =>
      blocks.map((entity) => entity[SPRITE].layers[0].color).join();
    const before = colors();

    click(block);
    advance(world, 2500);

    expect(block[CLICKABLE].clicked).toBe(false);
    expect(colors()).not.toBe(before);
  });
});
