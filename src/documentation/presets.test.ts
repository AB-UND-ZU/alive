import { createPresetWorld } from "./presets";
import { assertHero, advance } from "../testing/harness";
import { up4Center } from "../game/levels/tutorial/areas";
import { normalize } from "../game/math/std";
import { LEVEL } from "../engine/components/level";
test("Dungeon preset equips a playable hero in the real tutorial", () => {
  const world = createPresetWorld("dungeon"),
    hero = assertHero(world);
  expect(world.metadata.gameEntity[LEVEL].name).toBe("LEVEL_TUTORIAL");
  expect(hero.EQUIPPABLE?.weapon).toBeDefined();
  expect(hero.STATS?.hp).toBeGreaterThan(0);
});
test("Bandit preset starts inside the boss room with combat gear", () => {
  const world = createPresetWorld("bandit"),
    hero = assertHero(world);
  advance(world, 500);
  expect(hero.EQUIPPABLE?.offhand).toBeDefined();
  expect(hero.POSITION.y).toBe(
    normalize(up4Center.y + 4, world.metadata.gameEntity[LEVEL].size)
  );
});
