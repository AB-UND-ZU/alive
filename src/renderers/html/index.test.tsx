import { act, render, screen } from "@testing-library/react";
import HtmlRenderer from ".";
import * as sceneFrame from "../interface/frame";
import * as motion from "../../engine/motion";
import { systemsFrame } from "../interface/clock";
import { createAreaWorld, assertHero } from "../../testing/harness";
import { colors } from "../../game/assets/colors";
import { PLAYER } from "../../engine/components/player";
import { VIEWABLE } from "../../engine/components/viewable";
import { POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import { STATS } from "../../engine/components/stats";
import { WorldProvider } from "../interface/hooks";
import { createWorldContext } from "../../testing/context";
import { Sprite } from "../../engine/components/sprite";

const createWorld = () =>
  createAreaWorld(
    `
|████████|
|█ ♀    █|
|████████|
`,
    { size: 32 }
  );

let time = 0;
let nextFrame = 0;
let frames: Map<number, FrameRequestCallback>;
const devicePixelRatio = Object.getOwnPropertyDescriptor(
  window,
  "devicePixelRatio"
)!;

beforeEach(() => {
  time = 0;
  nextFrame = 0;
  frames = new Map();
  jest.spyOn(performance, "now").mockImplementation(() => time);
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    nextFrame += 1;
    frames.set(nextFrame, callback);
    return nextFrame;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    frames.delete(id);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(window, "devicePixelRatio", devicePixelRatio);
});

const advanceFrame = (deltaMs: number) => {
  time += deltaMs;
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => callbacks.forEach((callback) => callback(time)));
};

const dimensions = { columns: 11, rows: 7, cellWidth: 18, cellHeight: 32 };

it("advances the supplied world, pauses without catchup, and releases its animation loop", () => {
  const world = createWorld();
  const otherWorld = createWorld();
  const update = jest.spyOn(world, "update");
  const { rerender, unmount } = render(
    <HtmlRenderer world={world} {...dimensions} paused={false} />
  );

  advanceFrame(systemsFrame);
  expect(update).toHaveBeenCalled();
  const runningElapsed = world.metadata.elapsed;

  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  advanceFrame(60_000);
  expect(world.metadata.elapsed).toBe(runningElapsed);

  rerender(<HtmlRenderer world={world} {...dimensions} paused={false} />);
  advanceFrame(systemsFrame + 1);
  expect(world.metadata.elapsed - runningElapsed).toBeCloseTo(systemsFrame);

  const previousElapsed = world.metadata.elapsed;
  const otherElapsed = otherWorld.metadata.elapsed;
  rerender(<HtmlRenderer world={otherWorld} {...dimensions} paused={false} />);
  advanceFrame(systemsFrame);
  expect(otherWorld.metadata.elapsed).toBeGreaterThan(otherElapsed);
  expect(world.metadata.elapsed).toBe(previousElapsed);

  unmount();
  expect(frames.size).toBe(0);
});

it("keeps a single glyph as selectable text and resolves stacked layers into one SVG", () => {
  const world = createWorld();
  const entity = assertHero(world);
  const letter: Sprite = {
    name: "Letter",
    layers: [{ char: "A", color: colors.lime }],
  };
  const stacked: Sprite = {
    name: "Stacked letter",
    layers: [
      { char: "█", color: colors.black },
      { char: "B", color: colors.white },
    ],
  };
  jest.spyOn(sceneFrame, "getSceneFrame").mockReturnValue([
    {
      key: "letter",
      x: 4,
      y: 3,
      z: 0,
      layers: letter.layers,
      sprite: letter,
      entity,
    },
    {
      key: "stacked",
      x: 5,
      y: 3,
      z: 0,
      layers: stacked.layers,
      sprite: stacked,
      entity,
    },
  ]);
  const { container } = render(
    <HtmlRenderer world={world} {...dimensions} paused />
  );

  expect(screen.getByText("A")).toHaveStyle({ color: colors.lime });
  expect(container.textContent).toBe("A");
  // Decorative SVG layers deliberately have no accessible text or role.
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  const resolved = container.querySelectorAll("svg");
  expect(resolved).toHaveLength(1);
  expect(resolved[0]).toHaveAttribute("viewBox", "0 0 9 16");
  expect(resolved[0].innerHTML).not.toBe("");
  expect(sceneFrame.getSceneFrame).toHaveBeenCalledWith(
    world,
    11,
    7,
    expect.any(Object),
    { includeHidden: true }
  );
});

it("keeps neighboring cells rigid while snapping the camera to device pixels", () => {
  const world = createWorld();
  const entity = assertHero(world);
  const sprite: Sprite = {
    name: "Letter",
    layers: [{ char: "A", color: colors.white }],
  };
  const camera = motion.createMotion(0, 0, world.metadata.renderTime, {
    duration: 100,
  });
  camera.x = 1.4;
  camera.y = 0.7;
  Object.defineProperty(window, "devicePixelRatio", {
    configurable: true,
    value: 1.25,
  });
  jest.spyOn(motion, "getCameraMotion").mockReturnValue(camera);
  jest.spyOn(sceneFrame, "getSceneFrame").mockImplementation(() => {
    const position = motion.sampleMotion(camera, world.metadata.renderTime);
    return [4, 5].map((x) => ({
      key: String(x),
      x: x - position.x,
      y: 3 - position.y,
      z: 0,
      layers: sprite.layers,
      sprite,
      entity,
    }));
  });
  const props = {
    world,
    ...dimensions,
    cellWidth: 18.125,
    cellHeight: 32.222,
    paused: true,
  };
  const { rerender } = render(<HtmlRenderer {...props} />);
  // eslint-disable-next-line testing-library/no-node-access
  const first = screen.getAllByText("A")[0].parentElement!;
  // eslint-disable-next-line testing-library/no-node-access
  const second = screen.getAllByText("A")[1].parentElement!;
  for (const elapsed of [0, 25, 50, 100]) {
    world.metadata.renderTime = camera.startedAt + elapsed;
    rerender(<HtmlRenderer {...props} />);
    expect(first).toHaveStyle({ left: "calc(50% + -27.1875px)" });
    expect(second).toHaveStyle({ left: "calc(50% + -9.0625px)" });
  }
  world.metadata.renderTime = camera.startedAt + 50;
  rerender(<HtmlRenderer {...props} />);
  // eslint-disable-next-line testing-library/no-node-access
  expect(first.parentElement).toHaveStyle({
    transform: "translate(-12.8px, -11.2px)",
  });
  expect(
    screen
      .getByLabelText("Game world")
      .style.getPropertyValue("--html-cell-width")
  ).toBe("18.125px");
  expect(
    screen
      .getByLabelText("Game world")
      .style.getPropertyValue("--html-cell-height")
  ).toBe("32.222px");
});

it("hides the game scene and stops simulation while map generation is suspended", () => {
  const world = createWorld();
  const update = jest.spyOn(world, "update");
  render(
    <WorldProvider value={createWorldContext(world, { suspended: true })}>
      <HtmlRenderer world={world} {...dimensions} paused={false} />
    </WorldProvider>
  );
  advanceFrame(1000);
  expect(screen.queryByLabelText("Game world")).not.toBeInTheDocument();
  expect(update).not.toHaveBeenCalled();
});

it("shakes after new damage and returns to the normal camera position", () => {
  const world = createWorld();
  const hero = assertHero(world);
  hero[PLAYER].receivedStats.melee = 2;
  jest.spyOn(Math, "random").mockReturnValue(0.25);
  const { rerender } = render(
    <HtmlRenderer world={world} {...dimensions} paused />
  );
  // eslint-disable-next-line testing-library/no-node-access
  const camera = screen.getByLabelText("Game world").firstElementChild!;
  expect(camera).toHaveStyle({ transform: "translate(0px, 0px)" });
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  hero[PLAYER].receivedStats.melee += 9;
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  world.metadata.renderTime += 49;
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(camera).toHaveStyle({ transform: "translate(-36px, -32px)" });
  world.metadata.renderTime += 51;
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(camera).toHaveStyle({ transform: "translate(-23px, -32px)" });
  world.metadata.renderTime += 50;
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(camera).toHaveStyle({ transform: "translate(-36px, -32px)" });
});

it("repeats a viewpoint earthquake without damage and settles when it ends", () => {
  const world = createWorld();
  const hero = world.assertComponents(assertHero(world), [VIEWABLE, PLAYER]);
  for (const entity of world.getEntities([VIEWABLE, POSITION]))
    entity[VIEWABLE].active = entity === hero;
  const cameraMotion = motion.createMotion(0, 0, 0, { duration: 0 });
  jest.spyOn(motion, "getCameraMotion").mockReturnValue(cameraMotion);
  jest.spyOn(Math, "random").mockReturnValue(0.25);
  const { rerender } = render(
    <HtmlRenderer world={world} {...dimensions} paused={false} />
  );
  // eslint-disable-next-line testing-library/no-node-access
  const camera = screen.getByLabelText("Game world").firstElementChild!;
  const props = { world, ...dimensions, paused: false };
  const idle = camera.getAttribute("style");
  hero[VIEWABLE].quake = world.metadata.gameEntity[RENDERABLE].generation + 8;
  rerender(<HtmlRenderer {...props} />);
  world.metadata.renderTime += 50;
  rerender(<HtmlRenderer {...props} />);
  expect(camera.getAttribute("style")).not.toBe(idle);
  world.metadata.renderTime += 50;
  rerender(<HtmlRenderer {...props} />);
  expect(camera.getAttribute("style")).toBe(idle);
  world.metadata.renderTime += 50;
  rerender(<HtmlRenderer {...props} />);
  expect(camera.getAttribute("style")).not.toBe(idle);
  hero[VIEWABLE].quake = world.metadata.gameEntity[RENDERABLE].generation;
  world.metadata.renderTime += 50;
  rerender(<HtmlRenderer {...props} />);
  expect(camera.getAttribute("style")).toBe(idle);
  world.metadata.renderTime += 50;
  rerender(<HtmlRenderer {...props} />);
  expect(camera.getAttribute("style")).toBe(idle);
  expect(hero[PLAYER].receivedStats.melee).toBe(0);
});

it("updates the health fill from the shared unit stats", () => {
  const world = createWorld();
  const hero = world.assertComponents(assertHero(world), [STATS]);
  hero[STATS].maxHp = 25;
  hero[STATS].hp = 20;
  const { container, rerender } = render(
    <HtmlRenderer world={world} {...dimensions} paused />
  );
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  const fill = container.querySelector(".HtmlRendererHealth > span")!;
  expect(fill).toHaveStyle({ width: "80%" });
  hero[STATS].hp = 5;
  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  expect(fill).toHaveStyle({ width: "20%" });
});

it("does not shake for an inactive viewpoint's earthquake", () => {
  const world = createWorld();
  const hero = world.assertComponents(assertHero(world), [VIEWABLE]);
  for (const entity of world.getEntities([VIEWABLE, POSITION]))
    entity[VIEWABLE].active = false;
  hero[VIEWABLE].quake = world.metadata.gameEntity[RENDERABLE].generation + 8;
  jest
    .spyOn(motion, "getCameraMotion")
    .mockReturnValue(motion.createMotion(0, 0, 0, { duration: 0 }));
  const { rerender } = render(
    <HtmlRenderer world={world} {...dimensions} paused={false} />
  );
  // eslint-disable-next-line testing-library/no-node-access
  const camera = screen.getByLabelText("Game world").firstElementChild!;
  const idle = camera.getAttribute("style");
  world.metadata.renderTime += 50;
  rerender(<HtmlRenderer world={world} {...dimensions} paused={false} />);
  expect(camera.getAttribute("style")).toBe(idle);
});
