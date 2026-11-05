import {
  advanceUntil,
  assertHero,
  createAreaWorld,
  findInArea,
  step,
  trigger,
  walk,
} from "../../testing/harness";
import { ACTIONABLE } from "../components/actionable";
import { POPUP } from "../components/popup";
import { POSITION } from "../components/position";
import { PLAYER } from "../components/player";
import { getTab, getVerticalIndex, isInPopup } from "./popup";
import { World } from "../ecs";
import { TypedEntity } from "../entities";

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
  const hero = world.assertComponents(assertHero(world), [ACTIONABLE, PLAYER]);
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

  it("opens, scrolls and closes the credits popup", () => {
    const { world, hero } = setup();

    trigger(world, "interact");
    advanceUntil(world, () => !!isInPopup(world, hero), 1000);

    const popup = world.getEntityById(hero[PLAYER].popup) as TypedEntity<
      "POPUP" | "SEQUENCABLE"
    >;
    expect(getTab(world, popup)).toBe("credits");
    expect(getVerticalIndex(world, popup)).toBe(0);

    // let opening animation settle before navigating
    step(world, 30);
    trigger(world, "down");
    advanceUntil(world, () => getVerticalIndex(world, popup) === 1, 1000);

    trigger(world, "close");
    advanceUntil(world, () => !isInPopup(world, hero), 1000);
  });
});
