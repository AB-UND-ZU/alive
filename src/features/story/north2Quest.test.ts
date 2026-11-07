import { World } from "../../engine";
import { INVENTORY } from "../../engine/components/inventory";
import { LOCKABLE } from "../../engine/components/lockable";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { isDead } from "../../engine/systems/damage";
import { getCellEntities } from "../../engine/systems/map";
import { getSequence } from "../../engine/systems/sequence";
import { isSpikable } from "../../engine/systems/spike";
import { assertIdentifierAndComponents } from "../../engine/utils";
import { roomSize, up2Cactus } from "../../game/levels/tutorial/areas";
import {
  advanceUntil,
  assertHero,
  createTestWorld,
  giveItems,
  step,
  trigger,
} from "../../testing/harness";
import { teleport } from "../creatures/helpers";
import { interact } from "../doors/helpers";
import { getFocus, getStep, refresh } from "./helpers";

const enter = (world: World, position: { x: number; y: number }) => {
  teleport(world, assertHero(world), position);
  refresh(world);
};

const setupRoom = () => {
  const world = createTestWorld({ level: "LEVEL_TUTORIAL" });
  const hero = world.assertComponents(assertHero(world), [INVENTORY, POSITION]);
  enter(world, { x: 0, y: -roomSize.y * 1.5 - 1 });
  advanceUntil(
    world,
    () => getSequence(world, hero, "quest")?.name === "north2Quest",
    2000
  );
  step(world, 5);
  return { world, hero };
};

const find = (world: World, name: string) =>
  assertIdentifierAndComponents(world, name, [POSITION]);

const getCactus = (world: World, offset: number) =>
  getCellEntities(world, { x: up2Cactus.x + offset, y: up2Cactus.y }).find(
    (entity) => isSpikable(world, entity)
  )!;

const cutCactus = (world: World) => {
  const cactus = world.assertComponents(getCactus(world, 0), [STATS]);
  cactus[STATS].hp = 0;
  advanceUntil(world, () => !getCactus(world, 0), 5000);
  step(world, 30);
};

const readSign = (world: World) => {
  enter(world, { x: -6, y: -27 });
  interact(world, 30);
  trigger(world, "close");
  step(world, 30);
};

const breakChest = (world: World) => {
  const chest = assertIdentifierAndComponents(world, "fruit_chest", [STATS]);
  chest[STATS].hp = 0;
  advanceUntil(world, () => isDead(world, chest), 3000);
  step(world, 60);
};

describe("cactus room quest", () => {
  it("points to the cacti blocking the way", () => {
    const { world, hero } = setupRoom();

    expect(getStep(world, hero, "quest")).toBe("cactus");
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(getCactus(world, 0)),
      highlight: "enemy",
    });
  });

  it("points to the sign once a cactus is cut", () => {
    const { world, hero } = setupRoom();

    cutCactus(world);

    expect(getStep(world, hero, "quest")).toBe("sign");
    expect(getFocus(world).target).toBe(
      world.getEntityId(find(world, "fruit_sign"))
    );
  });

  it("points to the fruit chest after reading the sign", () => {
    const { world, hero } = setupRoom();
    cutCactus(world);

    readSign(world);

    expect(getStep(world, hero, "quest")).toBe("chest");
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(find(world, "fruit_chest")),
      highlight: "enemy",
    });
  });

  it("points to the side door and then to the upper door with a key", () => {
    const { world, hero } = setupRoom();
    cutCactus(world);
    readSign(world);

    breakChest(world);

    expect(getStep(world, hero, "quest")).toBe("gold_door");
    expect(getFocus(world).target).toBe(
      world.getEntityId(find(world, "north2east1:door"))
    );

    giveItems(world, hero, [{ consume: "key", material: "iron", amount: 1 }]);
    step(world, 30);

    expect(getStep(world, hero, "quest")).toBe("iron_door");
    expect(getFocus(world).target).toBe(
      world.getEntityId(find(world, "north2:door"))
    );
  });

  it("ends once both doors are open", () => {
    const { world, hero } = setupRoom();
    [
      assertIdentifierAndComponents(world, "north2:door", [LOCKABLE]),
      assertIdentifierAndComponents(world, "north2east1:door", [LOCKABLE]),
    ].forEach((door) => {
      door[LOCKABLE].locked = false;
    });

    refresh(world);

    expect(getSequence(world, hero, "quest")).toBeUndefined();
    expect(getFocus(world).target).toBeUndefined();
  });
});

describe("potion room quest", () => {
  const setupSideRoom = () => {
    const world = createTestWorld({ level: "LEVEL_TUTORIAL" });
    const hero = assertHero(world);
    enter(world, { x: roomSize.x / 2 + 1, y: -roomSize.y * 2 });
    advanceUntil(
      world,
      () => getSequence(world, hero, "quest")?.name === "north2East1Quest",
      2000
    );
    step(world, 5);
    return { world, hero };
  };

  it("points to the potion chest", () => {
    const { world, hero } = setupSideRoom();

    expect(getStep(world, hero, "quest")).toBe("chest");
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(find(world, "potion_chest")),
      highlight: "enemy",
    });
  });

  it("points back to the upper door once the chest is broken", () => {
    const { world, hero } = setupSideRoom();
    const chest = assertIdentifierAndComponents(world, "potion_chest", [STATS]);

    chest[STATS].hp = 0;
    advanceUntil(world, () => !getSequence(world, hero, "quest"), 5000);

    expect(getFocus(world)).toEqual({
      target: world.getEntityId(find(world, "north2east1:door")),
      highlight: "quest",
    });
  });

  it("clears the focus when the upper door is already open", () => {
    const { world, hero } = setupSideRoom();
    assertIdentifierAndComponents(world, "north2:door", [LOCKABLE])[
      LOCKABLE
    ].locked = false;
    const chest = assertIdentifierAndComponents(world, "potion_chest", [STATS]);

    chest[STATS].hp = 0;
    advanceUntil(world, () => !getSequence(world, hero, "quest"), 5000);

    expect(getFocus(world).target).toBeUndefined();
  });
});
