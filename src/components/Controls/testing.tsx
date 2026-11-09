/* eslint-disable testing-library/no-node-access -- controls are drawn as glyph spans without accessible roles */
import { act, render } from "@testing-library/react";
import { WorldContext, WorldProvider } from "../../bindings/hooks";
import { World } from "../../engine";
import { step } from "../../testing/harness";
import { createWorldContext } from "../../testing/render";
import { Layer } from "../../engine/components/sprite";
import { characterMarkup } from "../Row/characters";
import {
  buttonPalettes,
  createText,
  getButtonDisabled,
  getButtonLeft,
  getButtonRight,
  Palette,
} from "../../game/assets/ui";

const markup = (cell: Element) => {
  if (!cell.matches(".SpriteCell")) return;
  const row = cell.parentElement;
  const own = cell.querySelector("img");
  const image = own || row?.querySelector(":scope > .RowPixels");
  const source = image?.getAttribute("src");
  if (!source?.startsWith("data:image/svg+xml,")) return;
  const offset = own
    ? 0
    : Array.from(row?.children || [])
        .slice(0, Array.from(row?.children || []).indexOf(cell))
        .reduce(
          (sum, child) =>
            sum +
            (child.matches(".Cell")
              ? Number(child.getAttribute("data-cells") || 1)
              : 0),
          0
        );
  const document = new DOMParser().parseFromString(
    decodeURIComponent(source.split(",")[1]),
    "image/svg+xml"
  );
  return document
    .querySelector(`[data-cell="${offset}"]`)
    ?.innerHTML.replaceAll(' xmlns="http://www.w3.org/2000/svg"', "")
    .replaceAll("></rect>", "/>");
};

// Disabled letters are composed pixels, with no selectable fallback text.
const disabledLetters = new Map(
  (Object.keys(buttonPalettes) as Palette[]).flatMap((palette) =>
    [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map(
      (letter) =>
        [
          characterMarkup(
            [
              ...getButtonDisabled(palette).layers,
              ...createText(letter, buttonPalettes[palette].text)[0].layers,
            ]
          ),
          letter,
        ] as const
    )
  )
);

/** Visible text and glyphs, including characters held in a batched font run. */
export const readCell = (cell: Element) =>
  cell.textContent ||
  cell.getAttribute("data-glyph") ||
  disabledLetters.get(markup(cell) || "") ||
  " ".repeat(Number(cell.getAttribute("data-cells")) || 1);

export const readCells = (row: Element) =>
  Array.from(row.querySelectorAll(".Cell")).flatMap((element) =>
    [...readCell(element)].map((char, index) => ({ element, char, index }))
  );

/** Text of a row at its logical cell positions, independent of batching. */
export const readRow = (row: Element) =>
  readCells(row)
    .map(({ char }) => char)
    .join("");

/** Whether a cell's pixels are exactly the given layers. */
export const showsLayers = (cell: Element, layers: Layer[], index = 0) => {
  const svg = markup(cell);
  if (svg !== undefined) return svg === characterMarkup(layers);

  const style = (cell as HTMLElement).style;
  const background = (
    style.getPropertyValue("--cell-background") || style.backgroundColor
  ).replace(
    /rgb\((\d+), (\d+), (\d+)\)/,
    (_, r, g, b) =>
      `#${[r, g, b]
        .map((value) => Number(value).toString(16).padStart(2, "0"))
        .join("")}`
  );
  const drawn: Layer[] = background ? [{ char: "█", color: background }] : [];
  for (const name of ["underlay", "mask"]) {
    const char = cell.getAttribute(`data-${name}`)?.[index];
    if (char)
      drawn.push({ char, color: style.getPropertyValue(`--${name}-color`) });
  }
  const glyph = cell.getAttribute("data-glyph") || cell.textContent;
  if (glyph?.[index])
    drawn.push({
      char: glyph[index],
      color: style.getPropertyValue("--glyph-color"),
    });
  return characterMarkup(drawn) === characterMarkup(layers);
};

export const isDisabledCell = (cell: Element, palette: Palette, index = 0) => {
  const shading = getButtonDisabled(palette).layers;
  const text = createText(
    readCell(cell)[index] || " ",
    buttonPalettes[palette].text
  )[0];
  return [
    shading,
    [...shading, ...text.layers],
    ...[false, true].flatMap((highlight) => [
      getButtonLeft(palette, true, highlight, false).layers,
      getButtonRight(palette, true, highlight, false).layers,
    ]),
  ].some((layers) => showsLayers(cell, layers, index));
};

export const readRows = (container: HTMLElement, selector = ".Row") =>
  Array.from(container.querySelectorAll(selector)).map(readRow);

/**
 * Render a HUD component for a test world. Systems are ticked manually as
 * there is no canvas frame loop, which also notifies the rendered hooks.
 */
export const renderHud = (
  world: World,
  element: React.ReactElement,
  overrides: Partial<WorldContext> = {}
) => {
  const context = createWorldContext(world, overrides);
  const wrap = (next: Partial<WorldContext>) => (
    <WorldProvider value={{ ...context, ...next }}>{element}</WorldProvider>
  );
  const view = render(wrap({}));
  const tick = (frames = 1) =>
    act(() => {
      step(world, frames);
    });
  const update = (next: Partial<WorldContext>) => view.rerender(wrap(next));

  tick();

  return { ...view, tick, update };
};
