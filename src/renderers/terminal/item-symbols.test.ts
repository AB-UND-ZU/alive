import { elements, materials } from "../../engine/components/item";
import { colors } from "../../game/assets/colors";
import * as sprites from "../../game/assets/sprites";
import * as equipment from "../../game/assets/templates/equipments";
import { bucket } from "../../game/assets/templates/items";
import { colorPalettes } from "../../game/assets/templates";
import { getItemSprite } from "../../game/assets/utils";
import { getItemConsumption } from "../../engine/systems/consume";
import { projectSprite } from "./sprites";

it("keeps source-defined resource shapes and material colors through item lookup", () => {
  for (const [name, char, color] of [
    ["wood", "•", colors.maroon],
    ["coconut", "○", colors.maroon],
    ["plank", "█", colors.maroon],
    ["grain", "¥", colors.yellow],
    ["pearl", "·", colors.white],
    ["algae", "w", colors.green],
    ["spore", ":", colors.white],
    ["mineral", "○", colors.lime],
    ["crystal", "○", colors.aqua],
    ["nugget", "○", colors.yellow],
    ["ingot", "■", colors.yellow],
  ] as const) {
    const cell = projectSprite(sprites[name]);
    expect(cell.char).toBe(char);
    expect(cell.foreground).toBe(color);
  }
  for (const material of materials)
    expect(
      projectSprite(getItemSprite({ stackable: "resource", material }))
    ).toMatchObject({
      char: material === "wood" ? "•" : "■",
      foreground: colorPalettes[material].primary,
    });
});

it("renders every coin and ore count using its source quantity variant", () => {
  for (const [amount, coinChar, oreChar] of [
    [1, "°", "."],
    [2, "○", ":"],
    [3, "o", "÷"],
  ] as const) {
    expect(
      projectSprite(getItemSprite({ stackable: "coin", amount })).char
    ).toBe(coinChar);
    expect(
      projectSprite(getItemSprite({ stackable: "ore", amount })).char
    ).toBe(oreChar);
    expect(projectSprite(sprites.oreDrop, undefined, amount).char).toBe(
      oreChar
    );
  }
});

it("uses material-colored tool and accessory symbols for all material and element variants", () => {
  for (const [name, char] of [
    ["wand", ";"],
    ["hammer", "↑"],
    ["pickaxe", "→"],
    ["axe", "Γ"],
    ["shovel", "↓"],
    ["hook", "⌠"],
    ["torch", "î"],
    ["ring", "ô"],
    ["boots", "ⁿ"],
  ] as const)
    for (const material of materials)
      for (const element of ["default", ...elements] as const)
        expect(projectSprite(equipment[name][material][element])).toMatchObject(
          { char, foreground: colorPalettes[material].primary }
        );
});

it("keeps percentage meals in stat colors and uses a distinct fill for each strength", () => {
  for (const name of [
    "tea",
    "curry",
    "soup",
    "granola",
    "juice",
    "toast",
  ] as const) {
    const consumption = getItemConsumption({
      ITEM: { stackable: name },
    } as any)!;
    expect(consumption.percentage).toBe(true);
    expect(projectSprite(sprites[name])).toMatchObject({
      char: { 15: "▬", 20: "■", 25: "▄" }[consumption.amount],
      foreground: consumption.countable === "hp" ? colors.red : colors.blue,
    });
  }
});

it("preserves sigma flasks, water buckets and static compass directions", () => {
  for (const stat of ["hp", "mp"] as const)
    expect(
      projectSprite(
        getItemSprite({ consume: "potion", material: "wood", stat })
      )
    ).toMatchObject({
      char: "σ",
      foreground: stat === "hp" ? colors.red : colors.blue,
    });
  expect(projectSprite(sprites.emptyFlask)).toMatchObject({
    char: "σ",
    foreground: colors.maroon,
  });
  for (const material of materials) {
    expect(projectSprite(bucket[material].default).char).toBe("u");
    expect(projectSprite(bucket[material].water)).toMatchObject({
      char: "u",
      foreground: colors.blue,
    });
    expect(projectSprite(equipment.compass[material].default).char).toBe("↕");
    for (const [direction, char] of [
      ["up", "↑"],
      ["right", "→"],
      ["down", "↓"],
      ["left", "←"],
    ] as const)
      expect(
        projectSprite(equipment.compass[material].default, direction).char
      ).toBe(char);
  }
});
