import { requireComponent } from "../engine/entities";
import { resolveSprite } from "../game/assets/spriteIds";
import { movementGoals, createPreviewWorld } from "./scenes";
import { findPath, relativeOrientations } from "../game/math/path";
import {
  assertHero,
  trigger,
  advanceUntil,
  walk,
  advance,
  holdMove,
  step,
} from "../testing/harness";
import { CASTABLE } from "../engine/components/castable";
import { EXERTABLE } from "../engine/components/exertable";
import { POSITION } from "../engine/components/position";
import { STATS } from "../engine/components/stats";
import { EQUIPPABLE } from "../engine/components/equippable";
import { ITEM } from "../engine/components/item";
import { PLAYER } from "../engine/components/player";
import { POPUP } from "../engine/components/popup";
import {
  canShop,
  getTab,
  getDeal,
  getTabSelections,
  getVerticalIndex,
} from "../engine/systems/popup";
import { getForgeStatus } from "../game/balancing/forging";
import { getCellEntities } from "../engine/systems/map";

describe("wiki game worlds", () => {
  it("equips the selected spell in the real equipment slot", () => {
    const world = createPreviewWorld("abilities", "beam");
    const hero = world.assertComponents(assertHero(world), [EQUIPPABLE]);
    const spell = world.assertByIdAndComponents(hero[EQUIPPABLE].spell!, [
      ITEM,
    ]);
    expect(spell[ITEM].spell).toBe("beam");
  });
  it("arms the Trap example after moving and hits the neighboring dummy once", () => {
    const world = createPreviewWorld("abilities", "trap");
    const hero = assertHero(world);
    const target = getCellEntities(world, { x: 4, y: 4 }).find(
      (entity) => entity[STATS]
    )!;
    const targetId = world.getEntityId(target);
    const stats = requireComponent(target, STATS);
    const hp = stats.hp;
    walk(world, "right", 1);
    trigger(world, "spell");
    const getSpell = () =>
      world
        .getEntities([CASTABLE, POSITION])
        .find((entity) => entity[CASTABLE].caster === world.getEntityId(hero));
    advanceUntil(world, () => !!getSpell());
    const spell = getSpell()!;
    const spellId = world.getEntityId(spell);
    const getAreas = () =>
      world
        .getEntities([EXERTABLE])
        .filter((area) => area[EXERTABLE].castable === spellId);
    expect(spell[POSITION]).toEqual({ x: 3, y: 4 });
    expect(getAreas()).toHaveLength(0);

    walk(world, "down", 1);
    step(world);
    expect(getAreas()).toHaveLength(9);
    advanceUntil(world, () => !!spell[CASTABLE].affected[targetId]);
    expect(stats.hp).toBeLessThan(hp);
    const hit = { ...spell[CASTABLE].affected[targetId] };
    advance(world, 500);
    expect(spell[CASTABLE].affected).toEqual({ [targetId]: hit });
    advanceUntil(world, () => !world.getEntityById(spellId));
    expect(getAreas()).toHaveLength(0);
  });
  it("opens the real crafting dialog with the normal interaction trigger", () => {
    const world = createPreviewWorld("crafting");
    const hero = assertHero(world);
    trigger(world, "interact");
    advanceUntil(world, () => !!hero[PLAYER].popup);
    const popup = world.assertByIdAndComponents(hero[PLAYER].popup!, [POPUP]);
    expect(popup[POPUP].tabs).toContain("craft");
  });
  it("opens the real buy and sell dialog at the preview merchant", () => {
    const world = createPreviewWorld("trading"),
      hero = assertHero(world);
    trigger(world, "interact");
    advanceUntil(world, () => !!hero[PLAYER].popup);
    const popup = world.assertByIdAndComponents(hero[PLAYER].popup!, [POPUP]);
    expect(popup[POPUP].tabs).toEqual(["buy", "sell"]);
    expect(popup[POPUP].deals.length).toBeGreaterThan(0);
  });
  it("equips the interface preview with real weapon, spell and skill slots", () => {
    const world = createPreviewWorld("interface");
    const hero = world.assertComponents(assertHero(world), [EQUIPPABLE]);
    expect(hero[EQUIPPABLE].weapon).toBeDefined();
    expect(hero[EQUIPPABLE].spell).toBeDefined();
    expect(hero[EQUIPPABLE].skill).toBeDefined();
    expect(hero[EQUIPPABLE].compass).toBeDefined();
    expect(hero[EQUIPPABLE].map).toBeDefined();
  });
});

test("feature scenes keep their viewpoint fixed when the hero moves", () => {
  const world = createPreviewWorld("movement");
  const camera = world
    .getEntities(["VIEWABLE", "POSITION"])
    .find((entity) => entity.VIEWABLE.priority === 80)!;
  const position = { ...camera.POSITION };
  assertHero(world).POSITION.x += 1;
  expect(camera.POSITION).toEqual(position);
  expect(camera.VIEWABLE.active).toBe(true);
});

test("dialogs take camera priority over the stationary scene viewpoint", () => {
  const world = createPreviewWorld("crafting");
  trigger(world, "interact");
  advanceUntil(world, () => !!assertHero(world)[PLAYER].popup);
  const active = world
    .getEntities(["VIEWABLE", "POSITION"])
    .filter((entity) => entity.VIEWABLE.active)
    .sort((left, right) => right.VIEWABLE.priority - left.VIEWABLE.priority)[0];
  expect(active.VIEWABLE.priority).toBe(90);
  expect(active.POSITION).not.toEqual({ x: 6, y: 4 });
});

test("the crafting example can redeem its first offer", () => {
  const world = createPreviewWorld("crafting");
  const hero = assertHero(world);
  trigger(world, "interact");
  advanceUntil(world, () => !!hero[PLAYER].popup);
  const popup = world.assertByIdAndComponents(hero[PLAYER].popup!, [POPUP]);
  expect(canShop(world, hero, getDeal(world, hero, popup)!)).toBe(true);
});

test("the forging example supports upgrading its first base to iron", () => {
  const world = createPreviewWorld("forging");
  const hero = assertHero(world);
  trigger(world, "interact");
  advanceUntil(world, () => !!hero[PLAYER].popup);
  const popup = world.assertByIdAndComponents(hero[PLAYER].popup!, [POPUP]);
  trigger(world, "right");
  advanceUntil(world, () => getTabSelections(world, popup).length === 1);
  holdMove(world, ["down"]);
  advance(world, 60);
  holdMove(world, []);
  advance(world, 400);
  expect(getVerticalIndex(world, popup)).toBe(1);
  trigger(world, "right");
  advanceUntil(world, () => getTabSelections(world, popup).length === 2);
  const [baseIndex, addIndex] = getTabSelections(world, popup);
  const status = getForgeStatus(world, hero, baseIndex, addIndex);
  expect(status.forgeable).toBe(true);
  expect(popup.FORGABLE?.steps).toHaveLength(0);
  expect(status.resultItem).toMatchObject({
    weapon: "sword",
    material: "iron",
  });
});

test("the house example unlocks a real door and enters its assigned structure", () => {
  const world = createPreviewWorld("structures");
  const hero = assertHero(world);
  expect(hero.LAYER?.structure).toBeUndefined();
  trigger(world, "interact");
  advance(world, 1000);
  walk(world, "up", 2);
  expect(hero.LAYER?.structure).toBeDefined();
});

test("the vision example keeps ground behind its mountain out of sight", () => {
  const world = createPreviewWorld("light");
  walk(world, "right", 3);
  advance(world, 500);
  const visibilityAt = (x: number, y: number) =>
    getCellEntities(world, { x, y }).find(
      (entity) => resolveSprite(entity.SPRITE)?.name === "grass_empty"
    )?.FOG?.visibility;
  expect(visibilityAt(6, 5)).toBe("visible");
  expect(visibilityAt(10, 4)).toBe("hidden");
});

test("preview walls match the frame bounds and stay visible at every edge", () => {
  const world = createPreviewWorld("movement");
  for (let y = -3; y <= 11; y++)
    for (let x = -5; x <= 17; x++) {
      if (x !== -5 && x !== 17 && y !== -3 && y !== 11) continue;
      const entities = getCellEntities(world, {
        x: (x + 32) % 32,
        y: (y + 32) % 32,
      });
      expect(
        entities.some((entity) => entity.COLLIDABLE && !entity.HARVESTABLE)
      ).toBe(true);
      for (const entity of entities.filter((entity) => entity.FOG)) {
        const fog = requireComponent(entity, "FOG");
        expect(fog.visibility).toBe("visible");
        expect(fog.fixed).toBe(true);
      }
    }
});

test("the vision example keeps interior fog while clearing the exact frame edge", () => {
  const world = createPreviewWorld("light");
  const edge = getCellEntities(world, { x: 17, y: 4 });
  expect(
    edge
      .filter((entity) => entity.FOG)
      .every(
        (entity) => requireComponent(entity, "FOG").fixed && requireComponent(entity, "FOG").visibility === "visible"
      )
  ).toBe(true);
  expect(
    getCellEntities(world, { x: 10, y: 4 }).some(
      (entity) => entity.FOG && !entity.FOG.fixed
    )
  ).toBe(true);
});

test("dialog cameras retain a clear backdrop without disabling building layers", () => {
  const world = createPreviewWorld("crafting");
  const hero = assertHero(world);
  const air = world
    .getEntities(["FOG"])
    .filter((entity) => entity.FOG.type === "air");
  expect(air.length).toBeGreaterThan(0);
  expect(
    air.every(
      (entity) => entity.FOG.fixed && entity.FOG.visibility === "visible"
    )
  ).toBe(true);
  const bench = getCellEntities(world, { x: 3, y: 4 }).find(
    (entity) => entity.POPUP
  );
  expect(bench?.FOG?.fixed).toBe(false);
  trigger(world, "interact");
  advanceUntil(world, () => !!hero[PLAYER].popup);
  expect(
    air.every(
      (entity) => entity.FOG.fixed && entity.FOG.visibility === "visible"
    )
  ).toBe(true);
});

test("the movement maze reveals native fog, collects an Apple and has a walkable exit", () => {
  const world = createPreviewWorld("movement");
  const hero = world.assertComponents(assertHero(world), [
    "INVENTORY",
    "POSITION",
  ]);
  expect(hero.POSITION).toEqual({ x: 1, y: 7 });
  const destination = getCellEntities(world, { x: 11, y: 1 });
  expect(
    destination.some(
      (entity) =>
        entity.FOG && !entity.FOG.fixed && entity.FOG.visibility !== "visible"
    )
  ).toBe(true);
  for (const [direction, cells] of [
    ["right", 4],
    ["up", 2],
    ["right", 4],
    ["up", 2],
    ["right", 2],
    ["up", 2],
  ] as const)
    walk(world, direction, cells);
  advance(world, 400);
  expect(hero.POSITION).toEqual({ x: 11, y: 1 });
  expect(
    hero.INVENTORY.items
      .map((id) => world.assertByIdAndComponents(id, ["ITEM"]).ITEM)
      .some((item) => item.stackable === "apple" && item.amount === 1)
  ).toBe(true);
  expect(
    destination.some((entity) => entity.FOG?.visibility === "visible")
  ).toBe(true);
  walk(world, "right", 3);
  expect(hero.POSITION).toEqual({ x: 14, y: 1 });
});
test("the terrain scene includes native ice, snow, shore, ground and deep-water mechanics", () => {
  const world = createPreviewWorld("water");
  expect(world.getEntities(["FREEZABLE"]).some((e) => e.FREEZABLE.frozen)).toBe(
    true
  );
  expect(world.getEntities(["IMMERSIBLE"]).some((e) => e.IMMERSIBLE.deep)).toBe(
    true
  );
  expect(
    world.getEntities(["IMMERSIBLE"]).some((e) => !e.IMMERSIBLE.deep)
  ).toBe(true);
  expect(world.getEntities(["TEMPO"]).some((e) => e.TEMPO.amount > 0)).toBe(
    true
  );
  expect(world.getEntities(["TEMPO"]).some((e) => e.TEMPO.amount < 0)).toBe(
    true
  );
  for (const resource of ["beach", "sand", "path", "rubble"])
    expect(
      world
        .getEntities(["HARVESTABLE"])
        .some((e) => e.HARVESTABLE.resource === resource)
    ).toBe(true);
});

test("the native pathfinder reaches the maze Apple and its exit", () => {
  const world = createPreviewWorld("movement");
  const hero = assertHero(world);
  for (const goal of movementGoals) {
    const path = findPath(
      world.metadata.gameEntity.LEVEL.walkable,
      hero.POSITION,
      goal,
      true,
      true
    );
    expect(path[path.length - 1]).toEqual(goal);
    for (const next of path)
      walk(world, relativeOrientations(world, hero.POSITION, next)[0]);
    expect(hero.POSITION).toEqual(goal);
  }
  expect(hero.POSITION).toEqual({ x: 14, y: 1 });
});

test("the Chat scene opens the native input ready for commands", () => {
  const world = createPreviewWorld("chat");
  const hero = assertHero(world);
  const popup = world.assertByIdAndComponents(hero.PLAYER!.popup, [POPUP]);
  expect(getTab(world, popup)).toBe("chat");
});

it("gives renderer clients one playable arena with spell and crafting controls", () => {
  const world = createPreviewWorld("clients", "terminal");
  const hero = world.assertComponents(assertHero(world), [EQUIPPABLE, PLAYER]);
  const spell = world.assertByIdAndComponents(hero[EQUIPPABLE].spell!, [ITEM]);
  expect(spell[ITEM].spell).toBe("wave");
  expect(world.metadata.gameEntity.LEVEL.size).toBeGreaterThanOrEqual(65);
  advance(world, 500);
  walk(world, "right", 2);
  trigger(world, "spell");
  advanceUntil(world, () => world.getEntities([CASTABLE]).length > 0);
  walk(world, "up", 1);
  trigger(world, "interact");
  advanceUntil(world, () => !!hero[PLAYER].popup);
  expect(
    world.assertByIdAndComponents(hero[PLAYER].popup, [POPUP])[POPUP].tabs
  ).toContain("craft");
});

it("builds matching terrain, visibility and loot for the compact renderer comparison", () => {
  const world = createPreviewWorld("comparison");
  const hero = assertHero(world);
  advance(world, 5000);
  const camera = world
    .getEntities(["VIEWABLE", "POSITION"])
    .find((entity) => entity.VIEWABLE.priority === 80)!;
  expect(camera.POSITION).toEqual({ x: 5, y: 3 });
  expect(hero.POSITION).toEqual({ x: 3, y: 3 });
  expect(
    getCellEntities(world, { x: 7, y: 3 }).some(
      (entity) => (entity.LIGHT?.darkness ?? 0) > 0
    )
  ).toBe(true);
  const chest = getCellEntities(world, { x: 4, y: 1 }).find(
    (entity) => entity.ATTACKABLE && entity.INVENTORY
  )!;
  expect(chest).toBeDefined();
  const apple = world
    .getEntities([ITEM])
    .find(
      (entity) => entity.ITEM.stackable === "apple" && entity.ITEM.amount === 4
    )!;
  const drop = world.assertByIdAndComponents(apple[ITEM].carrier, [POSITION]);
  expect(drop[POSITION]).toEqual({ x: 5, y: 1 });
  const size = world.metadata.gameEntity.LEVEL.size;
  for (const [position, visibility] of [
    [{ x: 0, y: 0 }, "visible"],
    [{ x: 0, y: 6 }, "visible"],
    [{ x: 3, y: 1 }, "visible"],
    [{ x: 8, y: 1 }, "fog"],
    [{ x: 10, y: 5 }, "fog"],
    [{ x: 10, y: 6 }, "fog"],
    [{ x: 3, y: 4 }, "visible"],
    [{ x: 3, y: 5 }, "visible"],
    [{ x: 3, y: 6 }, "visible"],
  ] as const) {
    expect({
      [`${position.x},${position.y}`]: world.metadata.visibleCells.has(
        position.x * size + position.y
      ),
    }).toEqual({ [`${position.x},${position.y}`]: visibility === "visible" });
    const cells = getCellEntities(world, position).filter(
      (entity) => entity.FOG
    );
    expect(cells.length).toBeGreaterThan(0);
    for (const entity of cells) {
      const fog = requireComponent(entity, "FOG");
      expect(fog.visibility).toBe(visibility);
      expect(fog.fixed).toBe(false);
    }
  }
  for (const x of [0, 10]) {
    expect(
      getCellEntities(world, { x, y: 4 }).some(
        (entity) => entity.HARVESTABLE?.resource === "beach"
      )
    ).toBe(true);
    expect(
      getCellEntities(world, { x, y: 5 }).some(
        (entity) => entity.IMMERSIBLE?.deep === false
      )
    ).toBe(true);
    expect(
      getCellEntities(world, { x, y: 6 }).some(
        (entity) => entity.IMMERSIBLE?.deep === true
      )
    ).toBe(true);
  }
});
