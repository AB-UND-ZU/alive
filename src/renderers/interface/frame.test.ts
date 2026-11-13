import { createAreaWorld, getHero, giveItems } from "../../testing/harness";
import { FOG } from "../../engine/components/fog";
import { SPRITE } from "../../engine/components/sprite";
import {
  getCameraMotion,
  releaseCameraMotion,
  updateParticleMotion,
  getMotion,
} from "../../engine/motion";
import { getSceneFrame } from "./frame";
import { ORIENTABLE } from "../../engine/components/orientable";
import { INVENTORY } from "../../engine/components/inventory";
import { POSITION } from "../../engine/components/position";
import { ITEM } from "../../engine/components/item";
import { SWIMMABLE } from "../../engine/components/swimmable";
import { MOVABLE } from "../../engine/components/movable";
import { BUMPABLE } from "../../engine/components/bumpable";
import { PARTICLE } from "../../engine/components/particle";
import { RENDERABLE } from "../../engine/components/renderable";
import { entities } from "../../engine";
import { getSequence } from "../../engine/systems/sequence";
import { tooltipLine, questPointer } from "../../game/assets/sprites";
import { getFacingLayers } from "../../game/assets/ui";
import { dropEntity } from "../../engine/systems/drop";
import { moveEntity } from "../../engine/systems/map";

const area = `
|█████████|
|█       █|
|█   ♀   █|
|█       █|
|█████████|
`;

describe("Scene frame", () => {
  it("keeps the visible player and hides the player in unexplored fog", () => {
    const world = createAreaWorld(area, { size: 48 });
    const hero = getHero(world)!;
    hero[FOG]!.visibility = "visible";
    const scene = getSceneFrame(world, 15, 11);
    const player = scene.filter((entry) => entry.entity === hero);
    expect(player.length).toBeGreaterThan(0);
    expect(player.some((entry) => entry.sprite === hero[SPRITE])).toBe(true);
    hero[FOG]!.visibility = "fog";
    expect(
      getSceneFrame(world, 15, 11).filter(
        (entry) => entry.entity === hero && entry.layers.length
      )
    ).toEqual([]);
  });

  it("uses the active dialog camera without advancing game time", () => {
    const world = createAreaWorld(area, { size: 48 });
    releaseCameraMotion(world);
    expect(getCameraMotion(world)).toBeUndefined();
    const hero = getHero(world)!;
    hero[FOG]!.visibility = "visible";
    const elapsed = world.metadata.elapsed;
    const sprite = getSceneFrame(world, 15, 11).find(
      (entry) => entry.sprite === hero[SPRITE]
    );
    expect(sprite?.x).toBe(7);
    expect(sprite?.y).toBe(5);
    expect(world.metadata.elapsed).toBe(elapsed);
  });
});

it("keeps the idle sword facing independent of walking and applies its attack facing", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = world.assertComponents(getHero(world)!, [
    INVENTORY,
    POSITION,
    ORIENTABLE,
  ]);
  const [sword] = giveItems(world, hero, [
    { weapon: "sword", material: "iron", amount: 1 },
  ]);
  const weapon = world.assertComponents(sword, [SPRITE, ORIENTABLE]);
  hero[ORIENTABLE].facing = "up";
  weapon[ORIENTABLE].facing = undefined;
  expect(
    getSceneFrame(world, 15, 11).find(
      (entry) => entry.sprite === weapon[SPRITE]
    )?.layers
  ).toEqual(weapon[SPRITE].layers);
  weapon[ORIENTABLE].facing = "left";
  expect(
    getSceneFrame(world, 15, 11).find(
      (entry) => entry.sprite === weapon[SPRITE]
    )?.layers
  ).toEqual(getFacingLayers(weapon[SPRITE], "left"));
});

it("leaves straight tooltip segments and inactive focus pointers unoriented", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = world.assertComponents(getHero(world)!, [
    ORIENTABLE,
    "SEQUENCABLE",
  ]);
  hero[ORIENTABLE].facing = "up";
  const state = getSequence(world, hero, "pointer")!;
  state.particles = {};
  for (const [key, sprite, facing] of [
    ["straight", tooltipLine, undefined],
    ["corner", tooltipLine, "up"],
    ["pointer", questPointer, undefined],
  ] as const) {
    const particle = entities.createFibre(world, {
      [SPRITE]: sprite,
      [PARTICLE]: { offsetX: 1, offsetY: 0, offsetZ: 9 },
      [ORIENTABLE]: { facing },
      [RENDERABLE]: { generation: 0 },
    });
    state.particles[key] = world.getEntityId(particle);
  }
  const frame = getSceneFrame(world, 15, 11);
  const lines = frame.filter((entry) => entry.sprite === tooltipLine);
  expect(lines.map((entry) => entry.layers)).toEqual([
    tooltipLine.layers,
    getFacingLayers(tooltipLine, "up"),
  ]);
  expect(frame.find((entry) => entry.sprite === questPointer)?.layers).toEqual(
    []
  );
});

it("resets a loose worm's sprite while its carrier keeps the last movement direction", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = world.assertComponents(getHero(world)!, [INVENTORY, POSITION]);
  const [worm] = giveItems(world, hero, [{ stackable: "worm", amount: 1 }]);
  dropEntity(
    world,
    { [INVENTORY]: { items: [world.getEntityId(worm)] } },
    { x: 5, y: 2 }
  );
  const carrier = world.assertByIdAndComponents(worm[ITEM].carrier, [
    FOG,
    ORIENTABLE,
  ]);
  carrier[FOG].visibility = "visible";
  carrier[ORIENTABLE].facing = "right";
  world.addComponentToEntity(worm, ORIENTABLE, { facing: "right" });
  expect(
    getSceneFrame(world, 15, 11).find((entry) => entry.sprite === worm[SPRITE])
      ?.layers
  ).toEqual(getFacingLayers(worm[SPRITE], "right"));
  world.assertComponents(worm, [ORIENTABLE])[ORIENTABLE].facing = undefined;
  expect(
    getSceneFrame(world, 15, 11).find((entry) => entry.sprite === worm[SPRITE])
      ?.layers
  ).toEqual(worm[SPRITE].layers);
});

it("keeps unit and fog nodes available for visibility transitions and preserves moving keys", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = getHero(world)!;
  hero[FOG]!.visibility = "visible";
  const before = getSceneFrame(world, 15, 11, undefined, {
    includeHidden: true,
  }).find((entry) => entry.sprite === hero[SPRITE])!;
  expect(before.hidden).toBe(false);
  expect(
    getSceneFrame(world, 15, 11, undefined, { includeHidden: true }).find(
      (entry) => entry.entity === hero && entry.key.endsWith(":fog")
    )?.hidden
  ).toBe(true);
  moveEntity(world, hero, { x: hero[POSITION].x + 1, y: hero[POSITION].y });
  hero[FOG]!.visibility = "fog";
  const hidden = getSceneFrame(world, 15, 11, undefined, {
    includeHidden: true,
  }).find((entry) => entry.sprite === hero[SPRITE])!;
  expect(hidden.hidden).toBe(true);
  expect(hidden.key).toBe(before.key);
  expect(
    getSceneFrame(world, 15, 11).some((entry) => entry.sprite === hero[SPRITE])
  ).toBe(false);
});

it("gives wrapped copies separate stable keys and keeps the center copy across a seam", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = getHero(world)!;
  hero[MOVABLE].spring = { duration: 0 };
  moveEntity(world, hero, { x: 0, y: hero[POSITION].y });
  const first = getSceneFrame(world, 15, 11).find(
    (entry) => entry.sprite === hero[SPRITE]
  )!;
  moveEntity(world, hero, { x: 47, y: hero[POSITION].y });
  expect(
    getSceneFrame(world, 15, 11).find((entry) => entry.sprite === hero[SPRITE])
      ?.key
  ).toBe(first.key);
  const copies = getSceneFrame(world, 110, 11).filter(
    (entry) => entry.sprite === hero[SPRITE]
  );
  expect(copies.length).toBeGreaterThan(1);
  expect(new Set(copies.map((entry) => entry.key)).size).toBe(copies.length);
});

it("exposes swimming water above the body but not while flying", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = world.assertComponents(getHero(world)!, [SWIMMABLE]);
  hero[SWIMMABLE].swimming = true;
  const frame = getSceneFrame(world, 15, 11);
  const overlay = frame.find(
    (entry) => entry.entity === hero && entry.swimming
  );
  expect(overlay).toBeDefined();
  expect(overlay?.hidden).toBe(false);
  expect(overlay!.z).toBeGreaterThan(
    frame.find((entry) => entry.sprite === hero[SPRITE])!.z
  );
  hero[MOVABLE]!.flying = true;
  expect(
    getSceneFrame(world, 15, 11).some(
      (entry) => entry.entity === hero && entry.swimming
    )
  ).toBe(false);
});

it("stops sampling cached body and particle motion when animation flags are removed", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = world.assertComponents(getHero(world)!, [
    BUMPABLE,
    MOVABLE,
    POSITION,
    SPRITE,
  ]);
  hero[MOVABLE].spring = { duration: 200 };
  moveEntity(world, hero, { x: hero[POSITION].x + 2, y: hero[POSITION].y });
  world.metadata.renderTime = world.metadata.elapsed + 100;
  const body = () =>
    getSceneFrame(world, 15, 11).find(
      (entry) => entry.sprite === hero[SPRITE]
    )!;
  expect(body().x).toBe(6);
  expect(getMotion(hero)).toBeDefined();
  world.removeComponentFromEntity(hero, MOVABLE, false);
  world.removeComponentFromEntity(hero, BUMPABLE, false);
  expect(body().x).toBe(7);

  const particle = entities.createFibre(world, {
    [SPRITE]: questPointer,
    [PARTICLE]: {
      offsetX: 4,
      offsetY: 0,
      offsetZ: 9,
      animatedOrigin: { x: 0, y: 0 },
      duration: 200,
    },
    [ORIENTABLE]: { facing: "right" },
    [RENDERABLE]: { generation: 0 },
  });
  getSequence(world, hero, "pointer")!.particles = {
    pointer: world.getEntityId(particle),
  };
  updateParticleMotion(world, particle);
  const pointer = () =>
    getSceneFrame(world, 15, 11).find(
      (entry) => entry.sprite === questPointer
    )!;
  expect(pointer().x).toBe(9);
  particle[PARTICLE].animatedOrigin = undefined;
  expect(getMotion(particle)).toBeDefined();
  expect(pointer().x).toBe(11);
});
