import { entities, World } from "../../engine";
import { BELONGABLE } from "../../engine/components/belongable";
import { CASTABLE, getEmptyCastable } from "../../engine/components/castable";
import { EXERTABLE } from "../../engine/components/exertable";
import { MOVABLE } from "../../engine/components/movable";
import { ORIENTABLE } from "../../engine/components/orientable";
import { Position, POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import {
  SEQUENCABLE,
  TornadoSequence,
} from "../../engine/components/sequencable";
import { SPRITE } from "../../engine/components/sprite";
import { STATS } from "../../engine/components/stats";
import { collectScene } from "../../renderers/interface/scene";
import { getMotion, sampleMotion } from "../../engine/motion";
import { getLootable } from "../../engine/systems/collect";
import { knockEntity } from "../../engine/systems/damage";
import { getTempo } from "../../engine/systems/movement";
import { moveEntity, registerEntity } from "../../engine/systems/map";
import { createSequence } from "../../engine/systems/sequence";
import { none } from "../../game/assets/sprites";
import { copy } from "../../game/math/std";
import { advance, advanceUntil, countItems, createAreaWorld, holdMove } from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { assertUnit } from "./helpers";

const addTornado = (world: World, position: Position, radius: number) => {
  const tornado = entities.createTornado(world, {
    [BELONGABLE]: { faction: "hostile" },
    [CASTABLE]: {
      ...getEmptyCastable(world, world.metadata.gameEntity),
      reproc: 3,
    },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: { duration: 200 },
      lastInteraction: 0,
      flying: true,
      swimming: false,
    },
    [ORIENTABLE]: {},
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });
  tornado[CASTABLE].caster = world.getEntityId(tornado);
  registerEntity(world, tornado);
  createSequence<"tornado", TornadoSequence>(
    world,
    tornado,
    "tornado",
    "tornadoSpin",
    {
      element: "air",
      position: copy(position),
      radius,
      amount: 2,
      exertables: [],
      gusts: [],
      generation: 0,
    }
  );
  return tornado;
};

const area = `
|                    |
|                    |
|                    |
|        ♀           |
|                    |
|                    |
|                    |
`;

describe("tornado", () => {
  it("sweeps a hero within its ring into its eye without hurting", () => {
    const world = createAreaWorld(area, { size: 24 });
    const hero = assertUnit(world);
    const eye = { x: hero[POSITION].x + 2, y: hero[POSITION].y };
    addTornado(world, eye, 2);

    advance(world, 1000);

    expect(hero[POSITION]).toEqual(eye);

    advance(world, 10000);

    const gusts = playedSounds.filter((sound) => sound === "tornado");
    expect(gusts).toHaveLength(11);
    expect(hero[POSITION]).toEqual(eye);
    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
  });

  it("leaves a hero outside of its ring alone", () => {
    const world = createAreaWorld(area, { size: 24 });
    const hero = assertUnit(world);
    const start = { ...hero[POSITION] };
    addTornado(world, { x: start.x + 6, y: start.y }, 2);

    advance(world, 3000);

    expect(hero[POSITION]).toEqual(start);
  });

  it("renders gusts across both viewport edges and the world seam", () => {
    const world = createAreaWorld(area, { size: 32 });
    const storm = addTornado(world, { x: 29, y: 3 }, 2);
    const viewport = {
      position: { x: 0, y: 3 }, fraction: { x: 0, y: 0 },
      overscan: { x: 0, y: 0 }, columns: 5, rows: 5,
    };
    const copies = () => collectScene(world, viewport, {})
      .filter((entry) => entry[4] === storm).map(([x]) => x);
    expect(copies()).toEqual([-3]);
    moveEntity(world, storm, { x: 2, y: 3 });
    expect(copies()).toEqual([2]);
    moveEntity(world, storm, { x: 4, y: 3 });
    expect(copies()).toEqual([4]);
    moveEntity(world, storm, { x: 14, y: 3 });
    expect(copies()).toEqual([]);
  });

  it("moves a knocked drop at the same speed as an ordinary mob", () => {
    const world = createAreaWorld("| ♀ c     p     |", {
      legend: { c: "coin_one", p: "prism" },
    });
    const drop = getLootable(world, { x: 3, y: 0 })!;
    const mob = world.getEntities(["NPC", POSITION]).find((e) => e.NPC.type === "prism")!;
    for (const entity of [drop, mob]) knockEntity(world, entity, "right", 2);
    for (const elapsed of [0, 100, 200]) {
      const distance = (entity: typeof drop | typeof mob) => {
        const motion = getMotion(entity)!;
        return sampleMotion(motion, world.metadata.elapsed + elapsed).x - motion.fromX;
      };
      expect(distance(drop)).toBeCloseTo(distance(mob));
    }
  });

  it.each(["coin_one", "fish"] as const)("leaves %s on a water cell during knock", (kind) => {
    const world = createAreaWorld("| ♀ d ~     |", {
      legend: { d: kind, "~": "water_shallow" },
    });
    const position = { x: 5, y: 0 };
    const drop = getLootable(world, { x: 3, y: 0 })!;
    moveEntity(world, drop, position, false);
    knockEntity(world, drop, "right", 2);
    expect(drop.POSITION).toEqual(position);
    expect(getMotion(drop)).toBeUndefined();
  });

  it("moves its slow interior with the eye and leaves the knock ring at normal speed", () => {
    const world = createAreaWorld(area, { size: 24 });
    const eye = { x: 3, y: 3 };
    const storm = addTornado(world, eye, 2);
    advance(world, 100);
    expect(getTempo(world, eye)).toBe(-4);
    expect(getTempo(world, { x: 4, y: 4 })).toBe(-4);
    expect(getTempo(world, { x: 5, y: 3 })).toBe(0);
    moveEntity(world, storm, { x: 7, y: 3 });
    advance(world, 100);
    expect(getTempo(world, eye)).toBe(0);
    expect(getTempo(world, storm[POSITION])).toBe(-4);
  });

  it("sweeps loose items into its eye", () => {
    const world = createAreaWorld("| ♀    c      |", { legend: { c: "coin_one" }, size: 24 });
    const drop = getLootable(world, { x: 6, y: 0 })!;
    const eye = { x: 8, y: 0 };
    addTornado(world, eye, 2);
    advance(world, 1000);
    expect(getLootable(world, eye)).toBe(drop);
    expect(getMotion(drop)).toMatchObject({ fromX: 6, x: 8 });
    expect(drop.AFFECTABLE).toBeUndefined();
  });

  it.each([false, true])("picks up a loose coin after knock=%s", (knocked) => {
    const world = createAreaWorld("| ♀ c    |", { legend: { c: "coin_one" } });
    const hero = assertUnit(world);
    const drop = getLootable(world, { x: 3, y: 0 })!;
    if (knocked) knockEntity(world, drop, "right", 1);
    const position = { ...drop[POSITION] };
    const amount = countItems(world, hero, { stackable: "coin" });
    holdMove(world, ["right"]);
    advanceUntil(world, () => countItems(world, hero, { stackable: "coin" }) === amount + 1, 4000);
    expect(getLootable(world, position)).toBeUndefined();
  });

  it("stays calm without a radius", () => {
    const world = createAreaWorld(area, { size: 24 });
    const hero = assertUnit(world);
    const start = { ...hero[POSITION] };
    addTornado(world, { x: start.x + 1, y: start.y }, 0);

    advance(world, 3000);

    expect(hero[POSITION]).toEqual(start);
    expect(world.getEntities([EXERTABLE])).toHaveLength(0);
    expect(playedSounds).not.toContain("tornado");
  });
});
