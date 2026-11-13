import { act, render, screen } from "@testing-library/react";
import { useHero, WorldProvider } from "./hooks";
import { createWorldContext } from "../../testing/context";
import { createAreaWorld, assertHero } from "../../testing/harness";
import { POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";

const createWorld = () =>
  createAreaWorld(
    `
|████████|
|█ ♀    █|
|████████|
`,
    { size: 32 }
  );

function HeroPosition() {
  const hero = useHero();
  return (
    <output>
      {hero ? `${hero[POSITION].x},${hero[POSITION].y}` : "No hero"}
    </output>
  );
}

it("reads a preloaded paused world's hero before the simulation advances", () => {
  const world = createWorld();
  const hero = assertHero(world);
  const update = jest.spyOn(world, "update");
  render(
    <WorldProvider value={createWorldContext(world, { paused: true })}>
      <HeroPosition />
    </WorldProvider>
  );

  expect(
    screen.getByText(`${hero[POSITION].x},${hero[POSITION].y}`)
  ).toBeInTheDocument();
  expect(update).not.toHaveBeenCalled();
});

it("receives generation changes and removes its listener when unmounted", () => {
  const world = createWorld();
  const hero = assertHero(world);
  const listenersBefore = Object.keys(world.metadata.listeners).length;
  const { unmount } = render(
    <WorldProvider value={createWorldContext(world, { paused: true })}>
      <HeroPosition />
    </WorldProvider>
  );
  expect(Object.keys(world.metadata.listeners)).toHaveLength(
    listenersBefore + 1
  );

  act(() => {
    hero[POSITION].x += 1;
    hero[RENDERABLE]!.generation += 1;
    Object.values(world.metadata.listeners).forEach((listener) => listener());
  });
  expect(
    screen.getByText(`${hero[POSITION].x},${hero[POSITION].y}`)
  ).toBeInTheDocument();

  unmount();
  expect(Object.keys(world.metadata.listeners)).toHaveLength(listenersBefore);
});
