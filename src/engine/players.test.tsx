import { fireEvent, screen } from "@testing-library/react";
import { getClosestPlayer, getLocalPlayer } from "./players";
import { createHero } from "./systems/fate";
import { advance, assertHero, createAreaWorld } from "../testing/harness";
import { POSITION } from "./components/position";
import { PLAYER } from "./components/player";
import { STATS } from "./components/stats";
import { ACTIONABLE } from "./components/actionable";
import { useHero } from "../bindings/hooks";
import { renderHud } from "../components/Controls/testing";
import { moveEntity, registerEntity } from "./systems/map";

const setup = () => {
  const world = createAreaWorld(
    "|               |\n| ♀             |\n|               |",
    { size: 32 }
  );
  advance(world, 2500);
  const first = world.assertComponents(assertHero(world), [
    STATS,
    POSITION,
    PLAYER,
    ACTIONABLE,
  ]);
  const second = createHero(world, first);
  registerEntity(world, second);
  moveEntity(world, second, { x: 8, y: 1 });
  return { world, first, second };
};

it("defaults to the existing single-player hero", () => {
  const { world, first } = setup();
  expect(getLocalPlayer(world, [POSITION])).toBe(first);
});

it("selects the assigned actor and never substitutes another player", () => {
  const { world, first, second } = setup();
  world.metadata.localPlayerId = world.getEntityId(second);
  expect(getLocalPlayer(world, [POSITION])).toBe(second);
  world.removeEntity(second, false);
  expect(getLocalPlayer(world, [POSITION])).toBeUndefined();
  expect(world.getEntityById(world.getEntityId(first))).toBe(first);
});

it("routes rendered player actions to the selected hero only", () => {
  const { world, first, second } = setup();
  world.metadata.localPlayerId = world.getEntityId(second);
  function Probe() {
    const hero = useHero();
    return (
      <button
        onClick={() => {
          if (hero?.ACTIONABLE) hero.ACTIONABLE.skillTriggered = true;
        }}
      >
        Use skill
      </button>
    );
  }
  renderHud(world, <Probe />);
  fireEvent.click(screen.getByRole("button", { name: "Use skill" }));
  expect(first[ACTIONABLE].skillTriggered).toBe(false);
  expect(second[ACTIONABLE].skillTriggered).toBe(true);
});

it("retargets the nearest living player, including across the wrapping map edge", () => {
  const { world, first, second } = setup();
  expect(getClosestPlayer(world, { x: 7, y: 1 }, [STATS])).toBe(second);
  moveEntity(world, first, { x: 31, y: 1 });
  expect(getClosestPlayer(world, { x: 0, y: 1 }, [STATS])).toBe(first);
  first[STATS].hp = 0;
  expect(getClosestPlayer(world, { x: 0, y: 1 }, [STATS])).toBe(second);
  second[PLAYER].ghost = true;
  expect(getClosestPlayer(world, { x: 0, y: 1 }, [STATS])).toBeUndefined();
});
