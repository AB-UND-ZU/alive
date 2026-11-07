import { BELONGABLE } from "../../engine/components/belongable";
import { LOCKABLE } from "../../engine/components/lockable";
import { POPUP } from "../../engine/components/popup";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { disposeEntity } from "../../engine/systems/map";
import { getIdentifierAndComponents } from "../../engine/utils";
import {
  advanceUntil,
  assertHero,
  countItems,
  findEntityAt,
  findInArea,
  giveItems,
  step,
} from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  teleport,
  toughen,
} from "../creatures/helpers";
import { getMessages, interact } from "../doors/helpers";
import {
  addNpc,
  claimQuest,
  getDialogs,
  getLines,
  getStep,
  press,
  refresh,
  revisit,
} from "./helpers";

// ♀ hero, U nomad, X nomad chest, D door of the house
const area = `
|                        |
| ♀      ██████████      |
|        █        █      |
|        D  U   X █      |
|        █        █      |
|        ██████████      |
`;

const inside = { x: 10, y: 3 };

const setupNomad = () => {
  const { world, hero } = createCreatureWorld(area, {
    D: "wood_door",
    X: "nomadChest",
  });
  toughen(hero);
  const door = findEntityAt(world, findInArea(area, "D"), [LOCKABLE])!;
  const origin = findInArea(area, "U");
  const nomad = addNpc(world, "fireNomad", origin, "fireNomadNpc", {
    origin: { ...origin },
    door,
    topLeft: { x: 9, y: 2 },
    bottomRight: { x: 16, y: 4 },
  });
  const chest = getIdentifierAndComponents(world, "nomadChest", [
    STATS,
    POSITION,
  ])!;
  step(world, 5);
  return { world, hero, nomad, chest, door, origin };
};

const enter = (world: ReturnType<typeof setupNomad>["world"]) => {
  teleport(world, assertHero(world), inside);
  refresh(world);
};

describe("fire nomad", () => {
  it("ignores the hero outside of the house", () => {
    const { world, nomad } = setupNomad();

    advanceTicks(world, 10);

    expect(getStep(world, nomad)).toBe("watch");
    expect(getDialogs(nomad)).toEqual([]);
    expect(nomad[POPUP]).toBeUndefined();
  });

  it("asks who's there and then asks for help on his farm", () => {
    const { world, nomad } = setupNomad();
    enter(world);
    advanceUntil(world, () => getStep(world, nomad) === "greet", 2000);

    expect(getDialogs(nomad)).toEqual(["Who's there?"]);
    expect(nomad[TOOLTIP].override).toBe("visible");

    advanceUntil(world, () => getStep(world, nomad) === "farm", 10000);

    expect(getDialogs(nomad)).toEqual([]);
    expect(getLines(nomad)).toContain("I don't like");
    expect(getLines(nomad)).toContainEqual(
      expect.stringMatching(/^16.(Berry|Flower|Spore) for my$/)
    );
  });

  it("refuses the farm quest without the crops", () => {
    const { world, hero, nomad } = setupNomad();
    enter(world);
    advanceUntil(world, () => getStep(world, nomad) === "farm", 10000);
    refresh(world);
    interact(world, 30);
    press(world, "right");

    expect(getMessages(world, hero)).toEqual(["Not completed!"]);
  });

  it("sells the schema from his chest after the farm quest", () => {
    const { world, hero, nomad, chest } = setupNomad();
    enter(world);
    advanceUntil(world, () => getStep(world, nomad) === "farm", 10000);
    giveItems(world, hero, [
      { stackable: "berry", amount: 16 },
      { stackable: "flower", amount: 16 },
      { stackable: "spore", amount: 16 },
    ]);
    refresh(world);

    claimQuest(world);
    advanceUntil(world, () => getStep(world, nomad) === "schema", 2000);

    expect(getLines(nomad)).toContain("Only I have the");
    expect(nomad[POPUP].deals[0].carrier).toBe(world.getEntityId(chest));

    giveItems(world, hero, [
      { stackable: "resource", material: "iron", amount: 8 },
    ]);
    revisit(world);
    claimQuest(world);
    step(world, 5);

    expect(countItems(world, hero, { stackable: "schema" })).toBe(1);
    expect(countItems(world, hero, { stackable: "resource" })).toBe(0);
    expect(getStep(world, nomad)).toBe("wait");
  });

  it("warns, opens his door and chases the hero for touching his chest", () => {
    const { world, nomad, chest, door } = setupNomad();
    chest[STATS].hp -= 1;

    advanceUntil(world, () => getStep(world, nomad) === "warn", 2000);
    advanceUntil(world, () => nomad[BELONGABLE].faction === "hostile", 2000);

    expect(nomad[TOOLTIP].dialogs).toHaveLength(1);
    expect(getDialogs(nomad)[0]).toContain("Don't touch!");
    advanceUntil(world, () => !door[LOCKABLE].locked, 10000);
  });

  it("drops his request to warn the hero touching his chest", () => {
    const { world, nomad, chest } = setupNomad();
    enter(world);
    advanceUntil(world, () => getStep(world, nomad) === "farm", 10000);

    chest[STATS].hp -= 1;
    advanceUntil(world, () => getStep(world, nomad) === "warn", 2000);

    expect(nomad[POPUP]).toBeUndefined();
  });

  it("drops his offer to chase the hero who took his chest", () => {
    const { world, nomad, chest } = setupNomad();
    enter(world);
    advanceUntil(world, () => getStep(world, nomad) === "farm", 10000);

    disposeEntity(world, chest);
    advanceUntil(world, () => getStep(world, nomad) === "rage", 2000);

    expect(nomad[POPUP]).toBeUndefined();
  });

  it("calms down and walks home once the hero ran far away", () => {
    const { world, hero, nomad, chest, origin } = setupNomad();
    enter(world);
    advanceUntil(world, () => getStep(world, nomad) === "greet", 2000);
    chest[STATS].hp -= 1;
    advanceUntil(world, () => nomad[BELONGABLE].faction === "hostile", 2000);

    teleport(world, hero, { x: 30, y: 20 });
    advanceUntil(world, () => getStep(world, nomad) === "greet", 2000);
    advanceUntil(world, () => nomad[BELONGABLE].faction === "fire", 5000);
    advanceUntil(
      world,
      () => nomad[POSITION].x === origin.x && nomad[POSITION].y === origin.y,
      20000
    );
  });

  it("rages at the hero as a thief once the chest is gone", () => {
    const { world, nomad, chest } = setupNomad();
    disposeEntity(world, chest);
    enter(world);

    advanceUntil(world, () => getStep(world, nomad) === "rage", 2000);
    advanceUntil(world, () => nomad[BELONGABLE].faction === "hostile", 2000);

    expect(getDialogs(nomad)[0]).toContain("You thief");
  });

  it("gives up the chase when the hero escapes", () => {
    const { world, hero, nomad, chest } = setupNomad();
    disposeEntity(world, chest);
    enter(world);
    advanceUntil(world, () => getStep(world, nomad) === "rage", 2000);

    teleport(world, hero, { x: 30, y: 20 });
    advanceUntil(world, () => getStep(world, nomad) === "wait", 2000);

    expect(nomad[TOOLTIP].override).toBeUndefined();
  });
});
