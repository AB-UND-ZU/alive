import {
  advance,
  advanceUntil,
  assertHero,
  createAreaWorld,
  giveItems,
} from "../../testing/harness";
import { colors } from "../../game/assets/colors";
import {
  sign,
  fence,
  box,
  bush,
  chairLeft,
  chairRight,
  emptyFlask,
  emptyBottle,
  emptyPotion,
  emptyElixir,
  leavesRottenLeft,
  leavesRottenRight,
  plank,
  arrow,
  doubleArrow,
} from "../../game/assets/sprites";
import { flask, bottle, potion } from "../../game/assets/templates/items";
import { addBackground, mergeSprites, slotShadow } from "../../game/assets/ui";
import { getItemSprite } from "../../game/assets/utils";
import { projectSprite } from "./sprites";
import { getSequence } from "../../engine/systems/sequence";
import { getSceneFrame } from "../interface/frame";
import { collectTerminalSprites, createTerminalFrame } from "./frame";

it("keeps established sign, fence, box and bush glyphs across amounts and dialog backgrounds", () => {
  for (const [sprite, char, color] of [
    [sign, "■", colors.silver],
    [fence, "±", colors.maroon],
    [box, "■", colors.maroon],
    [bush, "τ", colors.olive],
  ] as const)
    for (const amount of [undefined, 1, 2, 3])
      for (const candidate of [
        sprite,
        addBackground([sprite], colors.black)[0],
      ])
        expect(projectSprite(candidate, undefined, amount)).toMatchObject({
          char,
          foreground: color,
        });
});

it("keeps world shadow composition from changing established unit glyphs", () => {
  for (const [sprite, char, foreground] of [
    [sign, "■", colors.silver],
    [fence, "±", colors.maroon],
    [box, "■", colors.maroon],
    [bush, "τ", colors.olive],
  ] as const) {
    expect(projectSprite(mergeSprites(slotShadow, sprite))).toMatchObject({
      char,
      foreground,
    });
  }
});

it("uses the requested chair, tree-side, plank and arrow symbols", () => {
  for (const sprite of [chairLeft, chairRight])
    expect(projectSprite(sprite)).toMatchObject({
      char: "_",
      foreground: colors.maroon,
    });
  expect(projectSprite(leavesRottenLeft)).toMatchObject({
    char: "▐",
    foreground: colors.green,
  });
  expect(projectSprite(leavesRottenRight)).toMatchObject({
    char: "▌",
    foreground: colors.green,
  });
  expect(projectSprite(plank)).toMatchObject({
    char: "■",
    foreground: colors.maroon,
  });
  for (const sprite of [arrow, doubleArrow])
    expect(projectSprite(sprite)).toMatchObject({
      char: "»",
      foreground: colors.maroon,
    });
});

it("uses gray for all empty vessels while retaining filled potion colors", () => {
  for (const sprite of [emptyFlask, emptyBottle, emptyPotion, emptyElixir])
    expect(projectSprite(sprite).foreground).toBe(colors.grey);
  for (const template of [flask, bottle, potion]) {
    for (const variants of Object.values(template))
      expect(projectSprite(variants.default).foreground).toBe(colors.grey);
    expect(projectSprite(template.wood.fire).foreground).toBe(colors.red);
    expect(projectSprite(template.iron.water).foreground).toBe(colors.blue);
  }
});

it("uses the same gray empty flask in the potion sign and consume animation", () => {
  const world = createAreaWorld("| ♀P |", {
    size: 48,
    legend: { P: "potion_sign" },
  });
  const hero = world.assertComponents(assertHero(world), [
    "INVENTORY",
    "POSITION",
    "STATS",
  ]);
  const sign = world.getEntities(["POPUP"]).find((entity) =>
    entity.POPUP.lines
      .flat(2)
      .map((sprite) => sprite.id)
      .includes(emptyFlask.id)
  )!;
  expect(sign).toBeDefined();
  expect(projectSprite(emptyFlask)).toMatchObject({
    char: "σ",
    foreground: colors.grey,
  });
  hero.STATS.hp = 3;
  hero.STATS.maxHp = 10;
  giveItems(world, hero, [
    { consume: "potion", material: "wood", stat: "hp", amount: 1 },
  ]);
  advanceUntil(world, () => !!getSequence(world, hero, "consume"));
  advanceUntil(world, () => {
    const sequence = getSequence(world, hero, "consume");
    const particle =
      sequence?.particles.consumable &&
      world.getEntityById(sequence.particles.consumable);
    return !!particle && particle.SPRITE?.id === emptyFlask.id;
  });
  const sequence = getSequence(world, hero, "consume")!;
  const particle = world.assertByIdAndComponents(
    sequence.particles.consumable,
    ["SPRITE"]
  );
  expect(particle.SPRITE.id).toBe(emptyFlask.id);
});

it("shows a tree apple on brown while leaving dropped apples without that background", () => {
  expect(
    projectSprite(getItemSprite({ stackable: "apple", amount: 1 }, "resource"))
  ).toEqual({ char: "•", foreground: colors.red, background: colors.maroon });
  expect(
    projectSprite(getItemSprite({ stackable: "apple", amount: 1 })).background
  ).not.toBe(colors.maroon);
  const world = createAreaWorld("| ♀A |", { size: 48, legend: { A: "apple" } });
  advance(world, 2000);
  const scene = getSceneFrame(world, 15, 11, undefined, { instant: true });
  const apple = scene.find(
    (entry) => entry.loot && entry.sprite.name === "Apple"
  )!;
  expect(apple).toBeDefined();
  expect(
    createTerminalFrame(collectTerminalSprites(scene), 15, 11)[
      Math.ceil(apple.y)
    ][Math.ceil(apple.x)]
  ).toMatchObject({
    char: "•",
    foreground: colors.red,
    background: colors.maroon,
  });
});
