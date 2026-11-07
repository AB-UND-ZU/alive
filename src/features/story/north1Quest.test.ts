import { World } from "../../engine";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LOCKABLE } from "../../engine/components/lockable";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { getSequence } from "../../engine/systems/sequence";
import {
  assertIdentifierAndComponents,
  getIdentifiersAndComponents,
} from "../../engine/utils";
import {
  advanceUntil,
  assertHero,
  countItems,
  createTestWorld,
  giveItems,
  step,
  trigger,
  walk,
} from "../../testing/harness";
import { teleport } from "../creatures/helpers";
import { interact } from "../doors/helpers";
import { getFocus, getStep, refresh } from "./helpers";

const setupRoom = () => {
  const world = createTestWorld({ level: "LEVEL_TUTORIAL" });
  const hero = world.assertComponents(assertHero(world), [
    STATS,
    INVENTORY,
    POSITION,
  ]);
  teleport(world, hero, { x: 0, y: -7 });
  refresh(world);
  advanceUntil(
    world,
    () => getSequence(world, hero, "quest")?.name === "north1Quest",
    2000
  );
  step(world, 5);
  return { world, hero };
};

const find = (world: World, name: string) =>
  assertIdentifierAndComponents(world, name, [POSITION]);

const readSign = (world: World) => {
  teleport(world, assertHero(world), { x: 4, y: -8 });
  refresh(world);
  interact(world, 30);
  trigger(world, "close");
  step(world, 30);
};

const defeatDummy = (world: World) => {
  const dummy = assertIdentifierAndComponents(world, "dummy", [STATS]);
  dummy[STATS].hp = 0;
  advanceUntil(
    world,
    () =>
      getIdentifiersAndComponents(world, "dummy:drop", [ITEM]).some(
        (drop) => drop[ITEM].stackable === "coin"
      ),
    5000
  );
  step(world, 30);
};

const getCoin = (world: World) =>
  getIdentifiersAndComponents(world, "dummy:drop", [ITEM]).find(
    (drop) => drop[ITEM].stackable === "coin"
  )!;

const collect = (world: World, dropId: number) => {
  const drop = world.assertByIdAndComponents(dropId, [POSITION]);
  teleport(world, assertHero(world), {
    x: drop[POSITION].x,
    y: drop[POSITION].y + 1,
  });
  walk(world, "up");
  step(world, 30);
};

describe("guide room quest", () => {
  it("points to the guide's sign when entering the room", () => {
    const { world, hero } = setupRoom();

    expect(getStep(world, hero, "quest")).toBe("sign");
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(find(world, "guide_sign")),
      highlight: "quest",
    });
  });

  it("points to a stick to use as a weapon", () => {
    const { world, hero } = setupRoom();

    readSign(world);

    expect(getStep(world, hero, "quest")).toBe("stick");
    expect(getFocus(world).target).toBe(
      world.getEntityId(find(world, "wood_one"))
    );
  });

  it("points to the dummy once the hero holds a weapon", () => {
    const { world, hero } = setupRoom();
    readSign(world);

    giveItems(world, hero, [{ weapon: "sword", material: "wood", amount: 1 }]);
    step(world, 30);

    expect(getStep(world, hero, "quest")).toBe("dummy");
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(find(world, "dummy")),
      highlight: "enemy",
    });
  });

  it("points to the dropped coin and then to the guide", () => {
    const { world, hero } = setupRoom();
    readSign(world);
    giveItems(world, hero, [{ weapon: "sword", material: "wood", amount: 1 }]);
    step(world, 30);

    defeatDummy(world);
    const coin = getCoin(world);

    expect(getStep(world, hero, "quest")).toBe("coin");
    expect(getFocus(world)).toEqual({
      target: coin[ITEM].carrier,
      highlight: "quest",
    });

    collect(world, coin[ITEM].carrier);

    expect(countItems(world, hero, { stackable: "coin" })).toBe(1);
    expect(getStep(world, hero, "quest")).toBe("shop");
    expect(getFocus(world).target).toBe(
      world.getEntityId(find(world, "guide"))
    );
  });

  it("points to the door after buying the key and ends when it opens", () => {
    const { world, hero } = setupRoom();
    readSign(world);
    giveItems(world, hero, [{ weapon: "sword", material: "wood", amount: 1 }]);
    step(world, 30);
    defeatDummy(world);
    const coin = getCoin(world);
    collect(world, coin[ITEM].carrier);

    giveItems(world, hero, [{ consume: "key", material: "iron", amount: 1 }]);
    step(world, 30);

    const door = assertIdentifierAndComponents(world, "north1:door", [
      POSITION,
      LOCKABLE,
    ]);
    expect(getStep(world, hero, "quest")).toBe("door");
    expect(getFocus(world).target).toBe(world.getEntityId(door));

    teleport(world, hero, { x: 0, y: -17 });
    refresh(world);
    interact(world, 30);
    advanceUntil(world, () => !getSequence(world, hero, "quest"), 3000);

    expect(door[LOCKABLE].locked).toBe(false);
    expect(getFocus(world).target).toBeUndefined();
  });

  it("ends when the hero walks back to the first room", () => {
    const { world, hero } = setupRoom();

    teleport(world, hero, { x: 0, y: -6 });
    refresh(world);

    expect(getSequence(world, hero, "quest")?.name).toBe("centerQuest");
    expect(getFocus(world).target).toBeUndefined();
  });
});
