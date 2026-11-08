import { worldPlantGroups } from "./WorldPlants";
import { narrativeRows, getCatalogDescription } from "./CatalogEntry";
import { UnitKey, unitDefinitions } from "../game/balancing/units";
import {
  itemPage,
  previewItem,
  referencedItems,
  getEffectSprite,
  catalogItems,
  itemVariants,
  unitGroups,
  isContainer,
  fishItems,
  unitPage,
  itemCategory,
  isWikiUnit,
  isPlantUnit,
  unitComparisonStats,
  unitOverviewGroup,
} from "./catalog";
import { commandItems } from "../game/assets/commands";
import { getItemSprite } from "../game/assets/utils";
import { getItemStats } from "../game/balancing/equipment";
import { getItemDescription } from "../game/assets/descriptions";
import { getFacingLayers, mergeSprites } from "../game/assets/ui";
import { tree2 } from "../game/assets/sprites";
import { composeCharacterPixels } from "../components/Row/characters";

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
  it("resolves native sprites for all referenced production items", () => {
    expect(
      referencedItems.filter(
        (item) =>
          item.amount !== 0 &&
          /^\?+$/.test(
            (
              getEffectSprite(previewItem(item)) ||
              getItemSprite(previewItem(item), "display")
            ).name
          )
      )
    ).toEqual([]);
  });
  it("has a supported sprite for every catalog item", () => {
    const missing = Object.entries(catalogItems)
      .filter(([, item]) =>
        /^\?+$/.test(
          (
            getEffectSprite(previewItem(item)) ||
            getItemSprite(previewItem(item), "display")
          ).name
        )
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
  it("resolves bare equipment and consumables through their native command variants", () => {
    for (const item of [
      { consume: "key" as const },
      { consume: "potion" as const },
      { consume: "bucket" as const },
      { accessory: "torch" as const },
      { accessory: "map" as const },
      { spell: "wave" as const },
    ]) {
      expect(getItemSprite(previewItem(item), "display").name).not.toMatch(
        /^\?+$/
      );
      expect(previewItem(item).material).toBeDefined();
    }
    expect(previewItem({ consume: "key", material: "wood" }).material).toBe(
      "wood"
    );
  });
  it("keeps plain NPC spell materials without an invented element", () => {
    for (const material of ["iron", "gold", "diamond"] as const) {
      const item = previewItem({ spell: "beam", material });
      expect(item.element).toBeUndefined();
      expect(getItemSprite(item, "display").name).not.toMatch(/\?/);
    }
  });
  it("does not advertise unimplemented Diamond and Ruby mines", () => {
    for (const material of ["diamond", "ruby"] as const) {
      const rows = getCatalogDescription({ stackable: "resource", material });
      const text = rows
        .flat()
        .flatMap((sprite) => sprite.layers.map((layer) => layer.char))
        .join("");
      expect(text).not.toContain("Found at a");
      expect(rows.flat().some((sprite) => /^\?+$/.test(sprite.name))).toBe(
        false
      );
      expect(text).toContain("Used to forge");
    }
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
  it("omits the unused boss chest from every documented unit family", () => {
    expect(isWikiUnit("chestBoss")).toBe(false);
    expect(unitGroups(["woodChest", "ironChest", "chestBoss"]).flat()).toEqual([
      "woodChest",
      "ironChest",
    ]);
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
    expect(plants.sort()).toEqual(
      ["cactus1", "cactus2", "hedge1", "hedge2", "tumbleweed"].sort()
    );
    expect(
      plants.every((key) => unitPage(key, unitDefinitions[key]) === "plants")
    ).toBe(true);
    for (const key of ["ilexTulip", "oakHedge1"] as UnitKey[])
      expect(unitPage(key, unitDefinitions[key])).toBe("enemies");
    for (const key of ["woodTotem", "rotten", "box"] as UnitKey[])
      expect(unitPage(key, unitDefinitions[key])).not.toBe("units");
    expect(unitPage("sign", unitDefinitions.sign)).toBe("units");
    expect(unitPage("fairy", unitDefinitions.fairy)).toBe("enemies");
    expect(unitPage("chick", unitDefinitions.chick)).toBe("animals");
  });
  it("groups boss-created enemies as Adds while keeping ordinary plants on their own page", () => {
    for (const key of ["ilexTulip", "oakLily", "oakTower"] as UnitKey[])
      expect(unitOverviewGroup(key)).toBe("Adds");
    for (const key of [
      "golem",
      "golemLimb",
      "oakHedge1",
      "oakHedge2",
    ] as UnitKey[])
      expect(unitOverviewGroup(key)).not.toBe("Adds");
    expect(unitPage("hedge1", unitDefinitions.hedge1)).toBe("plants");
    expect(unitGroups(["golem", "golemLimb"])).toEqual([
      ["golem", "golemLimb"],
    ]);
  });
  it("compares only used equipment with real stats", () => {
    expect(itemVariants(commandItems.axe).map((item) => item.material)).toEqual(
      ["wood", "iron", "gold"]
    );
    expect(itemVariants({ tool: "hammer", material: "diamond" })).toEqual([]);
    for (const key of ["torch", "boots"])
      expect(
        itemVariants(commandItems[key]).map((item) => item.material)
      ).toEqual(["wood", "iron", "gold"]);
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
    expect(previewItem(commandItems.wave).element).toBeUndefined();
    expect(previewItem({ spell: "wave", element: "water" }).element).toBe(
      "water"
    );
  });
});

describe("unit comparison", () => {
  it("includes equipped defenses and the game display offsets", () => {
    const guard = unitComparisonStats("earthGuard");
    expect(guard.stats.hp).toBe(unitDefinitions.earthGuard.stats.hp);
    expect(guard.stats.armor).toBe(1);
    expect(guard.stats.haste).toBe(
      (unitDefinitions.earthGuard.stats.haste || 0) + 3
    );
  });
  it("uses NPC overrides for concealed contact weapons", () => {
    expect(unitComparisonStats("prism").attacks).toEqual(
      expect.arrayContaining([expect.objectContaining({ melee: 1 })])
    );
  });
  it("routes summoned totems away from conversational characters", () => {
    expect(unitPage("woodTotem", unitDefinitions.woodTotem)).toBe("skills");
  });
  it("keeps command-only stat caps out of obtainable item lists", () => {
    for (const stat of ["maxHpCap", "maxMpCap", "maxXp", "maxXpCap", "level"])
      expect(catalogItems[stat]).toBeUndefined();
    expect(catalogItems.hp).toBeDefined();
    expect(catalogItems.xp).toBeDefined();
  });
});

describe("world flora", () => {
  it("includes factory-created fruit trees and ground cover", () => {
    const groups = worldPlantGroups();
    expect(groups.map((group) => group.name)).toEqual([
      "Tree",
      "Palm",
      "Oak",
      "Bush",
      "Grass",
    ]);
    expect(groups[0].plants[2].crops).toEqual(
      expect.arrayContaining([expect.objectContaining({ stackable: "apple" })])
    );
    expect(groups[0].titles).toEqual([
      "Tree 1",
      "Tree 2",
      "Apple",
      "Stump 1",
      "Stump 2",
    ]);
    expect(groups[1].titles).toEqual([
      "Palm 1",
      "Palm 2",
      "Banana",
      "Coconut",
      "Husk 1",
      "Husk 2",
      "Desert Husk 1",
      "Desert Husk 2",
    ]);
    expect(groups[0].plants[0].sprites[0].layers).not.toEqual(
      groups[0].plants[1].sprites[0].layers
    );
    expect(groups[0].plants[0].harvest?.maximum).toBe(5);
    expect(groups[2].plants[0].sprites).toHaveLength(2);
    expect(groups[3].plants[1].crops).toEqual(
      expect.arrayContaining([expect.objectContaining({ stackable: "berry" })])
    );
    expect(groups[4].plants[1].crops).toEqual(
      expect.arrayContaining([expect.objectContaining({ stackable: "flower" })])
    );
  });
  it("layers fruit trees with the native one-item loot sprite rather than its full inventory portrait", () => {
    const apple = worldPlantGroups()[0].plants[2].sprites[0];
    const native = mergeSprites(tree2, {
      name: "Apple",
      layers: getFacingLayers(
        getItemSprite({ stackable: "apple" }, "resource"),
        undefined,
        1
      ),
    });
    expect(composeCharacterPixels(apple.layers)).toEqual(
      composeCharacterPixels(native.layers)
    );
  });
  it("keeps food prose while removing its repeated numeric effect", () => {
    const original = getItemDescription({ stackable: "apple" });
    const rows = narrativeRows(original, ["hp"]);
    expect(rows.length).toBeLessThan(original.length);
    const text = rows
      .flat()
      .map((sprite) => sprite.layers.map((layer) => layer.char).join(""))
      .join("");
    expect(text).toContain("Crisp apple");
  });
  it("omits blocked-slot metadata while preserving weapon descriptions", () => {
    for (const item of [commandItems.spear, commandItems.wand]) {
      const rows = narrativeRows(getCatalogDescription(item));
      const text = rows
        .flat()
        .filter((sprite) => sprite.name === "text_generic")
        .map((sprite) => sprite.layers[sprite.layers.length - 1]?.char || "")
        .join("");
      expect(text).not.toContain("Slot");
      expect(text).toMatch(/spear|wand/);
    }
  });
  it("retains a resource's currency value when it is not listed in the comparison", () => {
    const original = getItemDescription({ stackable: "ingot" });
    expect(narrativeRows(original)).toEqual(original);
  });
});

test("every native tree and palm remains choice keeps its harvest resource and layered sprite", () => {
  const groups = worldPlantGroups();
  for (const [family, index, resource] of [
    [0, 3, "stump"],
    [0, 4, "stump"],
    [1, 4, "husk"],
    [1, 5, "husk"],
    [1, 6, "desert_husk"],
    [1, 7, "desert_husk"],
    [2, 1, "root"],
  ] as const) {
    const plant = groups[family].plants[index];
    expect(plant.harvest?.resource).toBe(resource);
    expect(plant.harvest?.maximum).toBe(1);
    expect(plant.sprites.some((sprite) => sprite.layers.length > 0)).toBe(true);
    expect(plant.crops).toEqual([]);
  }
  expect(groups[2].plants[1].sprites[0].layers).toEqual([]);
  expect(groups[2].plants[1].sprites).toHaveLength(2);
  expect(groups[0].plants[3].sprites[0].layers).not.toEqual(
    groups[0].plants[4].sprites[0].layers
  );
  expect(groups[1].plants[4].sprites[0].layers).not.toEqual(
    groups[1].plants[5].sprites[0].layers
  );
  expect(groups[1].plants[6].sprites[0].layers).not.toEqual(
    groups[1].plants[7].sprites[0].layers
  );
});
