import {
  act,
  advance,
  advanceUntil,
  assertHero,
  createAreaWorld,
  giveItems,
  GivenItem,
  step,
} from "../../testing/harness";
import { World } from "../../engine/ecs";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { ITEM } from "../../engine/components/item";
import { composeCharacterPixels } from "../../components/Row/characters";
import { getFacingLayers } from "../../game/assets/ui";
import { getItemSprite } from "../../game/assets/utils";
import { equipItem } from "../../engine/systems/collect";
import { INVENTORY } from "../../engine/components/inventory";
import { POPUP, Popup } from "../../engine/components/popup";
import { PLAYER } from "../../engine/components/player";
import { SPRITE } from "../../engine/components/sprite";
import { STATS } from "../../engine/components/stats";
import { getSequence } from "../../engine/systems/sequence";
import {
  getVerticalIndex,
  getTabSelections,
  visibleStats,
  gearSlots,
  mapScroll,
  openPopup,
  setVerticalIndex,
} from "../../engine/systems/popup";
import { rerenderEntity } from "../../engine/systems/renderer";
import { spendItem } from "../../engine/systems/trigger";
import { colors } from "../../game/assets/colors";
import { createText } from "../../game/assets/ui";
import { frameHeight, frameWidth, renderPopup } from "../../game/assets/utils";
import { displayedClasses, hairColors } from "../../game/assets/pixels";
import { credits } from "../../game/assets/credits";
import { brewingRecipes } from "../../game/balancing/brewing";
import { buildConstructions } from "../../game/balancing/building";
import { setSaveSummaries, saveVersion, SaveSummary } from "../../game/saves";
import { craftingIngredients } from "../../game/balancing/crafting";
import {
  createShop,
  getShopper,
  getTraderDeal,
  openStation,
  selectRow,
} from "../workstations/helpers";

const setup = (items: GivenItem[] = []) => {
  const world = createAreaWorld("\n|       |\n|  ♀    |\n|       |\n");
  const hero = getShopper(world);
  giveItems(world, hero, items);
  return { world, hero };
};

const open = (world: World, config: Pick<Popup, "tabs"> & Partial<Popup>) => {
  const hero = assertHero(world);
  const popup = createShop(
    world,
    { x: hero.POSITION.x + 1, y: hero.POSITION.y },
    config
  );
  openPopup(world, hero, popup, true);
  advance(world, 700);
  return popup;
};

const menu = (world: World) =>
  world.assertByIdAndComponents(assertHero(world)[PLAYER].popup, [
    POPUP,
    "POSITION",
    "SEQUENCABLE",
  ]);

const text = (world: World, popup = menu(world), row?: number) => {
  const sequence = getSequence(world, popup, "popup")!;
  return Array.from({ length: frameHeight - 2 }, (_, rowIndex) =>
    Array.from({ length: frameWidth - 2 }, (_, column) => {
      const id = sequence.particles[`popup-content-${rowIndex}-${column}`];
      const sprite = world.getEntityByIdAndComponents(id, [SPRITE])?.[SPRITE];
      return (
        sprite?.layers.find((layer) => /^[a-zA-Z0-9?!/.,]$/.test(layer.char))
          ?.char || " "
      );
    }).join("")
  )
    .filter((_, index) => row === undefined || index === row)
    .join("\n");
};

const button = (world: World, popup = menu(world)) => {
  const sequence = getSequence(world, popup, "popup")!;
  return Object.entries(sequence.particles)
    .filter(([name]) => name.startsWith("popup-next-"))
    .flatMap(
      ([, id]) => world.assertByIdAndComponents(id, [SPRITE])[SPRITE].layers
    );
};

describe("dialog rows after inventory changes", () => {
  it("clamps the last sell row in the same update that removes its item", () => {
    const { world, hero } = setup([
      { stackable: "coin", amount: 1 },
      { stackable: "ore", amount: 1 },
    ]);
    const popup = open(world, { tabs: ["sell"] });
    act(world, "down");
    act(world, "right");
    expect(hero[INVENTORY].items).toHaveLength(1);
    expect(getVerticalIndex(world, popup)).toBe(0);
    expect(text(world, popup)).toContain("Not able to sell");
    expect(text(world, popup)).toContain("coin");
  });

  it.each(["inspect", "equip", "plant"] as const)(
    "bounds %s before rendering after an item disappears without navigation",
    (tab) => {
      const { world, hero } = setup([
        { stackable: "apple", amount: 1 },
        { stackable: "berry", amount: 1 },
        { stackable: "flower", amount: 1 },
        { weapon: "sword", material: "wood", amount: 1 },
        { weapon: "sword", material: "iron", amount: 1 },
      ]);
      const popup = open(world, { tabs: [tab] });
      setVerticalIndex(world, popup, 1);
      step(world);
      const removed =
        tab === "equip"
          ? ({ weapon: "sword", material: "iron", amount: 1 } as const)
          : tab === "plant"
          ? ({ stackable: "flower", amount: 1 } as const)
          : ({ stackable: "flower", amount: 1 } as const);
      spendItem(world, hero, removed);
      spendItem(
        world,
        hero,
        tab === "inspect"
          ? { stackable: "berry", amount: 1 }
          : { stackable: "apple", amount: 1 }
      );
      step(world);
      expect(getVerticalIndex(world, popup)).toBe(0);
      expect(text(world, popup)).not.toContain("flower");
    }
  );

  it("keeps the selected stack while eating and bounds the row after its last item", () => {
    const { world, hero } = setup([
      { stackable: "ore", amount: 1 },
      { stackable: "apple", amount: 2 },
    ]);
    act(world, "inspect");
    advance(world, 700);
    act(world, "down");
    act(world, "right");
    expect(getVerticalIndex(world, menu(world))).toBe(1);
    expect(text(world)).toContain("Apple");
    act(world, "right");
    expect(getVerticalIndex(world, menu(world))).toBe(0);
    expect(text(world)).not.toContain("Apple");
    expect(hero[INVENTORY].items).toHaveLength(1);
  });

  it("bounds a saved tab index before rendering the destination tab", () => {
    const { world } = setup([{ stackable: "coin", amount: 5 }]);
    const popup = open(world, {
      tabs: ["sell", "buy"],
      deals: [getTraderDeal({ stackable: "apple" })],
    });
    popup[POPUP].verticalIndezes[1] = 8;
    expect(() => act(world, "tab")).not.toThrow();
    expect(getVerticalIndex(world, popup)).toBe(0);
    expect(text(world, popup)).toContain("Apple");
  });
});

describe("live dialog content", () => {
  it("updates bag amounts when a stack changes without a popup action", () => {
    const { world, hero } = setup([{ stackable: "apple", amount: 9 }]);
    act(world, "inspect");
    advance(world, 700);
    expect(text(world, menu(world), 0)).toContain("9");
    spendItem(world, hero, { stackable: "apple", amount: 1 });
    step(world);
    expect(text(world, menu(world), 0)).toContain("8");
    expect(text(world, menu(world), 0)).not.toContain("9");
  });

  it("refreshes stats without a navigation action", () => {
    const { world, hero } = setup();
    act(world, "stats");
    advance(world, 700);
    const before = text(world);
    hero[STATS].power += 3;
    rerenderEntity(world, hero);
    step(world);
    expect(text(world)).not.toBe(before);
  });

  it("updates buy affordability when funds change in the background", () => {
    const { world, hero } = setup([{ stackable: "coin", amount: 99 }]);
    const popup = open(world, {
      tabs: ["buy"],
      deals: [getTraderDeal({ stackable: "apple" })],
    });
    expect(button(world, popup)).toContainEqual(
      expect.objectContaining({ color: colors.lime })
    );
    spendItem(world, hero, { stackable: "coin", amount: 98 });
    step(world);
    expect(button(world, popup)).not.toContainEqual(
      expect.objectContaining({ color: colors.lime })
    );
  });

  it("updates craft ingredient counts and button when parts change", () => {
    const { world, hero } = setup([{ stackable: "leaf", amount: 9 }]);
    const popup = open(world, {
      tabs: ["craft"],
      ingredients: craftingIngredients,
    });
    expect(text(world, popup)).toContain("9/3");
    spendItem(world, hero, { stackable: "leaf", amount: 8 });
    step(world);
    expect(text(world, popup)).toContain("1/3");
    expect(button(world, popup)).not.toContainEqual(
      expect.objectContaining({ color: colors.lime })
    );
  });

  it("refreshes quick slot counts when their items are spent elsewhere", () => {
    const { world, hero } = setup([{ stackable: "apple", amount: 9 }]);
    hero[PLAYER].quickItems[1] = { stackable: "apple" };
    act(world, "use");
    advance(world, 700);
    expect(text(world, menu(world), 0)).toContain("9");
    spendItem(world, hero, { stackable: "apple", amount: 8 });
    step(world);
    expect(text(world, menu(world), 0)).not.toContain("9");
  });

  it("clears a longer previous description and its extra lines", () => {
    const { world } = setup();
    const popup = open(world, { tabs: ["inspect"] });
    const sequence = getSequence(world, popup, "popup")!;
    renderPopup(
      world,
      popup,
      sequence,
      undefined,
      [createText("Item")],
      "selected",
      [createText("Long description"), createText("Old second line")]
    );
    renderPopup(
      world,
      popup,
      sequence,
      undefined,
      [createText("Item")],
      "selected",
      [createText("Short")]
    );
    expect(text(world, popup)).toContain("Short");
    expect(text(world, popup)).not.toContain("description");
    expect(text(world, popup)).not.toContain("Old second line");
  });

  it("clears details and restores content space when the final item disappears", () => {
    const { world, hero } = setup([{ stackable: "apple", amount: 1 }]);
    act(world, "inspect");
    advance(world, 700);
    expect(
      getSequence(world, menu(world), "popup")!.args.detailsPadding
    ).toBeGreaterThan(0);
    spendItem(world, hero, { stackable: "apple", amount: 1 });
    step(world);
    expect(text(world)).toContain("No items yet.");
    expect(getSequence(world, menu(world), "popup")!.args.detailsPadding).toBe(
      0
    );
    expect(text(world)).not.toContain("Restore");
  });
});

const summary = (name: string): SaveSummary => ({
  id: name,
  name,
  version: saveVersion,
  level: "LEVEL_TUTORIAL",
  classKey: "rogue",
  hairColor: colors.grey,
  heroLevel: 1,
  items: [],
  playtime: 0,
  kills: 0,
  deaths: 0,
});

afterEach(() => setSaveSummaries([]));

describe("restored dialog indexes", () => {
  it.each([
    ["inspect", 2],
    ["equip", 3],
    ["plant", 1],
    ["sell", 6],
    ["buy", 1],
    ["craft", craftingIngredients.length - 1],
    ["stats", visibleStats.length],
    ["gear", gearSlots.length - 1],
    ["map", mapScroll - 1],
    ["build", buildConstructions.length],
    ["class", displayedClasses.length - 1],
    ["style", hairColors.length - 1],
    ["credits", credits.length - 1],
    ["info", 3],
    ["talk", 3],
    ["warp", 3],
    ["quest", 4],
    ["load", 1],
    ["chat", 0],
    ["use", 0],
  ] as const)(
    "bounds the %s row before reading its item, description or preview",
    (tab, lastIndex) => {
      const { world } = setup([
        { stackable: "apple", amount: 1 },
        { stackable: "berry", amount: 1 },
        { stackable: "flower", amount: 1 },
        { weapon: "sword", material: "wood", amount: 1 },
        { weapon: "sword", material: "iron", amount: 1 },
        { accessory: "map", material: "gold", amount: 1 },
        { tool: "hammer", material: "iron", amount: 1 },
      ]);
      setSaveSummaries([summary("a"), summary("b")]);
      const popup = open(world, {
        tabs: [tab],
        lines: [
          Array.from({ length: 12 }, (_, index) => createText(`Line ${index}`)),
        ],
        deals:
          tab === "buy"
            ? [
                getTraderDeal({ stackable: "apple" }),
                getTraderDeal({ stackable: "ore" }),
              ]
            : [],
        ingredients: craftingIngredients,
      });
      setVerticalIndex(world, popup, 999);
      expect(() => step(world)).not.toThrow();
      expect(getVerticalIndex(world, popup)).toBe(lastIndex);
      expect(
        getSequence(world, popup, "popup")!.args.scrollIndex
      ).toBeGreaterThanOrEqual(0);
    }
  );

  it.each([{ selections: [[0]] }, { selections: [[0, 0]] }])(
    "bounds brewing recipe and option indexes at %j",
    ({ selections }) => {
      const { world } = setup();
      const popup = open(world, {
        tabs: ["brew"],
        recipes: brewingRecipes,
        selections: selections.map((path) => [...path]),
      });
      setVerticalIndex(world, popup, 999);
      step(world);
      expect(getVerticalIndex(world, popup)).toBe(
        selections[0].length === 1
          ? brewingRecipes.length - 1
          : brewingRecipes[0].options.length - 1
      );
    }
  );
});

describe("background dialog updates", () => {
  it("refreshes a bag after automatic potion consumption removes its last row", () => {
    const { world, hero } = setup([
      { stackable: "ore", amount: 1 },
      { consume: "potion", material: "wood", stat: "hp", amount: 1 },
    ]);
    hero[STATS].maxHp = 30;
    hero[STATS].hp = 1;
    act(world, "inspect");
    advance(world, 700);
    act(world, "down");
    advanceUntil(world, () => hero[INVENTORY].items.length === 1, 15000);
    step(world);
    expect(getVerticalIndex(world, menu(world))).toBe(0);
    expect(text(world)).toContain("Ore");
    expect(text(world)).not.toContain("Potion");
  });

  it("updates the equipment portrait and slot when the weapon changes", () => {
    const { world, hero } = setup([
      { weapon: "sword", material: "wood", amount: 1 },
    ]);
    const [spear] = giveItems(world, hero, [
      {
        weapon: "spear",
        skill: "spear",
        material: "gold",
        element: "air",
        amount: 1,
      },
    ]);
    act(world, "gear");
    advance(world, 700);
    const before = text(world);
    equipItem(world, hero, spear);
    rerenderEntity(world, hero);
    step(world);
    expect(hero[EQUIPPABLE].weapon).toBe(world.getEntityId(spear));
    expect(text(world)).not.toBe(before);
    expect(text(world)).toContain("Spear");
    const sequence = getSequence(world, menu(world), "popup")!;
    const icon = world.assertByIdAndComponents(
      sequence.particles["popup-content-0-1"],
      [SPRITE]
    )[SPRITE];
    expect(composeCharacterPixels(getFacingLayers(icon))).toEqual(
      composeCharacterPixels(
        getItemSprite(spear[ITEM], "display", undefined, 1).layers
      ).map((color) => color || colors.black)
    );
  });

  it("does not unequip the current weapon when a different weapon is removed", () => {
    const { world, hero } = setup([
      { weapon: "sword", material: "wood", amount: 1 },
    ]);
    const current = hero[EQUIPPABLE].weapon;
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);
    act(world, "gear");
    advance(world, 700);
    spendItem(world, hero, { weapon: "sword", material: "iron", amount: 1 });
    step(world);
    expect(hero[EQUIPPABLE].weapon).toBe(current);
    expect(text(world)).toContain("Sword");
  });

  it("refreshes the save title and preview when the save summaries change", () => {
    const { world } = setup();
    setSaveSummaries([summary("Old")]);
    const popup = open(world, { tabs: ["load"] });
    expect(text(world, popup)).toContain("Old");
    setSaveSummaries([{ ...summary("New"), classKey: "knight", heroLevel: 9 }]);
    step(world);
    expect(text(world, popup)).toContain("New");
    expect(text(world, popup)).not.toContain("Old");
    expect(text(world, popup)).toContain("Knight");
  });

  it("updates quest readiness when gathered items are spent", () => {
    const { world, hero } = setup([{ stackable: "apple", amount: 2 }]);
    const popup = open(world, {
      tabs: ["quest"],
      lines: [[]],
      deals: [
        {
          item: { stackable: "coin", amount: 1 },
          stock: 1,
          prices: [{ stackable: "apple", amount: 2 }],
        },
      ],
    });
    expect(button(world, popup)).toContainEqual(
      expect.objectContaining({ color: colors.lime })
    );
    spendItem(world, hero, { stackable: "apple", amount: 1 });
    step(world);
    expect(button(world, popup)).not.toContainEqual(
      expect.objectContaining({ color: colors.lime })
    );
    act(world, "right");
    expect(hero[INVENTORY].items).toHaveLength(1);
  });

  it("reuses button particles across refreshes and removes them on close", () => {
    const { world, hero } = setup([{ stackable: "coin", amount: 99 }]);
    const popup = open(world, {
      tabs: ["buy"],
      deals: [getTraderDeal({ stackable: "apple" })],
    });
    const sequence = getSequence(world, popup, "popup")!;
    const buttons = Object.entries(sequence.particles)
      .filter(([name]) => name.startsWith("popup-next-"))
      .map(([, id]) => id);
    for (let refresh = 0; refresh < 3; refresh += 1) {
      rerenderEntity(world, hero);
      step(world);
    }
    expect(
      Object.entries(sequence.particles)
        .filter(([name]) => name.startsWith("popup-next-"))
        .map(([, id]) => id)
    ).toEqual(buttons);
    act(world, "close");
    advance(world, 1000);
    expect(buttons.map((id) => world.getEntityById(id))).toEqual(
      buttons.map(() => undefined)
    );
  });
});

describe("dialog transaction results", () => {
  it("shows sold-out stock and denies a second purchase", () => {
    const { world, hero } = setup([{ stackable: "coin", amount: 99 }]);
    const popup = open(world, {
      tabs: ["buy"],
      deals: [getTraderDeal({ stackable: "apple" }, 1)],
    });
    act(world, "right");
    expect(text(world, popup)).toContain("Out of stock");
    expect(button(world, popup)).not.toContainEqual(
      expect.objectContaining({ color: colors.lime })
    );
    const funds = hero[INVENTORY].items.map((id) => ({
      ...world.assertByIdAndComponents(id, [ITEM])[ITEM],
    }));
    act(world, "right");
    expect(
      hero[INVENTORY].items.map(
        (id) => world.assertByIdAndComponents(id, [ITEM])[ITEM]
      )
    ).toEqual(funds);
  });

  it("refreshes the crafting inputs after making an item", () => {
    const { world } = setup([{ stackable: "leaf", amount: 9 }]);
    const popup = open(world, {
      tabs: ["craft"],
      ingredients: craftingIngredients,
    });
    act(world, "right");
    expect(text(world, popup)).toContain("6/3");
  });

  it("refreshes a viewed brewing option when an ingredient runs out", () => {
    const world = createAreaWorld("\n|       |\n|  ♀K   |\n|       |\n", {
      legend: { K: "kettle" },
    });
    const hero = getShopper(world);
    const recipe = brewingRecipes[0];
    giveItems(world, hero, recipe.options[0]);
    const popup = openStation(world);
    act(world, "right");
    act(world, "right");
    expect(button(world, popup)).toContainEqual(
      expect.objectContaining({ color: colors.lime })
    );
    spendItem(world, hero, recipe.options[0][0]);
    step(world);
    expect(button(world, popup)).not.toContainEqual(
      expect.objectContaining({ color: colors.lime })
    );
    expect(() => act(world, "right")).not.toThrow();
  });

  it("refreshes construction costs when materials are spent", () => {
    const { world, hero } = setup([
      { weapon: "sword", material: "wood", amount: 1 },
      { tool: "hammer", material: "iron", amount: 1 },
      { stackable: "stick", amount: 9 },
    ]);
    act(world, "skill");
    advance(world, 700);
    selectRow(world, menu(world), 1);
    expect(text(world)).toContain("9/3");
    spendItem(world, hero, { stackable: "stick", amount: 8 });
    step(world);
    expect(text(world)).toContain("1/3");
    expect(button(world)).not.toContainEqual(
      expect.objectContaining({ color: colors.lime })
    );
  });

  it("bounds the quick-item picker after its last usable item disappears", () => {
    const { world, hero } = setup([
      { stackable: "apple", amount: 1 },
      { stackable: "shroom", amount: 1 },
    ]);
    const popup = open(world, { tabs: ["use"], selections: [[0, 1]] });
    setVerticalIndex(world, popup, 1);
    step(world);
    spendItem(world, hero, { stackable: "shroom", amount: 1 });
    step(world);
    expect(getVerticalIndex(world, popup)).toBe(0);
    expect(text(world, popup)).toContain("Apple");
    expect(text(world, popup)).not.toContain("Shroom");
  });
});

it("restores the frame when details disappear without changing the number of rows", () => {
  const { world } = setup();
  const popup = open(world, { tabs: ["inspect"] });
  const sequence = getSequence(world, popup, "popup")!;
  const side = world.assertByIdAndComponents(
    sequence.particles["popup-right-1"],
    [SPRITE, "ORIENTABLE"]
  );
  const original = side[SPRITE];
  const content = Array.from({ length: frameHeight - 2 }, () =>
    createText("Item")
  );
  renderPopup(world, popup, sequence, undefined, content, "selected", [
    createText("Details"),
  ]);
  expect(sequence.args.scrollbar).toBe(true);
  renderPopup(world, popup, sequence, undefined, content);
  expect(sequence.args.scrollbar).toBe(false);
  expect(side[SPRITE]).toBe(original);
  expect(side.ORIENTABLE.facing).toBe("right");
});

it("returns to quest requirements if delivered items disappear while choosing a reward", () => {
  const { world, hero } = setup([{ stackable: "apple", amount: 2 }]);
  const popup = open(world, {
    tabs: ["quest"],
    lines: [[]],
    deals: [
      {
        item: { stackable: "coin", amount: 1 },
        stock: 1,
        prices: [{ stackable: "apple", amount: 2 }],
      },
    ],
    choices: [
      { stackable: "arrow", amount: 1 },
      { stackable: "charge", amount: 1 },
    ],
  });
  act(world, "right");
  act(world, "down");
  expect(getTabSelections(world, popup)).toHaveLength(1);
  spendItem(world, hero, { stackable: "apple", amount: 1 });
  step(world);
  expect(getTabSelections(world, popup)).toEqual([]);
  expect(text(world, popup)).toContain("Gather");
  expect(button(world, popup)).not.toContainEqual(
    expect.objectContaining({ color: colors.lime })
  );
});
