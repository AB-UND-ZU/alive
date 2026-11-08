import { equippedPortrait } from "./EquippedPreview";
import { getItemSprite } from "../game/assets/utils";
import { getFacingLayers } from "../game/assets/ui";
import { composeCharacterPixels } from "../components/Row/characters";

test("visible equipment uses native equipment layers on Scout", () => {
  const item = { weapon: "sword" as const, material: "iron" as const };
  const portrait = equippedPortrait(item);
  expect(portrait).not.toBeNull();
  const sword = getFacingLayers(getItemSprite(item, "display"), "down");
  expect(
    portrait!.layers.some((layer) =>
      sword.some(
        (other) => other.char === layer.char && other.color === layer.color
      )
    )
  ).toBe(true);
  expect(composeCharacterPixels(portrait!.layers).some(Boolean)).toBe(true);
  expect(equippedPortrait(item)).toBe(portrait);
});
test("stat-only equipment does not invent a visible overlay", () => {
  expect(equippedPortrait({ accessory: "ring", material: "iron" })).toBeNull();
});
