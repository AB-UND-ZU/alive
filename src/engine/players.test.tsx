import { fireEvent, screen } from "@testing-library/react";
import { entities } from ".";
import { LAYER } from "./components/layer";
import { VIEWABLE } from "./components/viewable";
import { STRUCTURABLE } from "./components/structurable";
import { updateCameraMotion } from "./motion";
import {
  getClosestPlayer,
  getLocalPlayer,
  getScriptPlayer,
  selectViewable,
} from "./players";
import { createTooltip } from "./systems/damage";
import { createPopup } from "./systems/popup";
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

it("keeps another player's popup camera out of the selected actor's view", () => {
  const { world, first, second } = setup();
  world.metadata.localPlayerId = world.getEntityId(second);
  const popup = entities.createViewpoint(world, {
    POSITION: { x: 20, y: 20 },
    RENDERABLE: { generation: 0 },
    VIEWABLE: { active: true, priority: 90, owner: world.getEntityId(first) },
  });
  const viewables = () => world.getEntities([VIEWABLE, POSITION]);
  expect(selectViewable(viewables(), world)).toBe(second);
  expect(updateCameraMotion(world, true)).toMatchObject({ x: 8, y: 1 });
  popup[VIEWABLE].owner = world.getEntityId(second);
  expect(selectViewable(viewables(), world)).toBe(popup);
});

it("uses the selected player's building membership instead of another player's roof toggle", () => {
  const { world, second } = setup();
  world.metadata.localPlayerId = world.getEntityId(second);
  const building = entities.createViewpoint(world, {
    POSITION: { x: 12, y: 12 },
    RENDERABLE: { generation: 0 },
    VIEWABLE: { active: true, priority: 50 },
  });
  world.addComponentToEntity(building, STRUCTURABLE, {});
  expect(selectViewable(world.getEntities([VIEWABLE, POSITION]), world)).toBe(
    second
  );
  second[LAYER].structure = world.getEntityId(building);
  building[VIEWABLE].active = false;
  expect(selectViewable(world.getEntities([VIEWABLE, POSITION]), world)).toBe(
    building
  );
});

it("keeps a shared world cutscene camera from pulling a remote player's view away", () => {
  const { world, second } = setup();
  world.metadata.localPlayerId = world.getEntityId(second);
  entities.createViewpoint(world, {
    POSITION: { x: 20, y: 20 },
    RENDERABLE: { generation: 0 },
    VIEWABLE: { active: true, priority: 30 },
  });
  expect(selectViewable(world.getEntities([VIEWABLE, POSITION]), world)).toBe(
    second
  );
});

it("selects the dialog owner for shared scripts and otherwise follows the nearest active character", () => {
  const { world, first, second } = setup();
  world.metadata.warpPlayer = () => {};
  const sign = world.createEntity();
  world.addComponentToEntity(sign, POSITION, { x: 7, y: 1 });
  expect(getScriptPlayer(world, sign, [STATS])).toBe(second);
  world.addComponentToEntity(sign, "SEQUENCABLE", { states: {} });
  world.addComponentToEntity(sign, "RENDERABLE", { generation: 0 });
  createPopup(world, sign, { tabs: ["info"] });
  sign.POPUP!.active = true;
  sign.POPUP!.owner = world.getEntityId(first);
  expect(getScriptPlayer(world, sign, [STATS])).toBe(first);
  first[PLAYER].connected = false;
  expect(getScriptPlayer(world, sign, [STATS])).toBe(second);
  second[STATS].hp = 0;
  expect(getScriptPlayer(world, sign, [STATS])).toBeUndefined();
});

it("limits shared boss viewpoints to living participants inside their arena", () => {
  const { world, first, second } = setup();
  moveEntity(world, second, { x: 14, y: 1 });
  const boss = entities.createViewpoint(world, {
    POSITION: { x: 2, y: 1 },
    RENDERABLE: { generation: 0 },
    VIEWABLE: { active: true, priority: 100, radius: 4 },
  });
  const views = world.getEntities([VIEWABLE, POSITION]);
  expect(selectViewable(views, world, world.getEntityId(first))).toBe(boss);
  expect(selectViewable(views, world, world.getEntityId(second))).toBe(second);
  first[STATS].hp = 0;
  expect(selectViewable(views, world, world.getEntityId(first))).toBe(first);
});

it("uses a player's username in their hover tooltip", () => {
  const { world, first } = setup();
  first[PLAYER].username = "Alice";
  expect(
    createTooltip(world, first)
      .slice(1, -1)
      .map((sprite) => sprite.layers[sprite.layers.length - 1].char)
      .join("")
  ).toBe("Alice");
});
