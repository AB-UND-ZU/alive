import { render, screen } from "@testing-library/react";
import HtmlRenderer from ".";
import * as frames from "../interface/frame";
import { assertHero, createAreaWorld } from "../../testing/harness";
import { colors } from "../../game/assets/colors";
import { fogOfWar } from "../../game/assets/sprites";

const dimensions = { columns: 11, rows: 7, cellWidth: 18, cellHeight: 32 };
const setup = () => {
  const world = createAreaWorld(`
|       |
|   ♀   |
|       |
`);
  const entity = assertHero(world);
  return { world, entity };
};

beforeEach(() => {
  jest.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it("keeps the same glyph mounted while sight fades out and returns", () => {
  const { world, entity } = setup();
  const sprite = { name: "Unit", layers: [{ char: "A", color: colors.white }] };
  const entry = {
    key: "unit",
    x: 5,
    y: 3,
    z: 1,
    sprite,
    layers: sprite.layers,
    entity,
    hidden: false,
  };
  jest.spyOn(frames, "getSceneFrame").mockReturnValue([entry]);
  const { rerender } = render(
    <HtmlRenderer world={world} {...dimensions} paused />
  );
  const text = screen.getByText("A");
  // The cell owns opacity so glyphs and their backdrop fade together.
  // eslint-disable-next-line testing-library/no-node-access
  const cell = text.parentElement!;
  expect(cell).toHaveStyle({ opacity: "1" });
  entry.hidden = true;
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(screen.getByText("A")).toBe(text);
  expect(cell).toHaveStyle({ opacity: "0" });
  entry.hidden = false;
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(screen.getByText("A")).toBe(text);
  expect(cell).toHaveStyle({ opacity: "1" });
  expect(frames.getSceneFrame).toHaveBeenCalledWith(
    world,
    11,
    7,
    expect.any(Object),
    { includeHidden: true }
  );
});

it("uses dense fog and a lower-half water character for swimming", () => {
  const { world, entity } = setup();
  jest.spyOn(frames, "getSceneFrame").mockReturnValue([
    {
      key: "fog",
      x: 3,
      y: 3,
      z: 7,
      sprite: fogOfWar,
      layers: fogOfWar.layers,
      entity,
    },
    {
      key: "swimming",
      x: 5,
      y: 3,
      z: 2,
      sprite: { name: "water", layers: [] },
      layers: [],
      entity,
      swimming: true,
    },
  ]);
  render(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(screen.getByText("▓")).toBeInTheDocument();
  expect(screen.queryByText("░")).not.toBeInTheDocument();
  expect(screen.getByText("▄")).toBeInTheDocument();
});

it("fills a solid block's entire cell without enlarging neighboring glyphs", () => {
  const { world, entity } = setup();
  const sprite = {
    name: "Background",
    layers: [{ char: "█", color: colors.black }],
  };
  jest
    .spyOn(frames, "getSceneFrame")
    .mockReturnValue([
      {
        key: "background",
        x: 3,
        y: 3,
        z: 7,
        sprite,
        layers: sprite.layers,
        entity,
      },
    ]);
  render(<HtmlRenderer world={world} {...dimensions} paused />);
  // eslint-disable-next-line testing-library/no-node-access
  expect(screen.getByText("█").parentElement).toHaveStyle({
    backgroundColor: colors.black,
  });
});

it("fades loot in and retains collected items only until their fade completes", () => {
  const { world, entity } = setup();
  let time = 0;
  jest.spyOn(performance, "now").mockImplementation(() => time);
  const sprite = { name: "Apple", layers: [{ char: "a", color: colors.red }] };
  const entry = {
    key: "loot1",
    x: 5,
    y: 3,
    z: 1.5,
    sprite,
    layers: sprite.layers,
    entity,
    loot: true,
  };
  const frame = jest.spyOn(frames, "getSceneFrame").mockReturnValue([entry]);
  const { rerender } = render(
    <HtmlRenderer world={world} {...dimensions} paused />
  );
  const text = screen.getByText("a");
  // eslint-disable-next-line testing-library/no-node-access
  const cell = text.parentElement!;
  expect(cell).toHaveStyle({ opacity: "0" });
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(cell).toHaveStyle({ opacity: "1" });
  frame.mockImplementation(() => []);
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(screen.getByText("a")).toBe(text);
  expect(cell).toHaveStyle({ opacity: "0" });
  time = 199;
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(screen.getByText("a")).toBe(text);
  time = 200;
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(screen.queryByText("a")).not.toBeInTheDocument();
});
