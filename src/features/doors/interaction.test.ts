import { advanceUntil, findEntityAt, findInArea } from "../../testing/harness";
import { ACTIONABLE } from "../../engine/components/actionable";
import { LOCKABLE } from "../../engine/components/lockable";
import { PLAYER } from "../../engine/components/player";
import { POPUP } from "../../engine/components/popup";
import { getLock, interact, setup } from "./helpers";

// ♀ hero, D door, S sign
const doorFirst = `
|        |
|  D♀S   |
|        |
`;
const signFirst = `
|        |
|  S♀D   |
|        |
`;
const legend = { D: "wood_door", S: "guide_sign" };

const getSign = (world: ReturnType<typeof setup>["world"], area: string) =>
  findEntityAt(world, findInArea(area, "S"), [POPUP])!;

describe("interaction priority", () => {
  it("opens a door before reading a sign further right", () => {
    const { world, hero } = setup(doorFirst, { legend });
    const lock = getLock(world, doorFirst, "D");

    expect(hero[ACTIONABLE].unlock).toBe(world.getEntityId(lock));
    expect(hero[ACTIONABLE].popup).toBeUndefined();

    interact(world);
    expect(lock[LOCKABLE].locked).toBe(false);
    expect(hero[PLAYER].popup).toBeUndefined();

    advanceUntil(
      world,
      () =>
        hero[ACTIONABLE].popup === world.getEntityId(getSign(world, doorFirst)),
      1000
    );
  });

  it("reads a sign before opening a door further right", () => {
    const { world, hero } = setup(signFirst, { legend });
    const lock = getLock(world, signFirst, "D");
    const sign = getSign(world, signFirst);

    expect(hero[ACTIONABLE].popup).toBe(world.getEntityId(sign));
    expect(hero[ACTIONABLE].unlock).toBeUndefined();

    interact(world, 30);
    expect(hero[PLAYER].popup).toBe(world.getEntityId(sign));
    expect(lock[LOCKABLE].locked).toBe(true);
  });

  it("doesn't offer to open a door while reading a sign", () => {
    const { world, hero } = setup(signFirst, { legend });

    interact(world, 30);
    interact(world, 30);

    expect(hero[ACTIONABLE].unlock).toBeUndefined();
    expect(getLock(world, signFirst, "D")[LOCKABLE].locked).toBe(true);
  });
});
