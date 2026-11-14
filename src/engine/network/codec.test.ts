import { POSITION } from "../components/position";
import { SPAWNABLE } from "../components/spawnable";
import { STATS } from "../components/stats";
import { VIEWABLE } from "../components/viewable";
import { decodeState, encodeState } from "./codec";
import { createSnapshot, restoreSnapshot, WorldSnapshot } from "../snapshot";
import { createSystems, preloadLevel } from "../ecs";
import {
  advance,
  assertHero,
  createAreaWorld,
  walk,
} from "../../testing/harness";

it("preserves special numbers, shared objects, undefined and cycles", () => {
  const shared = { value: Infinity };
  const source: any = {
    left: shared,
    right: shared,
    missing: undefined,
    values: [-Infinity, NaN, -0],
  };
  source.self = source;
  const wire = JSON.parse(JSON.stringify({ state: encodeState(source) }));
  const result = decodeState<typeof source>(wire.state);
  expect(result).toEqual(source);
  expect(result.left).toBe(result.right);
  expect(result.self).toBe(result);
  expect(Object.is(result.values[2], -0)).toBe(true);
});

it("serializes a real world that can resume movement with identical IDs and component data", () => {
  const world = createAreaWorld("|        |\n| ♀      |\n|        |");
  advance(world, 2500);
  const original = assertHero(world);
  const decoded = decodeState<WorldSnapshot>(
    encodeState(createSnapshot(world))
  );
  const restored = restoreSnapshot(decoded);
  const hero = restored.assertComponents(assertHero(restored), [
    SPAWNABLE,
    STATS,
    VIEWABLE,
    POSITION,
  ]);
  expect(restored.getEntityId(hero)).toBe(world.getEntityId(original));
  expect(hero.SPAWNABLE.viewable).toEqual(original.SPAWNABLE!.viewable);
  expect(hero.VIEWABLE).toEqual(original.VIEWABLE);
  expect(hero.STATS.maxXp).toBe(Infinity);
  createSystems(restored);
  preloadLevel(restored);
  const x = hero.POSITION.x;
  walk(restored, "right", 1);
  expect(hero.POSITION.x).toBe(x + 1);
});

it("does not invoke prototype setters when decoding object keys", () => {
  const source = JSON.parse(
    '{"__proto__":{"polluted":true},"constructor":"data"}'
  );
  const restored = decodeState<any>(encodeState(source));
  expect(Object.getPrototypeOf(restored)).toBe(Object.prototype);
  expect(restored.__proto__).toEqual({ polluted: true });
  expect(restored.constructor).toBe("data");
  expect(({} as any).polluted).toBeUndefined();
});

it.each([() => {}, new Map(), new Date()])(
  "rejects unsupported executable or non-plain state",
  (value) => {
    expect(() => encodeState(value)).toThrow();
  }
);
