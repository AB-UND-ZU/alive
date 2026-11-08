import { commandItems } from "../game/assets/commands";
import { catalogItems, itemCatalogFamilies, itemPage } from "./catalog";
import { obtainedFrom, itemSourceIdentity } from "./itemSources";

describe("item acquisition", () => {
  it("reads actual recipes, shops, quests, natural loot and drops", () => {
    expect(obtainedFrom(commandItems.wood)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "crafting",
          parts: [{ amount: 10, stackable: "stick" }],
        }),
        expect.objectContaining({
          kind: "shops",
          buy: [{ stackable: "coin", amount: 20 }],
          sell: [{ stackable: "coin", amount: 10 }],
        }),
        { kind: "harvest", key: "oak" },
        expect.objectContaining({ kind: "drop", key: "oakChest", chance: 100 }),
      ])
    );
    expect(
      obtainedFrom({ accessory: "compass", material: "iron" })
    ).toContainEqual({ kind: "quest", key: "earthChief" });
    expect(obtainedFrom({ stackable: "egg" })).toContainEqual({
      kind: "naturalUnit",
      key: "chick",
    });
    expect(obtainedFrom({ stackable: "apple" })).toContainEqual({
      kind: "natural",
      key: "apple",
    });
    expect(obtainedFrom({ stackable: "charge" })).toContainEqual({
      kind: "combat",
    });
    expect(
      obtainedFrom({ consume: "bucket", material: "iron", element: "water" })
    ).toContainEqual({ kind: "refill" });
    expect(
      obtainedFrom({ consume: "bucket", material: "iron", element: "water" })
    ).not.toContainEqual({ kind: "test" });
    expect(obtainedFrom({ stackable: "salmon" })).toContainEqual({
      kind: "fishing",
      fishingLevel: 1,
      chance: 54,
    });
    expect(obtainedFrom({ weapon: "sword", material: "wood" })).toContainEqual({
      kind: "collect",
      key: "stick",
    });
    expect(
      obtainedFrom({ weapon: "sword", material: "wood" })
    ).not.toContainEqual({ kind: "test" });
  });
  it("preserves material and element identity, including plain NPC spells", () => {
    expect(itemSourceIdentity({ spell: "beam", material: "iron" })).not.toEqual(
      itemSourceIdentity({ spell: "beam", material: "iron", element: "fire" })
    );
    expect(obtainedFrom({ weapon: "sword", material: "iron" })).toContainEqual(
      expect.objectContaining({
        kind: "forging",
        parts: expect.arrayContaining([
          expect.objectContaining({ weapon: "sword", material: "wood" }),
          expect.objectContaining({
            stackable: "resource",
            material: "iron",
            amount: 5,
          }),
        ]),
      })
    );
  });
  it("shows actual recipe options without claiming unavailable items are Test Mode sources", () => {
    expect(obtainedFrom({ weapon: "sword", material: "ruby" })).toContainEqual(
      expect.objectContaining({
        kind: "forging",
        parts: expect.arrayContaining([
          expect.objectContaining({ material: "diamond", weapon: "sword" }),
          expect.objectContaining({ material: "ruby", stackable: "resource" }),
        ]),
      })
    );
    expect(
      obtainedFrom({ stackable: "resource", material: "wood", element: "fire" })
    ).toEqual([]);
  });
  it("groups every canonical resource and food exactly once", () => {
    for (const category of ["resources", "consumables"]) {
      const keys = itemCatalogFamilies(category).flatMap((group) =>
        group.entries.map((entry) => entry.name)
      );
      expect(keys.length).toBe(new Set(keys).size);
      expect([...keys].sort()).toEqual(
        Object.entries(catalogItems)
          .filter(([, item]) => itemPage(item) === category)
          .map(([key]) => key)
          .sort()
      );
    }
  });
});

it("retains all native fishing levels and exact buy/sell prices", () => {
  expect(
    obtainedFrom({ stackable: "salmon" }).filter(
      (source) => source.kind === "fishing"
    )
  ).toEqual([
    { kind: "fishing", fishingLevel: 1, chance: 54 },
    { kind: "fishing", fishingLevel: 2, chance: 30 },
    { kind: "fishing", fishingLevel: 3, chance: 14 },
  ]);
  expect(obtainedFrom({ stackable: "ore" })).toContainEqual({
    kind: "shops",
    buy: [{ stackable: "coin", amount: 2 }],
    sell: [{ stackable: "coin", amount: 1 }],
  });
  expect(obtainedFrom({ stackable: "salmon" })).toContainEqual({
    kind: "shops",
    buy: [],
    sell: [{ stackable: "coin", amount: 4 }],
  });
  expect(obtainedFrom({ stackable: "leaf" })).toContainEqual({
    kind: "world",
    level: "LEVEL_ISLAND",
    biome: "jungle",
  });
});
