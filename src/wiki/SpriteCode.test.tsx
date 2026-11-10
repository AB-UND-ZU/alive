import { render, screen } from "@testing-library/react";
import { SpriteCode } from "./SpriteCode";
import { colors } from "../game/assets/colors";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

test("sprite code preserves character escapes and updates to the selected sprite", () => {
  const first = {
    name: 'Sprite "one"',
    layers: [{ char: "\\", color: colors.maroon }],
  };
  const { rerender } = render(<SpriteCode sprite={first} />);
  const text = `export const sprite: Sprite = {\n  name: ${JSON.stringify(
    first.name
  )},\n  layers: [\n    { char: ${JSON.stringify(
    "\\"
  )}, color: colors.maroon },\n  ],\n};`;
  expect(screen.getByLabelText(/^export const sprite:/).textContent).toBe(text);
  expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  rerender(
    <SpriteCode
      sprite={{
        name: "Sprite #2",
        layers: [{ char: "A", color: colors.green }],
      }}
    />
  );
  expect(
    screen.getByLabelText(/^export const sprite:/).textContent
  ).not.toContain(JSON.stringify(first.name));
  expect(screen.getByLabelText(/name: "Sprite #2"/).textContent).toContain(
    '{ char: "A", color: colors.green }'
  );
});

test("keeps an empty code fence when no sprite is selected", () => {
  const { rerender } = render(
    <SpriteCode sprite={{ name: "Sprite #1", layers: [] }} />
  );
  expect(screen.getByLabelText(/^export const sprite:/)).toBeInTheDocument();
  rerender(<SpriteCode />);
  expect(screen.getByTitle("sprite.ts")).toBeInTheDocument();
  expect(screen.getByLabelText("", { selector: "pre" }).textContent).toBe("");
  expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
});
