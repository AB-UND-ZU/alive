import { createAreaWorld, step, walk } from "../../testing/harness";
import { TRACKABLE } from "../../engine/components/trackable";
import { ITEM } from "../../engine/components/item";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { assertIdentifier } from "../../engine/utils";
import { finishCollecting, setupHero } from "./helpers";

const area = `
|     |
| ♀φ  |
|     |
`;

describe("compass", () => {
  it("points to the hero while lying on the ground", () => {
    const world = createAreaWorld(area);
    const hero = setupHero(world);
    step(world, 5);

    const [compass] = world.getEntities([ITEM, TRACKABLE]);

    expect(compass[TRACKABLE].target).toBe(world.getEntityId(hero));
  });

  it("points to the spawn once picked up", () => {
    const world = createAreaWorld(area);
    const hero = setupHero(world);

    walk(world, "right");
    finishCollecting(world, hero);
    step(world, 5);

    const compass = world.assertByIdAndComponents(hero[EQUIPPABLE].compass, [
      ITEM,
      TRACKABLE,
    ]);
    expect(compass[ITEM].carrier).toBe(world.getEntityId(hero));
    expect(compass[TRACKABLE].target).toBe(
      world.getEntityId(assertIdentifier(world, "spawn"))
    );
  });
});
