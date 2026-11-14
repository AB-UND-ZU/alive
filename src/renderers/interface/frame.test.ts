import { HOMING } from "../../engine/components/homing";
import { shootHoming } from "../../engine/systems/homing";
import {
  createAreaWorld,
  getHero,
  giveItems,
  act,
} from "../../testing/harness";
import { POPUP } from "../../engine/components/popup";
import { PLAYER } from "../../engine/components/player";
import { closePopup } from "../../engine/systems/popup";
import { FOG } from "../../engine/components/fog";
import { SPRITE } from "../../engine/components/sprite";
import {
  getCameraMotion,
  releaseCameraMotion,
  updateParticleMotion,
  getMotion,
  updateCameraMotion,
  bumpEntity,
} from "../../engine/motion";
import { getSceneFrame } from "./frame";
import { decayHeight, dotsHeight, immersibleHeight } from "./segments";
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

it("keeps instant actors centered on their camera target throughout movement and map wrapping", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = world.assertComponents(getHero(world)!, [
    MOVABLE,
    POSITION,
    SPRITE,
  ]);
  hero[MOVABLE].spring = { duration: 200 };
  updateCameraMotion(world, true);
  const started = world.metadata.elapsed;
  const body = (instant: boolean) =>
    getSceneFrame(world, 15, 11, undefined, { instant }).find(
      (entry) => entry.sprite === hero[SPRITE]
    )!;
  for (const position of [
    { x: 8, y: 2 },
    { x: 6, y: 3 },
    { x: 47, y: 2 },
    { x: 0, y: 2 },
  ]) {
    moveEntity(world, hero, position);
    updateCameraMotion(world);
    for (const elapsed of [0, 50, 100, 200]) {
      world.metadata.renderTime = started + elapsed;
      expect(body(true).x).toBe(7);
      expect(body(true).y).toBe(5);
    }
  }
});

it("ignores bumps in an instant frame while keeping normal body interpolation", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = world.assertComponents(getHero(world)!, [BUMPABLE, SPRITE]);
  updateCameraMotion(world, true);
  bumpEntity(world, hero, "right");
  const body = (instant: boolean) =>
    getSceneFrame(world, 15, 11, undefined, { instant }).find(
      (entry) => entry.sprite === hero[SPRITE]
    )!;
  expect(body(false).x).toBeGreaterThan(7);
  expect(body(true).x).toBe(7);
  expect(body(true).y).toBe(5);
});

it("animates sequence particles while keeping actors instant", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = getHero(world)!;
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
  world.metadata.renderTime = world.metadata.elapsed + 100;
  const pointer = (instant: boolean) =>
    getSceneFrame(world, 15, 11, undefined, { instant }).find(
      (entry) => entry.sprite === questPointer
    )!;
  expect(pointer(false).x).toBe(9);
  expect(pointer(true).x).toBe(9);
  particle[PARTICLE].offsetX = 0;
  updateParticleMotion(world, particle);
  world.metadata.renderTime = world.metadata.elapsed + 300;
  expect(pointer(true).x).toBe(7);
});

it("marks explored fog on world sprites without changing interface particle colors", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = world.assertComponents(getHero(world)!, [FOG, SPRITE]);
  hero[FOG].type = "object";
  hero[FOG].visibility = "fog";
  const particle = entities.createFibre(world, {
    [SPRITE]: questPointer,
    [PARTICLE]: { offsetX: 1, offsetY: 0, offsetZ: 9 },
    [ORIENTABLE]: { facing: "right" },
    [RENDERABLE]: { generation: 0 },
  });
  getSequence(world, hero, "pointer")!.particles = {
    pointer: world.getEntityId(particle),
  };
  const frame = getSceneFrame(world, 15, 11, undefined, { instant: true });
  expect(frame.find((entry) => entry.sprite === hero[SPRITE])?.fog).toBe(true);
  expect(
    frame.find((entry) => entry.sprite === questPointer)?.fog
  ).toBeUndefined();
  hero[FOG].visibility = "visible";
  expect(
    getSceneFrame(world, 15, 11).find((entry) => entry.sprite === hero[SPRITE])
      ?.fog
  ).toBe(false);
});

it("marks unexplored air for terminal fog coloring", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = world.assertComponents(getHero(world)!, [FOG, SPRITE]);
  hero[FOG].type = "air";
  hero[FOG].visibility = "hidden";
  expect(
    getSceneFrame(world, 15, 11, undefined, { instant: true }).find(
      (entry) => entry.sprite === hero[SPRITE]
    )?.fog
  ).toBe(true);
});

it("removes closed popup particles from an instant frame before the next engine update", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = world.assertComponents(getHero(world)!, [PLAYER]);
  act(world, "inspect");
  const popup = world.assertByIdAndComponents(hero[PLAYER].popup, [POPUP]);
  const state = getSequence(world, popup, "popup")!;
  const first = world.assertByIdAndComponents(
    Object.values(state.particles)[0],
    [SPRITE]
  );
  const marker = entities.createFibre(world, {
    [SPRITE]: questPointer,
    [PARTICLE]: { offsetX: 1, offsetY: 0, offsetZ: 9 },
    [ORIENTABLE]: { facing: "right" },
    [RENDERABLE]: { generation: 0 },
  });
  getSequence(world, hero, "pointer")!.particles.marker =
    world.getEntityId(marker);
  const hasPopup = (instant: boolean) =>
    getSceneFrame(world, 15, 11, undefined, { instant }).some(
      (entry) => entry.entity === popup && entry.sprite === first[SPRITE]
    );
  expect(hasPopup(true)).toBe(true);
  closePopup(world, hero, popup);
  expect(hasPopup(false)).toBe(true);
  expect(hasPopup(true)).toBe(false);
  expect(
    getSceneFrame(world, 15, 11, undefined, { instant: true }).some(
      (entry) => entry.sprite === questPointer
    )
  ).toBe(true);
});

it("keeps a homing disc aligned to its visible movement until it reaches a corner", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = getHero(world)!;
  const start = { ...hero[POSITION] };
  const disc = shootHoming(world, hero, {
    type: "ironDisc",
    positions: [
      { x: start.x + 1, y: start.y },
      { x: start.x + 1, y: start.y + 1 },
    ],
  });
  disc[FOG].visibility = "visible";
  disc[MOVABLE].spring = { duration: 100 };
  moveEntity(world, disc, { x: start.x + 1, y: start.y });
  disc[ORIENTABLE].facing = "down";
  world.metadata.renderTime = world.metadata.elapsed + 50;
  const body = (instant = false) =>
    getSceneFrame(world, 15, 11, undefined, { instant }).find(
      (entry) => entry.entity === disc && entry.sprite === disc[SPRITE]
    )!;
  expect(body().layers).toEqual(getFacingLayers(disc[SPRITE], "right"));
  expect(body(true).layers).toEqual(getFacingLayers(disc[SPRITE], "down"));
  expect(disc[ORIENTABLE].facing).toBe("down");
  expect(disc[HOMING].positions).toHaveLength(2);
  world.metadata.renderTime += 50;
  expect(body().layers).toEqual(getFacingLayers(disc[SPRITE], "down"));
  world.metadata.elapsed += 100;
  moveEntity(world, disc, { x: start.x + 1, y: start.y + 1 });
  world.metadata.renderTime = world.metadata.elapsed + 50;
  expect(body().layers).toEqual(getFacingLayers(disc[SPRITE], "down"));
});

it("keeps hidden loot available for fading and keys items by identity", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = world.assertComponents(getHero(world)!, [INVENTORY, POSITION]);
  const [first] = giveItems(world, hero, [{ stackable: "worm", amount: 1 }]);
  dropEntity(
    world,
    { [INVENTORY]: { items: [world.getEntityId(first)] } },
    { x: 5, y: 2 },
    true
  );
  const carrier = world.assertByIdAndComponents(first[ITEM].carrier, [
    FOG,
    INVENTORY,
    POSITION,
  ]);
  giveItems(world, carrier, [{ stackable: "apple", amount: 1 }]);
  carrier[FOG].visibility = "visible";
  const entries = () =>
    getSceneFrame(world, 15, 11, undefined, { includeHidden: true }).filter(
      (entry) => entry.entity === carrier && entry.loot
    );
  const original = entries();
  expect(original).toHaveLength(2);
  expect(original.every((entry) => !entry.hidden)).toBe(true);
  carrier[FOG].visibility = "hidden";
  expect(entries().every((entry) => entry.hidden)).toBe(true);
  carrier[INVENTORY].items.shift();
  expect(entries()).toHaveLength(1);
  expect(entries()[0].key).toBe(original[1].key);
});

it("reports fog across the whole requested grid, including empty cells", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = getHero(world)!;
  const { x, y } = hero[POSITION];
  expect(world.metadata.visibleCells.has(x * 48 + y)).toBe(true);
  const grid = getSceneFrame(world, 31, 21, undefined, {
    instant: true,
    fogCells: true,
  }).filter((entry) => entry.sprite.name === "visibility");
  expect(grid).toHaveLength(31 * 21);
  expect(grid.find((entry) => entry.x === 15 && entry.y === 10)?.fog).toBe(
    false
  );
  expect(grid[0].fog).toBe(true);
  expect(
    getSceneFrame(world, 31, 21).some(
      (entry) => entry.sprite.name === "visibility"
    )
  ).toBe(false);
});

it("draws a dropped stack's dots above remains and swimming independently of its loot", () => {
  const world = createAreaWorld(area, { size: 48 });
  const hero = world.assertComponents(getHero(world)!, [INVENTORY, POSITION]);
  const [item] = giveItems(world, hero, [{ stackable: "apple", amount: 4 }]);
  dropEntity(
    world,
    { [INVENTORY]: { items: [world.getEntityId(item)] } },
    { x: 5, y: 2 },
    true
  );
  const carrier = world.assertByIdAndComponents(item[ITEM].carrier, [FOG]);
  carrier[FOG].visibility = "visible";
  const frame = getSceneFrame(world, 15, 11);
  const loot = frame.find((entry) => entry.sprite === item[SPRITE])!;
  const dots = frame.find((entry) => entry.entity === carrier && entry.dots)!;
  expect(dots).toBeDefined();
  expect(dots.dots).toBe(4);
  expect(dots.z).toBe(dotsHeight);
  expect(dots.z).toBeGreaterThan(decayHeight);
  expect(dots.z).toBeGreaterThan(immersibleHeight);
  expect(dots).toMatchObject({ x: loot.x, y: loot.y, hidden: false });
  expect(loot.dots).toBeUndefined();
  carrier[FOG].visibility = "fog";
  expect(
    getSceneFrame(world, 15, 11, undefined, { includeHidden: true }).find(
      (entry) => entry.entity === carrier && entry.dots
    )?.hidden
  ).toBe(true);
});
