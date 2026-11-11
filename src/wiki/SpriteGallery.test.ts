import { spriteVariations } from "./SpriteGallery";
import { rogue, woodStickAir2 } from "../game/assets/sprites";

test("the sprite catalog contains native bodies and every facing and quantity variant", () => {
  const entries = spriteVariations();
  expect(entries.length).toBeGreaterThan(500);
  expect(entries.find((entry) => entry.key === "rogue")?.sprite.layers).toEqual(
    rogue.layers
  );
  expect(
    entries.find((entry) => entry.key === "woodStickAir2.facing.up")?.sprite
      .layers
  ).toEqual(woodStickAir2.facing?.up);
});
