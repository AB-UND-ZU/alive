import { customSprite } from "../../game/assets/spriteIds";
import "../../engine";
import {
  createAreaWorld,
  assertHero,
  giveItems,
  advance,
} from "../../testing/harness";
import { createPopup, openPopup } from "../../engine/systems/popup";
import { composeCharacterPixels } from "../../components/Row/characters";
import { getTerminalFrame } from "./screen";
import { createTerminalFrame } from "./frame";
import { Sprite } from "../../engine/components/sprite";
import { Orientation } from "../../engine/components/orientable";
import * as sprites from "../../game/assets/sprites";
import * as equipments from "../../game/assets/templates/equipments";
import * as items from "../../game/assets/templates/items";
import * as creatures from "../../game/assets/templates/creatures";
import * as particles from "../../game/assets/templates/particles";
import * as units from "../../game/assets/templates/units";
import { colors } from "../../game/assets/colors";
import {
  addBackground,
  createSpriteButton,
  dotted,
  getFacingLayers,
  shaded,
  underline,
} from "../../game/assets/ui";
import {
  projectSprite,
  projectTerminalLayers,
  terminalCharacter,
} from "./sprites";

const catalog: [string, Sprite][] = [];
const collect = (value: unknown, name: string) => {
  if (!value || typeof value !== "object") return;
  if ("layers" in value && Array.isArray(value.layers)) {
    catalog.push([name, value as Sprite]);
    return;
  }
  for (const [key, item] of Object.entries(value))
    collect(item, `${name}.${key}`);
};
for (const [name, module] of Object.entries({
  sprites,
  equipments,
  items,
  creatures,
  particles,
  units,
}))
  collect(module, name);

it("preserves every declared single-character sprite through dialog decoration", () => {
  for (const [name, sprite] of catalog) {
    const facings = [
      undefined,
      ...new Set(
        Object.keys(sprite.facing || {}).concat(
          Object.keys(sprite.terminal?.facing || {})
        )
      ),
    ] as (Orientation | undefined)[];
    const amounts =
      sprite.amounts || sprite.terminal?.amounts
        ? [undefined, 1, 2, 3, 10]
        : [undefined];
    for (const facing of facings)
      for (const amount of amounts) {
        const layers =
          sprite.terminal && getFacingLayers(sprite.terminal, facing, amount);
        const glyph = layers?.[layers.length - 1];
        if (
          !layers ||
          !glyph ||
          " █▀▄▌▐".includes(glyph.char) ||
          !layers.slice(0, -1).every((layer) => layer.char === "█")
        )
          continue;
        const resolved: Sprite = customSprite({
          name: sprite.name,
          layers: getFacingLayers(sprite, facing, amount),
          terminal: { layers },
        });
        const contexts: Record<string, Sprite> = {
          plain: resolved,
          black: addBackground([resolved], colors.black)[0],
          gray: addBackground([resolved], colors.grey)[0],
          underlined: underline([resolved])[0],
          selected: shaded([resolved], colors.silver)[0],
          disabled: dotted([resolved], colors.red)[0],
          button: createSpriteButton([resolved], 3, true)[1],
        };
        for (const [context, decorated] of Object.entries(contexts)) {
          expect({
            name,
            facing,
            amount,
            context,
            char: projectSprite(decorated).char,
          }).toEqual({
            name,
            facing,
            amount,
            context,
            char: terminalCharacter(glyph.char),
          });
        }
      }
  }
});

it("keeps literal shade and control-picture glyphs on their declared backgrounds", () => {
  for (const char of ["░", "▒", "▓", "•", "♦", "▬", "☺", "♀", "°", "x"]) {
    expect(
      projectTerminalLayers([
        { char: "█", color: colors.grey },
        { char, color: colors.black },
      ])
    ).toEqual({ char, foreground: colors.black, background: colors.grey });
    expect(
      projectTerminalLayers([
        { char: "█", color: colors.black },
        { char, color: colors.yellow },
      ])
    ).toEqual({ char, foreground: colors.yellow, background: colors.black });
  }
});

it("keeps every colored resolved sprite visible on a black dialog background", () => {
  for (const [name, sprite] of catalog) {
    const facings = [
      undefined,
      ...new Set(
        Object.keys(sprite.facing || {}).concat(
          Object.keys(sprite.terminal?.facing || {})
        )
      ),
    ] as (Orientation | undefined)[];
    const amounts =
      sprite.amounts || sprite.terminal?.amounts
        ? [undefined, 1, 2, 3, 10]
        : [undefined];
    for (const facing of facings)
      for (const amount of amounts) {
        const layers = getFacingLayers(sprite, facing, amount);
        const terminal =
          sprite.terminal && getFacingLayers(sprite.terminal, facing, amount);
        if (
          terminal?.length === 0 ||
          !composeCharacterPixels(layers).some(
            (pixel) => pixel && pixel !== colors.black
          )
        )
          continue;
        const resolved: Sprite = customSprite({
          name: sprite.name,
          layers,
          ...(terminal && { terminal: { layers: terminal } }),
        });
        const cell = projectSprite(addBackground([resolved], colors.black)[0]);
        const visible =
          (cell.background && cell.background !== colors.black) ||
          (cell.char !== " " &&
            cell.foreground !== colors.black &&
            cell.foreground !== cell.background);
        expect({ name, facing, amount, visible: !!visible }).toEqual({
          name,
          facing,
          amount,
          visible: true,
        });
      }
  }
});

it.each([
  [0, 3],
  [10, 3],
  [10, 0],
])(
  "keeps Nugget and coin sprites visible in shops with %i coins and %i stock",
  (funds, stock) => {
    const world = createAreaWorld("| ♀ |", { size: 48 });
    const hero = world.assertComponents(assertHero(world), [
      "INVENTORY",
      "POSITION",
    ]);
    if (funds) giveItems(world, hero, [{ stackable: "coin", amount: funds }]);
    createPopup(world, hero, {
      tabs: ["buy"],
      deals: [
        {
          item: { stackable: "nugget", amount: 1 },
          stock,
          prices: [{ stackable: "coin", amount: 2 }],
        },
      ],
    });
    openPopup(world, hero, hero);
    advance(world, 2000);
    const frame = getTerminalFrame(world, 80, 40);
    expect(frame.flat()).toContainEqual({
      char: "•",
      foreground: colors.yellow,
      background: colors.black,
    });
    expect(frame.flat()).toContainEqual({
      char: "°",
      foreground: colors.yellow,
      background: colors.black,
    });
  }
);

it("keeps Nugget and coin sprites visible when selling", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = world.assertComponents(assertHero(world), [
    "INVENTORY",
    "POSITION",
  ]);
  giveItems(world, hero, [{ stackable: "nugget", amount: 1 }]);
  createPopup(world, hero, { tabs: ["sell"] });
  openPopup(world, hero, hero);
  advance(world, 2000);
  const cells = getTerminalFrame(world, 80, 40).flat();
  expect(cells).toContainEqual({
    char: "•",
    foreground: colors.yellow,
    background: colors.black,
  });
  expect(cells).toContainEqual({
    char: "°",
    foreground: colors.yellow,
    background: colors.black,
  });
});

it("keeps the Melee stat icon on black rather than an extra gray background", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = world.assertComponents(assertHero(world), [
    "INVENTORY",
    "POSITION",
  ]);
  createPopup(world, hero, { tabs: ["stats"] });
  hero.POPUP!.verticalIndezes[0] = 12;
  openPopup(world, hero, hero);
  advance(world, 2000);
  expect(getTerminalFrame(world, 80, 40).flat()).toContainEqual({
    char: "x",
    foreground: colors.red,
    background: colors.black,
  });
});

it("keeps explicitly hidden sprites transparent through dialog decoration", () => {
  const hidden: Sprite = customSprite({
    name: "hidden",
    layers: [{ char: ".", color: colors.red }],
    terminal: { layers: [] },
  });
  const ground = customSprite({
    name: "water",
    layers: [
      { char: "█", color: colors.navy },
      { char: "~", color: colors.blue },
    ],
  });
  for (const sprite of [
    hidden,
    addBackground([hidden], colors.grey)[0],
    shaded([hidden], colors.silver)[0],
    dotted([hidden], colors.red)[0],
  ]) {
    const frame = createTerminalFrame(
      [
        {
          x: 0,
          y: 0,
          z: 0,
          sprite: ground,
          layers: ground.layers,
          terminalLayers: ground.layers,
        },
        {
          x: 0,
          y: 0,
          z: 1,
          sprite,
          layers: sprite.layers,
          terminalLayers: sprite.terminal!.layers,
        },
      ],
      1,
      1
    );
    expect(frame[0][0]).toEqual({
      char: "~",
      foreground: colors.blue,
      background: colors.navy,
    });
  }
});
