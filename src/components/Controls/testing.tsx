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

/** The foreground character at a cell's logical position. */
export const readCell = (cell: Element) =>
  Array.from(cell.querySelectorAll(".Layer")).pop()?.textContent || " ";

export const readCells = (row: Element) =>
  Array.from(row.querySelectorAll(".Cell")).map((element) => ({
    element,
    char: readCell(element),
    index: 0,
  }));

export const readRow = (row: Element) =>
  readCells(row)
    .map(({ char }) => char)
    .join("");

export const showsLayers = (cell: Element, layers: Layer[], _index = 0) => {
  const drawn = Array.from(cell.querySelectorAll<HTMLElement>(".Layer")).map(
    (layer) => ({
      char: layer.textContent || " ",
      color: layer.style.color.replace(
        /rgb\((\d+), (\d+), (\d+)\)/,
        (_, r, g, b) =>
          `#${[r, g, b]
            .map((value) => Number(value).toString(16).padStart(2, "0"))
            .join("")}`
      ),
    })
  );
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
