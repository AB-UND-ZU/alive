import { LOCKABLE } from "../../engine/components/lockable";
import { POSITION } from "../../engine/components/position";
import { getSequence } from "../../engine/systems/sequence";
import { assertIdentifierAndComponents } from "../../engine/utils";
import {
  advanceUntil,
  assertHero,
  createTestWorld,
  step,
  trigger,
  walk,
} from "../../testing/harness";
import { teleport } from "../creatures/helpers";
import { interact } from "../doors/helpers";
import { getFocus, getStep, refresh } from "./helpers";

const setupCenter = () => {
  const world = createTestWorld({ level: "LEVEL_TUTORIAL" });
  const hero = assertHero(world);
  step(world, 5);
  const sign = assertIdentifierAndComponents(world, "spawn_sign", [POSITION]);
  const key = assertIdentifierAndComponents(world, "spawn_key", [POSITION]);
  const door = assertIdentifierAndComponents(world, "center:door", [
    POSITION,
    LOCKABLE,
  ]);
  return { world, hero, sign, key, door };
};

const readSign = (world: ReturnType<typeof setupCenter>["world"]) => {
  teleport(world, assertHero(world), { x: 5, y: 4 });
  refresh(world);
  interact(world, 30);
  trigger(world, "close");
  step(world, 30);
};

const takeKey = (world: ReturnType<typeof setupCenter>["world"]) => {
  teleport(world, assertHero(world), { x: -3, y: 4 });
  walk(world, "left");
  step(world, 30);
};

describe("first room quest", () => {
  it("waits for the hero's first step", () => {
    const { world, hero } = setupCenter();

    step(world, 30);

    expect(getStep(world, hero, "quest")).toBe("move");
    expect(getFocus(world).target).toBeUndefined();
  });

  it("points to the sign after the first step", () => {
    const { world, hero, sign } = setupCenter();

    walk(world, "down");
    step(world, 5);

    expect(getStep(world, hero, "quest")).toBe("sign");
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(sign),
      highlight: "quest",
    });
  });

  it("points to the key once the sign has been read", () => {
    const { world, hero, key } = setupCenter();
    walk(world, "down");

    readSign(world);

    expect(getStep(world, hero, "quest")).toBe("key");
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(key),
      highlight: "quest",
    });
  });

  it("points to the door once the key is picked up", () => {
    const { world, hero, door } = setupCenter();
    walk(world, "down");
    readSign(world);

    takeKey(world);

    expect(getStep(world, hero, "quest")).toBe("door");
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(door),
      highlight: "quest",
    });
  });

  it("ends and clears the focus once the door is unlocked", () => {
    const { world, hero, door } = setupCenter();
    walk(world, "down");
    readSign(world);
    takeKey(world);

    teleport(world, hero, { x: 0, y: -5 });
    refresh(world);
    interact(world, 30);
    advanceUntil(world, () => !getSequence(world, hero, "quest"), 3000);

    expect(door[LOCKABLE].locked).toBe(false);
    expect(getFocus(world).target).toBeUndefined();
  });
});
