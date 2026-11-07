/* eslint-disable testing-library/no-node-access -- controls are drawn as glyph spans without accessible roles */
import { act, render } from "@testing-library/react";
import { WorldContext, WorldProvider } from "../../bindings/hooks";
import { World } from "../../engine";
import { step } from "../../testing/harness";
import { createWorldContext } from "../../testing/render";

/** Text of a row of sprites, taking the topmost layer of each cell. */
export const readRow = (row: Element) =>
  Array.from(row.querySelectorAll(".Cell"))
    .map((cell) => cell.querySelector(".Layer:last-child")?.textContent || " ")
    .join("");

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
