import { AFFECTABLE } from "../../engine/components/affectable";
import { CASTABLE } from "../../engine/components/castable";
import { FRAGMENT } from "../../engine/components/fragment";
import { Spell } from "../../engine/components/item";
import { STATS } from "../../engine/components/stats";
import { playedSounds } from "../../testing/env";
import {
  assertHero,
  face,
  findEntityAt,
  step,
  trigger,
} from "../../testing/harness";
import {
  cast,
  createSpellWorld,
  getLastMessage,
  getUnit,
  isCasting,
  recordHits,
  waitForSpell,
} from "./helpers";

const area = `
|               |
|  ♀ D          |
|               |
`;

const playerSpells: Spell[] = ["wave", "beam", "trap", "dash"];
const channeledSpells: Spell[] = ["wave", "beam"];

describe("casting spells", () => {
  it.each(playerSpells)("casting %s costs one MP", (spell) => {
    const { world, hero } = createSpellWorld(area, { spell, material: "wood" });

    cast(world, "right");

    expect(hero[STATS].mp).toBe(4);
    expect(isCasting(world, hero)).toBe(true);
    expect(playedSounds).not.toContain("deny");
  });

  it.each(playerSpells)("refuses to cast %s without MP", (spell) => {
    const { world, hero } = createSpellWorld(
      area,
      { spell, material: "wood" },
      { mp: 0 }
    );
    const dummy = getUnit(world, area, "D");

    cast(world, "right");
    const message = getLastMessage(world, hero);
    const hits = recordHits(world, [dummy], 60);

    expect(playedSounds).toContain("deny");
    expect(message).toMatch(/^Need .MP!$/);
    expect(isCasting(world, hero)).toBe(false);
    expect(hero[STATS].mp).toBe(0);
    expect(hits).toEqual([[]]);
  });

  it.each(channeledSpells)(
    "refuses to cast %s again while it is active",
    (spell) => {
      const { world, hero } = createSpellWorld(area, {
        spell,
        material: "wood",
      });

      cast(world, "left");
      cast(world, "left");

      expect(playedSounds).toContain("deny");
      expect(getLastMessage(world, hero)).toBe("Not ready!");
      expect(hero[STATS].mp).toBe(4);
      expect(
        world
          .getEntities([CASTABLE])
          .filter(
            (castable) => castable[CASTABLE].caster === world.getEntityId(hero)
          )
      ).toHaveLength(1);
    }
  );

  it.each(channeledSpells)("can cast %s again after it ended", (spell) => {
    const { world, hero } = createSpellWorld(area, { spell, material: "wood" });

    cast(world, "left");
    waitForSpell(world, hero);
    cast(world, "left");

    expect(hero[STATS].mp).toBe(3);
    expect(isCasting(world, hero)).toBe(true);
    expect(playedSounds).not.toContain("deny");
  });

  it("ignores casting while frozen", () => {
    const { world, hero } = createSpellWorld(area, {
      spell: "wave",
      material: "wood",
    });
    world.assertComponents(hero, [AFFECTABLE])[AFFECTABLE].freeze = 10;

    face(world, "right");
    trigger(world, "spell");
    step(world, 10);

    expect(hero[STATS].mp).toBe(5);
    expect(isCasting(world, hero)).toBe(false);
    expect(playedSounds).not.toContain("deny");
  });

  it("does nothing without an equipped spell", () => {
    const { world, hero } = createSpellWorld(area, undefined);

    cast(world, "right");
    step(world, 5);

    expect(hero[STATS].mp).toBe(5);
    expect(isCasting(world, hero)).toBe(false);
    expect(playedSounds).not.toContain("deny");
  });
  it("passes damage on a limb of a large creature to its body", () => {
    const quarry = `
|           |
|     G     |
|           |
|     ♀     |
`;
    const { world } = createSpellWorld(
      quarry,
      { spell: "beam", material: "wood" },
      { legend: { G: "golem" }, size: 24 }
    );
    const golem = getUnit(world, quarry, "G");
    const leg = findEntityAt(world, { x: 5, y: 2 }, [FRAGMENT, STATS])!;

    cast(world, "up");
    waitForSpell(world, assertHero(world));

    const damage = leg[STATS].maxHp - leg[STATS].hp;
    expect(damage).toBeGreaterThan(0);
    expect(golem[STATS].hp).toBeLessThanOrEqual(golem[STATS].maxHp - damage);
  });
});
