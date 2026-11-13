import {
  createAreaWorld,
  assertHero,
  giveItems,
  act,
  advance,
} from "../../testing/harness";
import { materials, elements, weapons } from "../../engine/components/item";
import { orientations } from "../../engine/components/orientable";
import { getItemSprite } from "../../game/assets/utils";
import { colorPalettes } from "../../game/assets/templates";
import { colors } from "../../game/assets/colors";
import { composeCharacterPixels } from "../../components/Row/characters";
import { getSegments } from "../../components/Entity/utils";
import { getSequence } from "../../engine/systems/sequence";
import { SPRITE } from "../../engine/components/sprite";
import { getFacingLayers } from "../../game/assets/ui";

it.each(materials)(
  "keeps element markings on %s weapon icons and plain shafts during spear attacks",
  (material) => {
    for (const weapon of weapons) {
      for (const element of elements) {
        const expected =
          material === "gold" && element === "air"
            ? colors.silver
            : colorPalettes[element].primary;
        const facings =
          weapon === "spear" ? [undefined] : [undefined, ...orientations];
        for (const facing of facings) {
          const sprite = getItemSprite(
            { weapon, material, element },
            undefined,
            facing
          );
          expect(composeCharacterPixels(sprite.layers)).toContain(expected);
        }
      }
    }
    for (const element of elements) {
      for (const facing of orientations) {
        const sprite = getItemSprite(
          { weapon: "spear", material, element },
          undefined,
          facing
        );
        const shaft = getItemSprite(
          { weapon: "spear", material },
          undefined,
          facing
        );
        expect(composeCharacterPixels(sprite.layers)).toEqual(
          composeCharacterPixels(shaft.layers)
        );
      }
    }
  }
);

it.each(["spear", "wand"] as const)(
  "keeps gold air %s markings bright in inventory and on the hero",
  (weapon) => {
    const item = {
      weapon,
      skill: weapon,
      material: "gold",
      element: "air",
      amount: 1,
    } as const;
    const world = createAreaWorld("| ♀ |");
    const hero = world.assertComponents(assertHero(world), [
      "INVENTORY",
      "POSITION",
      "PLAYER",
    ]);
    giveItems(world, hero, [item]);
    for (const variant of [undefined, "display", "resource"] as const) {
      expect(
        composeCharacterPixels(getItemSprite(item, variant).layers)
      ).toContain(colors.silver);
    }
    const equipped = getSegments(world, hero, {
      isTransparent: false,
      receiveShadow: false,
    });
    const segment = equipped.find(
      (part) => part.sprite.name === (weapon === "spear" ? "Spear" : "Wand")
    );
    expect(segment).toBeDefined();
    expect(
      composeCharacterPixels(getFacingLayers(segment!.sprite, segment!.facing))
    ).toContain(colors.silver);
  }
);

it.each([
  { weapon: "sword" },
  { weapon: "spear", skill: "spear" },
  { weapon: "wand", skill: "wand" },
  { offhand: "shield" },
] as const)("uses silver air in the equipment portrait for %j", (gear) => {
  const world = createAreaWorld("| ♀ |");
  const hero = world.assertComponents(assertHero(world), [
    "INVENTORY",
    "POSITION",
    "PLAYER",
  ]);
  giveItems(world, hero, [
    { ...gear, material: "gold", element: "air", amount: 1 },
  ]);
  act(world, "gear");
  advance(world, 1000);
  const menu = world.assertById(hero.PLAYER.popup!);
  const particles = getSequence(world, menu, "popup")!.particles;
  const marker = world.assertByIdAndComponents(
    particles[`popup-content-3-${"offhand" in gear ? 10 : 13}`],
    [SPRITE]
  );
  expect(composeCharacterPixels(marker[SPRITE].layers)[12 * 9 + 4]).toBe(
    colors.silver
  );
});
