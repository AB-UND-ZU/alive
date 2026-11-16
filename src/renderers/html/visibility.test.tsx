import { render, screen } from "@testing-library/react";
import HtmlRenderer from ".";
import * as frames from "../interface/frame";
import {
  assertHero,
  createAreaWorld,
  giveItems,
  step,
  advanceUntil,
} from "../../testing/harness";
import { dropEntity } from "../../engine/systems/drop";
import { getSequence } from "../../engine/systems/sequence";
import { POSITION } from "../../engine/components/position";
import { INVENTORY } from "../../engine/components/inventory";
import { SPRITE } from "../../engine/components/sprite";
import { colors } from "../../game/assets/colors";
import { fogOfWar, sand, waterDeep } from "../../game/assets/sprites";
import { FOG } from "../../engine/components/fog";

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

it("leaves fog shading on body opacity and uses a lower-half water character for swimming", () => {
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
  expect(screen.queryByText("▓")).not.toBeInTheDocument();
  expect(screen.queryByText("░")).not.toBeInTheDocument();
  expect(screen.getByText("▄")).toBeInTheDocument();
});

it("fills a solid block's entire cell without enlarging neighboring glyphs", () => {
  const { world, entity } = setup();
  const sprite = {
    name: "Background",
    layers: [{ char: "█", color: colors.black }],
  };
  jest.spyOn(frames, "getSceneFrame").mockReturnValue([
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

it("keeps a dropped item visible when its flight reaches the ground", () => {
  const world = createAreaWorld("|         |\n|   ♀     |\n|         |", {
    size: 32,
  });
  const hero = world.assertComponents(assertHero(world), [INVENTORY, POSITION]);
  giveItems(world, hero, [{ stackable: "apple", amount: 1, bound: false }]);
  const [drop] = dropEntity(world, hero, hero[POSITION], false, 5, "right");
  step(world);
  const sequence = getSequence(world, drop, "collect")!;
  const particle = world.assertById(sequence.particles.loot);
  const glyph = { name: "Apple", layers: [{ char: "a", color: colors.red }] };
  particle[SPRITE] = glyph;
  world.assertById(sequence.args.itemId)[SPRITE] = glyph;
  const { rerender } = render(
    <HtmlRenderer world={world} {...dimensions} paused />
  );
  const text = screen.getByText("a");
  // eslint-disable-next-line testing-library/no-node-access
  const cell = text.parentElement!;
  expect(cell).toHaveStyle({ opacity: "1" });
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(cell).toHaveStyle({ opacity: "1" });
  advanceUntil(world, () => !getSequence(world, drop, "collect"), 1000);
  expect(drop.INVENTORY.items).toContain(sequence.args.itemId);
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(cell).toBeInTheDocument();
  expect(cell).toHaveStyle({ opacity: "1" });
});

it("dims fogged sand and water without fading particles or making terrain translucent", () => {
  const world = createAreaWorld("|         |\n|  ♀ ░≈   |\n|         |", {
    size: 32,
  });
  const targets = [sand, waterDeep].map(
    (sprite) =>
      world
        .getEntities([SPRITE, FOG])
        .find((entity) => entity[SPRITE].name === sprite.name)!
  );
  expect(targets.every(Boolean)).toBe(true);
  targets.forEach((entity) => (entity[FOG].visibility = "visible"));
  const getFrame = frames.getSceneFrame;
  const particle = {
    key: "particle",
    x: 0,
    y: 0,
    z: 9.2,
    entity: targets[0],
    sprite: { name: "spark", layers: [{ char: "*", color: colors.red }] },
    layers: [{ char: "*", color: colors.red }],
  };
  jest
    .spyOn(frames, "getSceneFrame")
    .mockImplementation((...args) => [
      ...getFrame(...args).filter(
        (entry) =>
          targets.some((entity) => entity === entry.entity) &&
          entry.sprite === entry.entity[SPRITE]
      ),
      particle,
    ]);
  const { rerender } = render(
    <HtmlRenderer world={world} {...dimensions} paused />
  );
  const surface = screen.getByLabelText("Game world");
  // eslint-disable-next-line testing-library/no-node-access
  const sprites = surface.querySelectorAll<HTMLSpanElement>(
    ".HtmlRendererSprite"
  );
  const cells = Array.from(sprites);
  expect(cells).toHaveLength(3);
  expect(cells.every((cell) => cell.style.opacity === "1")).toBe(true);
  targets.forEach((entity) => (entity[FOG].visibility = "fog"));
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(
    cells.filter((cell) => cell.style.filter === "brightness(0.25)")
  ).toHaveLength(2);
  expect(cells.every((cell) => cell.style.opacity === "1")).toBe(true);
  // eslint-disable-next-line testing-library/no-node-access
  expect(screen.getByText("*").parentElement).toHaveStyle({
    opacity: "1",
    filter: "",
  });
  expect(screen.getByText("*")).toHaveStyle({ color: colors.red });
  targets.forEach((entity) => (entity[FOG].visibility = "visible"));
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(cells.every((cell) => cell.style.filter === "")).toBe(true);
  expect(cells.every((cell) => cell.style.opacity === "1")).toBe(true);
});
