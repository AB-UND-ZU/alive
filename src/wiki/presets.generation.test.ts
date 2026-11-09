import { createPresetWorld, presets, PresetName } from "./presets";
import { assertHero } from "../testing/harness";
import { LEVEL } from "../engine/components/level";
for (const name of [
  "island",
  "earth",
  "ilex",
  "oak",
  "haven",
  "nomad",
] as PresetName[]) {
  test(`${presets[name].title} preset has a playable starting position`, () => {
    const world = createPresetWorld(name),
      hero = assertHero(world);
    expect(world.metadata.gameEntity[LEVEL].name).toBe("LEVEL_ISLAND");
    expect(hero.EQUIPPABLE?.weapon).toBeDefined();
    expect(hero.STATS?.hp).toBeGreaterThan(0);
    expect(hero.POSITION.x).toBeGreaterThanOrEqual(0);
    expect(hero.POSITION.y).toBeGreaterThanOrEqual(0);
  }, 120000);
}
