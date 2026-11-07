import { POSITION } from "../../engine/components/position";
import { getSequence } from "../../engine/systems/sequence";
import { assertIdentifierAndComponents } from "../../engine/utils";
import { questSequence } from "../../game/assets/utils";
import {
  advanceUntil,
  assertHero,
  createAreaWorld,
  findInArea,
  step,
  trigger,
} from "../../testing/harness";
import { teleport } from "../creatures/helpers";
import { interact } from "../doors/helpers";
import { addNpc, getFocus, getStep, refresh } from "./helpers";

// ♀ hero, s spawn sign, H earth chief
const area = `
|                              |
|  ♀s                     H    |
|                              |
`;

const setupSpawn = () => {
  const world = createAreaWorld(area, { size: 60 });
  const hero = assertHero(world);
  const chief = addNpc(
    world,
    "earthChief",
    findInArea(area, "H"),
    "earthChiefNpc"
  );
  const sign = assertIdentifierAndComponents(world, "spawn_sign", [POSITION]);
  questSequence(world, hero, "spawnQuest", {});
  refresh(world);
  return { world, hero, chief, sign };
};

describe("island arrival quest", () => {
  it("points to the sign next to the spawn", () => {
    const { world, hero, sign } = setupSpawn();

    expect(getStep(world, hero, "quest")).toBe("START_STEP");
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(sign),
      highlight: "quest",
    });
  });

  it("points to the earth chief once the sign is read", () => {
    const { world, hero, chief } = setupSpawn();

    interact(world, 30);
    trigger(world, "close");
    step(world, 30);

    expect(getStep(world, hero, "quest")).toBe("town");
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(chief),
      highlight: "quest",
    });
  });

  it("skips the sign when the hero already reached the town", () => {
    const { world, hero, chief } = setupSpawn();

    teleport(world, hero, { x: 20, y: 1 });
    refresh(world);

    expect(getStep(world, hero, "quest")).toBe("town");
    expect(getFocus(world).target).toBe(world.getEntityId(chief));
  });

  it("ends when the hero talks to the chief", () => {
    const { world, hero } = setupSpawn();
    teleport(world, hero, { x: 25, y: 1 });
    refresh(world);

    interact(world, 30);
    advanceUntil(world, () => !getSequence(world, hero, "quest"), 2000);

    expect(getFocus(world).target).toBeUndefined();
  });
});
