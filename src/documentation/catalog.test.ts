import { UnitKey, unitDefinitions } from "../game/balancing/units";
import {
  itemPage,
  previewItem,
  catalogItems,
  itemVariants,
  unitGroups,
  isContainer,
  fishItems,
  unitPage,
  unitCategory,
  itemCategory,
  isPlantUnit,
} from "./catalog";
import { commandItems } from "../game/assets/commands";
import { getItemSprite } from "../game/assets/utils";
import { getItemStats } from "../game/balancing/equipment";
import { getItemDescription } from "../game/assets/descriptions";

describe("item catalog", () => {
  it("groups skill weapons with equipment", () => {
    expect(itemPage(commandItems.spear)).toBe("gear");
    expect(itemPage(commandItems.wand)).toBe("gear");
    expect(itemPage(commandItems.bow)).toBe("skills");
  });
  it("renders a game description for every command item", () => {
    for (const item of Object.values(commandItems)) {
      expect(() => getItemDescription(previewItem(item))).not.toThrow();
    }
  });
  it("has a supported sprite for every catalog item", () => {
    const missing = Object.entries(catalogItems)
      .filter(([, item]) =>
        /^\?+$/.test(getItemSprite(previewItem(item), "display").name)
      )
      .map(([key]) => key);
    expect(missing).toEqual([]);
  });
  it("keeps direct-cast effects and untyped resources out of the item catalog", () => {
    expect(catalogItems.bolt).toBeUndefined();
    expect(catalogItems.blast).toBeUndefined();
    expect(catalogItems.resource).toBeUndefined();
    expect(catalogItems.fire).toEqual(commandItems.fire);
    expect(catalogItems.wood).toEqual(commandItems.wood);
  });
  it("uses the command variant for an equipment portrait without a tier", () => {
    expect(previewItem({ skill: "slash" }).material).toBe(
      commandItems.slash.material
    );
    expect(previewItem({ skill: "slash", material: "iron" }).material).toBe(
      "iron"
    );
  });
  it("lists each supported equipment material and element", () => {
    const swords = itemVariants(commandItems.sword);
    expect(swords).toHaveLength(25);
    expect(swords).toContainEqual(
      expect.objectContaining({ material: "ruby", element: "earth" })
    );
    expect(itemVariants(commandItems.potion)).toHaveLength(6);
    expect(itemVariants(commandItems.wood)).toHaveLength(1);
    for (const definition of Object.values(catalogItems))
      for (const item of itemVariants(definition)) {
        expect(getItemSprite(item, "display").name).not.toMatch(/^\?+$/);
        expect(() => getItemDescription(item)).not.toThrow();
        expect(() => getItemStats(item)).not.toThrow();
      }
  });
  it("groups material variants without merging different units", () => {
    expect(
      unitGroups(["woodChest", "ironChest", "woodTotem", "fairy"])
    ).toEqual([["woodChest", "ironChest"], ["woodTotem"], ["fairy"]]);
  });
  it("gives spirits and plants one canonical page while preserving category membership", () => {
    for (const element of ["fire", "water", "earth", "air"])
      expect([
        itemCategory(commandItems[element]),
        itemPage(commandItems[element]),
      ]).toEqual(["resources", "elements"]);
    const units = Object.keys(unitDefinitions) as UnitKey[];
    const plants = units.filter((key) =>
      isPlantUnit(key, unitDefinitions[key])
    );
    expect(plants).toHaveLength(12);
    expect(
      plants.filter(
        (key) => unitCategory(key, unitDefinitions[key]) === "units"
      )
    ).toHaveLength(10);
    expect(
      plants.filter(
        (key) => unitCategory(key, unitDefinitions[key]) === "enemies"
      )
    ).toHaveLength(2);
    expect(
      plants.every((key) => unitPage(key, unitDefinitions[key]) === "plants")
    ).toBe(true);
    expect(
      units.filter((key) => unitPage(key, unitDefinitions[key]) === "units")
    ).toHaveLength(10);
    expect(
      units.filter((key) => unitPage(key, unitDefinitions[key]) === "enemies")
    ).toHaveLength(15);
    expect(unitPage("fairy", unitDefinitions.fairy)).toBe("enemies");
    expect(unitPage("chick", unitDefinitions.chick)).toBe("animals");
  });
  it("compares only used equipment with real stats", () => {
    expect(itemVariants(commandItems.axe).map((item) => item.material)).toEqual(
      ["wood", "iron", "gold"]
    );
    expect(itemVariants({ tool: "hammer", material: "diamond" })).toEqual([]);
    expect(itemVariants(commandItems.map)).toHaveLength(1);
    expect(itemVariants(commandItems.compass)).toHaveLength(1);
    expect(
      itemVariants(commandItems.torch).every(
        (item) => item.material !== "diamond" && item.material !== "ruby"
      )
    ).toBe(true);
  });
  it("groups colored mobs and containers into their entity families", () => {
    expect(
      unitGroups([
        "prism",
        "goldPrism",
        "eye",
        "goldEye",
        "orb",
        "goldOrb",
        "diamondOrb",
      ])
    ).toEqual([
      ["prism", "goldPrism"],
      ["eye", "goldEye"],
      ["orb", "goldOrb", "diamondOrb"],
    ]);
    const containers = (Object.keys(unitDefinitions) as UnitKey[]).filter(
      isContainer
    );
    expect(containers).toHaveLength(11);
    expect(
      containers.every(
        (key) => unitPage(key, unitDefinitions[key]) === "containers"
      )
    ).toBe(true);
    expect(itemPage(commandItems.worm)).toBe("animals");
    expect(fishItems.every((item) => itemPage(item) === "animals")).toBe(true);
    expect(itemPage(commandItems.algae)).toBe("consumables");
  });
  it("keeps explicit potion stats and spell elements", () => {
    expect(previewItem(commandItems.potion).stat).toBe("hp");
    expect(previewItem({ consume: "potion", stat: "mp" }).stat).toBe("mp");
    expect(previewItem(commandItems.wave).element).toBe("fire");
    expect(previewItem({ spell: "wave", element: "water" }).element).toBe(
      "water"
    );
  });
});
