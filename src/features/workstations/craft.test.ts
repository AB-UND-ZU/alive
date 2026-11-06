import {
  act,
  countItems,
  createAreaWorld,
  findEntityAt,
  findInArea,
  getItems,
  giveItems,
  step,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { ACTIONABLE } from "../../engine/components/actionable";
import { Ingredients, POPUP } from "../../engine/components/popup";
import {
  getTab,
  getVerticalIndex,
  isInPopup,
} from "../../engine/systems/popup";
import { craftingIngredients } from "../../game/balancing/crafting";
import { closeStation, getShopper, openStation, selectRow } from "./helpers";

// ♀ hero, B bench
const area = `
|       |
|  ♀B   |
|       |
`;

const setup = (bench = "bench") => {
  const world = createAreaWorld(area, { legend: { B: bench } });
  const hero = getShopper(world);
  return { world, hero };
};

const findRecipe = (match: (ingredients: Ingredients) => boolean) => {
  const row = craftingIngredients.findIndex(match);
  return { row, recipe: craftingIngredients[row] };
};

const plank = findRecipe(({ item }) => item.stackable === "plank");
const bucket = findRecipe(({ item }) => item.consume === "bucket");
const iron = findRecipe(
  ({ item }) => item.stackable === "resource" && item.material === "iron"
);

describe("crafting at a bench", () => {
  it("opens the bench with every crafting recipe", () => {
    const { world, hero } = setup();
    const bench = findEntityAt(world, findInArea(area, "B"), [POPUP]);

    const popup = openStation(world);

    expect(popup).toBe(bench);
    expect(getTab(world, popup)).toBe("craft");
    expect(popup[POPUP].ingredients).toEqual(craftingIngredients);
    expect(hero[ACTIONABLE].trade).toBe(world.getEntityId(popup));
  });

  it("browses recipes and stops at the last one", () => {
    const { world } = setup();
    const popup = openStation(world);

    selectRow(world, popup, craftingIngredients.length - 1);
    act(world, "down");

    expect(getVerticalIndex(world, popup)).toBe(craftingIngredients.length - 1);
  });

  it("crafts the selected recipe from its parts", () => {
    const { world, hero } = setup();
    const [part] = plank.recipe.parts;
    giveItems(world, hero, [{ ...part, amount: part.amount + 1 }]);
    const popup = openStation(world);
    selectRow(world, popup, plank.row);

    act(world, "right");

    expect(countItems(world, hero, { stackable: "plank" })).toBe(
      plank.recipe.item.amount
    );
    expect(
      countItems(world, hero, { stackable: part.stackable, material: "wood" })
    ).toBe(1);
    expect(playedSounds).toContain("pickup");
    expect(playedSounds).not.toContain("deny");
  });

  it("spends every part of a multi part recipe", () => {
    const { world, hero } = setup();
    giveItems(world, hero, bucket.recipe.parts);
    const popup = openStation(world);
    selectRow(world, popup, bucket.row);

    act(world, "right");

    expect(getItems(world, hero)).toEqual([
      expect.objectContaining({ ...bucket.recipe.item }),
    ]);
  });

  it("crafts repeatedly while parts last", () => {
    const { world, hero } = setup();
    const [part] = iron.recipe.parts;
    giveItems(world, hero, [{ ...part, amount: part.amount * 2 }]);
    const popup = openStation(world);
    selectRow(world, popup, iron.row);

    act(world, "right");
    act(world, "right");
    expect(playedSounds).not.toContain("deny");
    act(world, "right");

    expect(playedSounds).toContain("deny");
    expect(
      countItems(world, hero, { stackable: "resource", material: "iron" })
    ).toBe(iron.recipe.item.amount * 2);
    expect(countItems(world, hero, { stackable: part.stackable })).toBe(0);
  });

  it("refuses to craft with too few parts", () => {
    const { world, hero } = setup();
    const [part] = iron.recipe.parts;
    giveItems(world, hero, [{ ...part, amount: part.amount - 1 }]);
    const popup = openStation(world);
    selectRow(world, popup, iron.row);
    const before = getItems(world, hero);

    act(world, "right");

    expect(playedSounds).toContain("deny");
    expect(getItems(world, hero)).toEqual(before);
  });

  it("refuses to craft with a missing part", () => {
    const { world, hero } = setup();
    giveItems(world, hero, bucket.recipe.parts.slice(0, 1));
    const popup = openStation(world);
    selectRow(world, popup, bucket.row);
    const before = getItems(world, hero);

    act(world, "right");

    expect(playedSounds).toContain("deny");
    expect(getItems(world, hero)).toEqual(before);
  });

  it("closes the bench", () => {
    const { world, hero } = setup();
    openStation(world);

    closeStation(world);

    expect(isInPopup(world, hero)).toBeFalsy();
    expect(hero[ACTIONABLE].trade).toBeUndefined();
  });

  it("offers no crafting at a passive bench", () => {
    const { world, hero } = setup("bench_passive");

    step(world, 15);

    expect(findEntityAt(world, findInArea(area, "B"), [POPUP])).toBeUndefined();
    expect(hero[ACTIONABLE].popup).toBeUndefined();
  });
});
