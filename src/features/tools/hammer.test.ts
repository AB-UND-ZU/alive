import {
  act,
  advanceUntil,
  assertHero,
  countItems,
  findEntityAt,
  getEntitiesAt,
  GivenItem,
  step,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { World } from "../../engine";
import { BUILDABLE } from "../../engine/components/buildable";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { MOUNTABLE } from "../../engine/components/mountable";
import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { getTab } from "../../engine/systems/popup";
import { CellType } from "../../bindings/creation";
import { buildConstructions } from "../../game/balancing/building";
import { getEquipmentStats } from "../../game/balancing/equipment";
import { getResource, holdUntil, setupTools } from "./helpers";

const woodHammer = { tool: "hammer", material: "wood", amount: 1 } as const;
const ironHammer = { tool: "hammer", material: "iron", amount: 1 } as const;

const getConstruction = (cell: CellType) =>
  buildConstructions.find((construction) =>
    construction.variants.some((variant) => variant.cell === cell)
  )!;
const fence = getConstruction("fence");

// ♀ hero, ~ shallow water
const area = `
|       |
| ♀ ~   |
|       |
`;

const setup = (items: GivenItem[]) => {
  const { world, hero } = setupTools(area, items);
  const target = { x: hero[POSITION].x + 1, y: hero[POSITION].y };
  return { world, hero, target };
};

/** Open the build menu with the hammer and choose a construction. */
const selectPlan = (world: World, cell: CellType) => {
  act(world, "skill");
  step(world, 30);
  const index = buildConstructions.indexOf(getConstruction(cell)) + 1;
  for (let line = 0; line < index; line += 1) act(world, "down");
  act(world, "right");
};

/** Turn without stepping, as pending movement would walk in build mode. */
const turn = (world: World, orientation: Orientation) => {
  world.assertComponents(assertHero(world), [ORIENTABLE])[ORIENTABLE].facing =
    orientation;
  step(world, 30);
};

const placePlot = (world: World) => {
  turn(world, "right");
  act(world, "interact");
  step(world, 5);
};

const getPlot = (world: World, position: { x: number; y: number }) =>
  findEntityAt(world, position, [BUILDABLE, STATS]);

/** Switch to hammering and count hits until the plot is finished. */
const hammerPlot = (world: World, target: { x: number; y: number }) => {
  const plot = getPlot(world, target)!;
  let hits = 0;
  act(world, "skill");
  while (plot[STATS].hp < plot[STATS].maxHp) {
    const hp = plot[STATS].hp;
    holdUntil(world, "right", () => plot[STATS].hp !== hp);
    hits += 1;
  }
  advanceUntil(world, () => !getPlot(world, target), 1000);
  return hits;
};

describe("hammer", () => {
  it("opens the build menu", () => {
    const { world, hero } = setup([woodHammer]);

    act(world, "skill");

    const popup = world.assertById(hero[PLAYER].popup!);
    expect(getTab(world, popup)).toBe("build");
  });

  it("refuses a plan without its parts", () => {
    const { world, hero } = setup([woodHammer]);

    selectPlan(world, "fence");

    expect(hero[CONDITIONABLE].build).toBeUndefined();
    expect(hero[PLAYER].popup).toBeDefined();
    expect(playedSounds).toContain("deny");
  });

  it("refuses a plan above the hammer level", () => {
    const jetty = getConstruction("jetty_horizontal");
    const { world, hero } = setup([woodHammer, ...jetty.parts]);

    expect(getEquipmentStats(woodHammer).build).toBeLessThan(jetty.level);

    selectPlan(world, "jetty_horizontal");

    expect(hero[CONDITIONABLE].build).toBeUndefined();
    expect(playedSounds).toContain("deny");
  });

  it("selects an affordable plan and previews it", () => {
    const { world, hero } = setup([woodHammer, ...fence.parts]);

    selectPlan(world, "fence");

    expect(hero[CONDITIONABLE].build).toBeDefined();
    expect(hero[PLAYER].popup).toBeUndefined();
  });

  it("places a plot in front of the hero and consumes the parts", () => {
    const { world, hero, target } = setup([woodHammer, ...fence.parts]);

    selectPlan(world, "fence");
    placePlot(world);

    expect(getPlot(world, target)?.[BUILDABLE].cell).toBe("fence");
    expect(getPlot(world, target)?.[STATS]).toMatchObject({
      hp: 1,
      maxHp: fence.effort + 1,
    });
    expect(countItems(world, hero, { stackable: "stick" })).toBe(0);
    expect(playedSounds).toContain("build");
  });

  it("refuses a second plot once the parts are used up", () => {
    const { world, hero } = setup([woodHammer, ...fence.parts]);

    selectPlan(world, "fence");
    placePlot(world);
    playedSounds.length = 0;
    turn(world, "up");
    act(world, "interact");

    expect(
      getPlot(world, { x: hero[POSITION].x, y: hero[POSITION].y - 1 })
    ).toBeUndefined();
    expect(playedSounds).toContain("deny");
  });

  it("hammers a plot into the finished construction", () => {
    const { world, target } = setup([woodHammer, ...fence.parts]);

    selectPlan(world, "fence");
    placePlot(world);

    expect(hammerPlot(world, target)).toBe(
      Math.ceil(fence.effort / getEquipmentStats(woodHammer).build)
    );
    expect(getResource(world, target)?.HARVESTABLE.resource).toBe("fence");
  });

  it("builds faster with an iron hammer", () => {
    const { world, target } = setup([ironHammer, ...fence.parts]);

    selectPlan(world, "fence");
    placePlot(world);

    expect(hammerPlot(world, target)).toBe(
      Math.ceil(fence.effort / getEquipmentStats(ironHammer).build)
    );
  });

  it("places effortless constructions immediately", () => {
    const sand = getConstruction("sand");
    const { world, target } = setup([woodHammer, ...sand.parts]);

    selectPlan(world, "sand");
    placePlot(world);
    step(world, 30);

    expect(getPlot(world, target)).toBeUndefined();
    expect(getResource(world, target)?.HARVESTABLE.resource).toBe("sand");
  });

  it("can't place a boat on land", () => {
    const boat = getConstruction("boat");
    const { world, hero, target } = setup([woodHammer, ...boat.parts]);

    selectPlan(world, "boat");
    placePlot(world);

    expect(getPlot(world, target)).toBeUndefined();
    expect(countItems(world, hero, { stackable: "plank" })).toBe(1);
  });

  it("builds a boat on water", () => {
    const boat = getConstruction("boat");
    const { world, hero } = setup([woodHammer, ...boat.parts]);
    const water = { x: hero[POSITION].x + 2, y: hero[POSITION].y };

    holdUntil(world, "right", () => hero[POSITION].x === water.x - 1);
    selectPlan(world, "boat");
    placePlot(world);

    expect(getPlot(world, water)?.[BUILDABLE].cell).toBe("boat");

    hammerPlot(world, water);

    expect(
      getEntitiesAt(world, water).some((entity) => MOUNTABLE in entity)
    ).toBe(true);
  });

  it("repairs a damaged fence without a plan", () => {
    const yard = `
|       |
| ♀±    |
|       |
`;
    const { world, hero } = setupTools(yard, [woodHammer]);
    const fenceEntity = findEntityAt(
      world,
      { x: hero[POSITION].x + 1, y: hero[POSITION].y },
      [STATS]
    )!;
    fenceEntity[STATS].hp = 1;

    act(world, "skill");
    step(world, 30);
    act(world, "right");

    expect(hero[CONDITIONABLE].hammer).toBeDefined();

    holdUntil(world, "right", () => fenceEntity[STATS].hp > 1);

    expect(fenceEntity[STATS].hp).toBe(1 + getEquipmentStats(woodHammer).build);
    expect(playedSounds).toContain("harvest");
  });

  it("rotates between variants by turning while planning", () => {
    const chair = getConstruction("chair_right");
    const { world, hero, target } = setup([woodHammer, ...chair.parts]);

    selectPlan(world, "chair_right");
    turn(world, "right");
    holdUntil(world, "down", () => hero[CONDITIONABLE].build?.modifier === 1);
    step(world, 30);
    act(world, "interact");

    expect(hero[ORIENTABLE].facing).toBe("right");
    expect(getPlot(world, target)?.[BUILDABLE].cell).toBe(
      chair.variants[1].cell
    );
  });
});
