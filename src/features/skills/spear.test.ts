import { Element } from "../../engine/components/item";
import { orientations, ORIENTABLE } from "../../engine/components/orientable";
import { SPRITE } from "../../engine/components/sprite";
import { getItemSprite } from "../../game/assets/utils";
import { getFacingLayers } from "../../game/assets/ui";
import { composeCharacterPixels } from "../../components/Row/characters";
import { colors } from "../../game/assets/colors";
import { STATS } from "../../engine/components/stats";
import { playedSounds } from "../../testing/env";
import {
  act,
  advance,
  advanceUntil,
  face,
  getItems,
  holdMove,
} from "../../testing/harness";
import { getUnit, setupHero } from "./helpers";

const area = `
|  Z♀ABCD      |
`;
const legend = { A: "dummy", B: "dummy", C: "dummy", D: "dummy", Z: "dummy" };

const setup = (
  material: "wood" | "iron" | "gold" | "diamond" | "ruby",
  element?: Element
) => {
  const { world, hero } = setupHero(
    area,
    [{ weapon: "spear", skill: "spear", material, element, amount: 1 }],
    { legend }
  );
  const units = ["A", "B", "C", "D", "Z"].map((char) =>
    getUnit(world, area, char)
  );
  return { world, hero, units };
};

const getDamage = (units: ReturnType<typeof setup>["units"]) =>
  units.map((unit) => unit[STATS].maxHp - unit[STATS].hp);

describe("spear", () => {
  it("is held as weapon and skill at once", () => {
    const { hero } = setup("wood");

    expect(hero.EQUIPPABLE.weapon).toBeDefined();
    expect(hero.EQUIPPABLE.skill).toBe(hero.EQUIPPABLE.weapon);
  });

  it.each([
    ["wood", 1],
    ["iron", 2],
    ["gold", 3],
    ["diamond", 4],
    ["ruby", 5],
  ] as const)(
    "stabs the three cells in front with a %s spear",
    (material, damage) => {
      const { world, units } = setup(material);
      face(world, "right");

      act(world, "skill");
      advance(world, 1000);

      expect(playedSounds).toContain("spear");
      expect(getDamage(units)).toEqual([damage, damage, damage, 0, 0]);
    }
  );

  it.each(orientations)(
    "places silver air on the first extended segment during a %s gold spear attack",
    (orientation) => {
      const { world, hero } = setup("gold", "air");
      face(world, orientation);
      act(world, "skill");
      const trail = () =>
        world
          .getEntities([SPRITE])
          .find((entity) => entity[SPRITE].name === "spear_line_element");
      advanceUntil(world, () => !!trail(), 1000);
      const weapon = world.assertByIdAndComponents(hero.EQUIPPABLE.weapon!, [
        SPRITE,
        ORIENTABLE,
      ]);
      expect(weapon[ORIENTABLE].facing).toBe(orientation);
      expect(
        composeCharacterPixels(
          getFacingLayers(weapon[SPRITE], weapon[ORIENTABLE].facing)
        )
      ).toEqual(
        composeCharacterPixels(
          getItemSprite(
            { weapon: "spear", material: "gold" },
            undefined,
            orientation
          ).layers
        )
      );
      expect(
        composeCharacterPixels(getFacingLayers(trail()![SPRITE], orientation))
      ).toContain(colors.silver);
      const shaft = world
        .getEntities([SPRITE])
        .find((entity) => entity[SPRITE].name === "spear_line")!;
      const tip = world
        .getEntities([SPRITE])
        .find((entity) => entity[SPRITE].name === "spear_tip")!;
      expect(
        composeCharacterPixels(getFacingLayers(shaft[SPRITE], orientation))
      ).not.toContain(colors.silver);
      expect(
        composeCharacterPixels(getFacingLayers(tip[SPRITE], orientation))
      ).not.toContain(colors.silver);
      advance(world, 1000);
      expect(trail()).toBeUndefined();
      expect(weapon[ORIENTABLE].facing).toBeUndefined();
      expect(
        composeCharacterPixels(
          getFacingLayers(weapon[SPRITE], weapon[ORIENTABLE].facing)
        )
      ).toContain(colors.silver);
    }
  );

  it("stabs only in the facing direction", () => {
    const { world, units } = setup("iron");
    face(world, "left");

    act(world, "skill");
    advance(world, 1000);

    expect(getDamage(units)).toEqual([0, 0, 0, 0, 2]);
  });

  it("needs no ammunition to be used again", () => {
    const { world, hero, units } = setup("iron");
    const items = getItems(world, hero).length;
    face(world, "right");

    act(world, "skill");
    advance(world, 1000);
    act(world, "skill");
    advance(world, 1000);

    expect(playedSounds).not.toContain("deny");
    expect(getItems(world, hero)).toHaveLength(items);
    expect(getDamage(units)).toEqual([4, 4, 4, 0, 0]);
  });

  it("stabs the whole line when bumping into a target", () => {
    const { world, units } = setup("iron");

    holdMove(world, ["right"]);
    advanceUntil(world, () => units[0][STATS].hp < units[0][STATS].maxHp);
    holdMove(world, []);
    advance(world, 500);

    expect(playedSounds).toContain("spear");
    expect(getDamage(units)).toEqual([2, 2, 2, 0, 0]);
  });
});
