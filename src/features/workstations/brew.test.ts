import {
  act,
  advance,
  advanceUntil,
  countItems,
  createAreaWorld,
  findEntityAt,
  findInArea,
  getItems,
  giveItems,
  holdMove,
  step,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { BREWABLE } from "../../engine/components/brewable";
import { BURNABLE } from "../../engine/components/burnable";
import { INVENTORY } from "../../engine/components/inventory";
import { POPUP, Recipe } from "../../engine/components/popup";
import { REFERENCE } from "../../engine/components/reference";
import { TypedEntity } from "../../engine/entities";
import {
  getTab,
  getTabSelections,
  getVerticalIndex,
} from "../../engine/systems/popup";
import {
  brewingDurationFactor,
  brewingRecipes,
} from "../../game/balancing/brewing";
import { closeStation, getShopper, openStation, selectRow } from "./helpers";

// ♀ hero, K kettle
const area = `
|       |
|  ♀K   |
|       |
`;

const setup = (kettle = "kettle") => {
  const world = createAreaWorld(area, { legend: { K: kettle } });
  const hero = getShopper(world);
  return { world, hero };
};

const getKettle = (world: World) =>
  findEntityAt(world, findInArea(area, "K"), [
    BREWABLE,
    BURNABLE,
    INVENTORY,
  ]) as TypedEntity<"BREWABLE" | "BURNABLE" | "INVENTORY">;

const findRecipe = (match: (recipe: Recipe) => boolean) => {
  const row = brewingRecipes.findIndex(match);
  return { row, recipe: brewingRecipes[row] };
};

const quickest = findRecipe(
  ({ duration }) =>
    duration === Math.min(...brewingRecipes.map((recipe) => recipe.duration))
);
const healing = findRecipe(
  ({ item }) =>
    item.consume === "potion" && item.material === "wood" && item.stat === "hp"
);

/** Carried amount of an ingredient, regardless of the recipe amount. */
const countIngredient = (
  world: World,
  entity: TypedEntity<"INVENTORY">,
  { amount, ...item }: Recipe["item"]
) => countItems(world, entity, item);

const getBrewingTime = (world: World, recipe: Recipe) =>
  recipe.duration *
  brewingDurationFactor *
  world.metadata.gameEntity[REFERENCE].tick;

/** Open the kettle and browse to the options of a recipe. */
const openRecipe = (world: World, row: number) => {
  const popup = openStation(world);
  act(world, "right");
  selectRow(world, popup, row);
  act(world, "right");
  return popup;
};

describe("brewing in a kettle", () => {
  it("opens the kettle and browses recipes and their options", () => {
    const { world, hero } = setup();
    const popup = openStation(world);

    expect(getTab(world, popup)).toBe("brew");
    expect(hero[ACTIONABLE].add).toBe(world.getEntityId(popup));

    act(world, "right");
    expect(getTabSelections(world, popup)).toHaveLength(1);
    selectRow(world, popup, brewingRecipes.length - 1);
    act(world, "down");
    expect(getVerticalIndex(world, popup)).toBe(brewingRecipes.length - 1);

    selectRow(world, popup, healing.row);
    act(world, "right");
    expect(getTabSelections(world, popup)).toEqual([0, healing.row]);
    expect(hero[ACTIONABLE].trade).toBe(world.getEntityId(popup));
    selectRow(world, popup, healing.recipe.options.length - 1);
    act(world, "down");
    expect(getVerticalIndex(world, popup)).toBe(
      healing.recipe.options.length - 1
    );

    act(world, "left");
    expect(getTabSelections(world, popup)).toEqual([0]);
    expect(getVerticalIndex(world, popup)).toBe(healing.row);
    expect(playedSounds).toContain("back");
  });

  it("spends the ingredients and brews the result over time", () => {
    const { world, hero } = setup();
    const kettle = getKettle(world);
    const [ingredient] = quickest.recipe.options[0];
    giveItems(world, hero, [{ ...ingredient, amount: ingredient.amount + 2 }]);
    openRecipe(world, quickest.row);

    act(world, "right");

    expect(playedSounds).toContain("confirm");
    expect(countIngredient(world, hero, ingredient)).toBe(2);
    expect(kettle[BREWABLE].queue).toHaveLength(1);
    expect(kettle[BURNABLE].simmer).toBe(true);

    advance(world, getBrewingTime(world, quickest.recipe) * 0.9);
    expect(kettle[INVENTORY].items).toHaveLength(0);

    advanceUntil(
      world,
      () => kettle[INVENTORY].items.length > 0,
      getBrewingTime(world, quickest.recipe) * 0.2
    );
    expect(kettle[BREWABLE].queue).toHaveLength(0);
    advanceUntil(world, () => !kettle[BURNABLE].simmer, 1000);
  });

  it("collects the brewed result from the kettle", () => {
    const { world, hero } = setup();
    const kettle = getKettle(world);
    giveItems(world, hero, quickest.recipe.options[0]);
    openRecipe(world, quickest.row);
    act(world, "right");
    closeStation(world);
    advanceUntil(
      world,
      () => kettle[INVENTORY].items.length > 0,
      getBrewingTime(world, quickest.recipe) * 1.2
    );

    holdMove(world, ["right"]);
    advanceUntil(
      world,
      () => countIngredient(world, hero, quickest.recipe.item) > 0,
      2000
    );
    holdMove(world, []);

    expect(countIngredient(world, hero, quickest.recipe.item)).toBe(
      quickest.recipe.item.amount
    );
    expect(kettle[INVENTORY].items).toHaveLength(0);
  });

  it("brews with the selected alternative ingredients", () => {
    const { world, hero } = setup();
    const kettle = getKettle(world);
    const [first, second] = healing.recipe.options;
    giveItems(world, hero, [...first, second[0]]);
    const popup = openRecipe(world, healing.row);
    selectRow(world, popup, 1);

    act(world, "right");

    expect(countIngredient(world, hero, first[0])).toBe(first[0].amount);
    expect(countIngredient(world, hero, second[0])).toBe(0);
    expect(countIngredient(world, hero, second[1])).toBe(0);
    expect(countIngredient(world, hero, second[2])).toBe(0);
    expect(kettle[BREWABLE].queue).toEqual([
      expect.objectContaining({ item: healing.recipe.item }),
    ]);
  });

  it("refuses to brew without the selected ingredients", () => {
    const { world, hero } = setup();
    const kettle = getKettle(world);
    const [first] = healing.recipe.options;
    giveItems(world, hero, first);
    const popup = openRecipe(world, healing.row);
    selectRow(world, popup, 1);
    const before = getItems(world, hero);

    act(world, "right");

    expect(playedSounds).toContain("deny");
    expect(getItems(world, hero)).toEqual(before);
    expect(kettle[BREWABLE].queue).toHaveLength(0);
  });

  it("brews queued recipes one after another", () => {
    const { world, hero } = setup();
    const kettle = getKettle(world);
    const [ingredient] = quickest.recipe.options[0];
    giveItems(world, hero, [{ ...ingredient, amount: ingredient.amount * 2 }]);
    openRecipe(world, quickest.row);

    act(world, "right");
    act(world, "right");
    expect(kettle[BREWABLE].queue).toHaveLength(2);

    advanceUntil(
      world,
      () => kettle[INVENTORY].items.length > 0,
      getBrewingTime(world, quickest.recipe) * 1.2
    );
    expect(kettle[BREWABLE].queue).toHaveLength(1);

    advanceUntil(
      world,
      () => kettle[BREWABLE].queue.length === 0,
      getBrewingTime(world, quickest.recipe) * 1.2
    );
    expect(countIngredient(world, kettle, quickest.recipe.item)).toBe(
      quickest.recipe.item.amount * 2
    );
  });

  it("offers no brewing at an unlit kettle", () => {
    const { world, hero } = setup("kettle_passive");
    const kettle = getKettle(world);

    step(world, 15);

    expect(kettle[BURNABLE].burning).toBe(false);
    expect(kettle[POPUP]).toBeUndefined();
    expect(hero[ACTIONABLE].popup).toBeUndefined();
  });
});
