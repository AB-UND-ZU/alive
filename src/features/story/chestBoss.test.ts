import { World } from "../../engine";
import { BELONGABLE } from "../../engine/components/belongable";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { POSITION } from "../../engine/components/position";
import { REVIVABLE } from "../../engine/components/revivable";
import { STATS } from "../../engine/components/stats";
import { SPRITE } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { assertIdentifierAndComponents } from "../../engine/utils";
import { woodChest } from "../../game/assets/sprites";
import { advanceUntil, getHero, holdMove, step } from "../../testing/harness";
import { createCreatureWorld, giveSword, toughen } from "../creatures/helpers";
import { interactAsPlayer } from "../doors/helpers";
import { getDialogs, getStep } from "./helpers";

// ♀ hero, C chest boss, Y towers, y tower statues
const arena = `
|               |
|               |
| Y     C     Y |
|               |
|               |
|               |
| y           y |
|               |
|       ♀       |
`;

const named = (world: World, name: string) =>
  world
    .getEntities([IDENTIFIABLE])
    .filter((entity) => entity[IDENTIFIABLE].name === name);

const setupChest = () => {
  const { world, hero } = createCreatureWorld(arena, {
    y: "chest_tower_statue",
  });
  toughen(hero);
  giveSword(world, hero);
  const chest = assertIdentifierAndComponents(world, "chest_boss", [
    STATS,
    POSITION,
    BELONGABLE,
    TOOLTIP,
    SPRITE,
  ]);
  return { world, hero, chest };
};

const provoke = (
  world: World,
  chest: ReturnType<typeof setupChest>["chest"]
) => {
  holdMove(world, ["up"]);
  advanceUntil(world, () => chest[STATS].hp < chest[STATS].maxHp, 5000);
  holdMove(world, []);
};

const respawn = (world: World) => {
  advanceUntil(
    world,
    () => !!world.getEntity([REVIVABLE])?.[REVIVABLE].available,
    10000
  );
  advanceUntil(world, () => !!world.metadata.interact.active, 1000);
  interactAsPlayer(world);
  advanceUntil(world, () => !!getHero(world), 10000);
};

describe("chest boss story", () => {
  it("shouts at the hero when hit", () => {
    const { world, chest } = setupChest();
    expect(getStep(world, chest)).toBe("START_STEP");

    provoke(world, chest);
    advanceUntil(world, () => chest[TOOLTIP].dialogs.length > 0, 2000);

    expect(getStep(world, chest)).toBe("awaken");
    expect(getDialogs(chest)[0]).toMatch(
      /^(Ouch|That hurt|My eyes|Don't touch me|Rude|How dare you)/
    );
  });

  it("returns to rest with full health after the hero dies", () => {
    const { world, hero, chest } = setupChest();
    const start = { ...chest[POSITION] };
    provoke(world, chest);
    advanceUntil(world, () => named(world, "chest_tower").length === 4, 3000);

    hero[STATS].hp = 0;
    advanceUntil(world, () => getStep(world, chest) === "reset", 5000);
    step(world, 5);

    expect(chest[STATS].hp).toBe(chest[STATS].maxHp);
    expect(chest[SPRITE]).toBe(woodChest);
    expect(chest[BELONGABLE].faction).toBe("unit");
    expect(named(world, "chest_mob")).toHaveLength(0);
    advanceUntil(
      world,
      () => chest[POSITION].x === start.x && chest[POSITION].y === start.y,
      10000
    );
  });

  it("waits for a new challenge once the hero respawned", () => {
    const { world, hero, chest } = setupChest();
    provoke(world, chest);
    hero[STATS].hp = 0;
    advanceUntil(world, () => getStep(world, chest) === "reset", 5000);

    respawn(world);
    advanceUntil(world, () => getStep(world, chest) === "START_STEP", 2000);

    expect(chest[BELONGABLE].faction).toBe("unit");
  });
});
