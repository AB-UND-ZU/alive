import { createAreaWorld, giveItems, GivenItem } from "../../testing/harness";
import { elements, stackables } from "../../engine/components/item";
import { act, readDetails, setupHero } from "./helpers";

const area = `
|     |
| ♀   |
|     |
`;

const inspect = (
  tab: "inspect" | "equip" | "stats",
  items: GivenItem[] = [],
  index = 0
) => {
  const world = createAreaWorld(area);
  giveItems(world, setupHero(world), items);
  act(world, tab);
  for (let row = 0; row < index; row += 1) act(world, "down");
  return readDetails(world);
};

describe("item descriptions", () => {
  it.each([
    ["stick", "Branch which fell from a", "Craft into"],
    ["coin", "The currency to buy items.", "Enemies"],
    ["arrow", "To be used with a", "Bow"],
    ["sand", "A block of sand used for", "Water"],
  ] as const)("explains where %s comes from", (stackable, first, second) => {
    const details = inspect("inspect", [{ stackable, amount: 1 }]);

    expect(details).toContain(first);
    expect(details).toContain(second);
  });

  it.each([
    ["bread", /5.HP/],
    ["shroom", /1.MP/],
    ["sapling", /1.XP/],
    ["thorn", /-1.HP/],
    ["soup", /25%.MP/],
  ] as const)("shows what eating %s restores", (stackable, effect) => {
    expect(inspect("inspect", [{ stackable, amount: 1 }])).toMatch(effect);
  });

  it.each(
    stackables.filter((stackable) => stackable !== "resource").map((s) => [s])
  )("describes carried %s", (stackable) => {
    expect(inspect("inspect", [{ stackable, amount: 1 }])).not.toBe("");
  });

  it.each([
    ["wood", "Made from", "Potions"],
    ["iron", "Made from", "iron gear"],
    ["gold", "Found at a", "golden gear"],
    ["diamond", "Found at a", "diamond gear"],
    ["ruby", "Found at a", "ruby gear"],
  ] as const)("explains what %s is used for", (material, first, second) => {
    const details = inspect("inspect", [
      { stackable: "resource", material, amount: 1 },
    ]);

    expect(details).toContain(first);
    expect(details).toContain(second);
  });

  it.each(elements.map((element) => [element]))(
    "explains %s spirits are used for forging",
    (element) => {
      expect(
        inspect("inspect", [{ stackable: "resource", element, amount: 1 }])
      ).toContain("Elemental spirit used for forging");
    }
  );

  it("shows the healing and delay of a potion", () => {
    const details = inspect("inspect", [
      { consume: "potion", material: "wood", stat: "hp", amount: 1 },
    ]);

    expect(details).toContain("Automatic healing on low health.");
    expect(details).toContain("Delay");
    expect(details).toMatch(/2.HP/);
  });

  it("explains how a key is used", () => {
    expect(
      inspect("inspect", [{ consume: "key", material: "iron", amount: 1 }])
    ).toContain("Disappears after use.");
  });
});

describe("equipment descriptions", () => {
  it.each([
    [{ weapon: "sword" }, "Simple sword made out of a", /2.Melee/],
    [{ weapon: "spear" }, "A long spear made out of a", /1.Melee/],
    [{ weapon: "wand" }, "A short wand made out of a", /0.Magic/],
    [{ offhand: "shield" }, "Simple shield made of", /1.Armor/],
    [{ spell: "wave" }, "Use to cast a wave of magic.", /3.Magic/],
    [{ spell: "beam" }, "Shoots multiple bolts in a beam.", /-1.MP/],
    [{ spell: "trap" }, "Damages enemies walking over it.", /5.Magic/],
    [{ spell: "dash" }, "Leap forward and pierce enemies.", /4.Magic/],
    [{ skill: "slash" }, "Spins sword with extra damage.", /-1.Charge/],
    [{ skill: "zap" }, "times to near enemies.", /3.Magic/],
    [{ skill: "block" }, "attacks.", /1.Absorb/],
    [{ skill: "totem" }, "Grants +1 of all", /10.Time/],
    [{ skill: "bow" }, "Shoots a ranged projectile.", /-1.Arrow/],
    [{ tool: "axe" }, "Tree to chop.", /1.Logging/],
    [{ tool: "pickaxe" }, "Rock to mine.", /1.Mining/],
    [{ tool: "hook" }, "Fish from the", /1.Fishing/],
    [{ tool: "shovel" }, "Soil and plant", /1.Farming/],
    [{ tool: "hammer" }, "Repair or create a new", /1.Build/],
    [{ accessory: "ring" }, "A fragile ring with arcane aura.", /1.Max MP/],
    [{ accessory: "amulet" }, "A protective and delicate", /2.Max HP/],
    [{ accessory: "torch" }, "Glows bright and keeps you warm.", /2.Vision/],
    [{ accessory: "boots" }, "Simple but soft boots.", /1.Haste/],
    [{ accessory: "compass" }, "Shows the way back to your spawn", /point/],
    [{ accessory: "map" }, "View the area you revealed so far.", /far/],
  ] as const)("explains what a wooden %o does", (item, text, stat) => {
    const details = inspect("equip", [
      { ...item, material: "wood", amount: 1 },
    ]);

    expect(details).toContain(text);
    expect(details).toMatch(stat);
  });

  it.each([
    ["wood", "Simple sword made out of a", /2.Melee/],
    ["iron", "Heavy sword made of", /4.Melee/],
    ["gold", "Shiny sword made of", /6.Melee/],
    ["diamond", "Sharp sword made of", /8.Melee/],
    ["ruby", "Mighty sword made of", /10.Melee/],
  ] as const)("shows how %s makes a sword stronger", (material, text, stat) => {
    const details = inspect("equip", [
      { weapon: "sword", material, amount: 1 },
    ]);

    expect(details).toContain(text);
    expect(details).toMatch(stat);
  });

  it.each([
    ["fire", /3.Burn/],
    ["water", /2.Freeze/],
    ["earth", /2.Drain/],
    ["air", /1.Power/],
  ] as const)("shows the %s spirit effect of a sword", (element, effect) => {
    const details = inspect("equip", [
      { weapon: "sword", material: "iron", element, amount: 1 },
    ]);

    expect(details).toContain("sword with a");
    expect(details).toContain("Spirit");
    expect(details).toMatch(/4.Melee/);
    expect(details).toMatch(effect);
  });

  it.each([
    [{ weapon: "spear" }, "A", /3.Burn/],
    [{ weapon: "wand" }, "A", /0.Burn/],
    [{ offhand: "shield" }, "A", /2.Damp/],
    [{ spell: "wave" }, "A wave of magic.", /2.Burn/],
    [{ spell: "beam" }, "A beam of bolts.", /2.Burn/],
    [{ spell: "trap" }, "Triggers effects.", /2.Burn/],
    [{ spell: "dash" }, "Pierce forward.", /2.Burn/],
    [{ accessory: "ring" }, "A crude ring with a", /1.Power/],
    [{ accessory: "amulet" }, "Sturdy amulet with a", /1.Damp/],
  ] as const)("shows the fire spirit effect of %o", (item, text, effect) => {
    const details = inspect("equip", [
      { ...item, material: "iron", element: "fire", amount: 1 },
    ]);

    expect(details).toContain(text);
    expect(details).toMatch(effect);
  });
});

describe("stat descriptions", () => {
  it("shows the class of the hero", () => {
    expect(inspect("stats")).toContain("Scout");
  });

  it("explains how to gain levels", () => {
    expect(inspect("stats", [], 1)).toContain("Gain levels by collecting");
  });

  it("explains what a stat increases", () => {
    expect(inspect("stats", [], 3)).toContain("Increases your maximum");
  });
});
