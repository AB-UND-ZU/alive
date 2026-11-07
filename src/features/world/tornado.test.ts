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
import { registerEntity } from "../../engine/systems/map";
import { createSequence } from "../../engine/systems/sequence";
import { none } from "../../game/assets/sprites";
import { copy } from "../../game/math/std";
import { advance, createAreaWorld } from "../../testing/harness";
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

    advance(world, 3000);

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

  it("stays calm without a radius", () => {
    const world = createAreaWorld(area, { size: 24 });
    const hero = assertUnit(world);
    const start = { ...hero[POSITION] };
    addTornado(world, { x: start.x + 1, y: start.y }, 0);

    advance(world, 3000);

    expect(hero[POSITION]).toEqual(start);
    expect(world.getEntities([EXERTABLE])).toHaveLength(0);
  });
});
