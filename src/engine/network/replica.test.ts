import { getMotion, sampleMotion, getCameraMotion } from "../motion";
import { createReplica } from "./replica";
import { createSnapshot } from "../snapshot";
import { ACTIONABLE } from "../components/actionable";
import { POSITION } from "../components/position";
import { PLAYER } from "../components/player";
import { SPRITE } from "../components/sprite";
import {
  advance,
  assertHero,
  createAreaWorld,
  holdMove,
  walk,
} from "../../testing/harness";

const setup = () => {
  const server = createAreaWorld("|          |\n| ♀        |\n|          |");
  advance(server, 2500);
  const replica = createReplica();
  const send = (sequence: number) =>
    replica.receive({
      sequence,
      serverTime: server.metadata.elapsed,
      snapshot: createSnapshot(server),
    });
  send(0);
  return { server, replica, send };
};

it("applies state in place without replacing actor references or local ownership", () => {
  const { server, replica, send } = setup();
  const actor = assertHero(replica.world);
  replica.world.metadata.localPlayerId = replica.world.getEntityId(actor);
  const listener = jest.fn();
  replica.world.metadata.listeners[1] = listener;
  walk(server, "right", 1);
  send(1);
  expect(assertHero(replica.world)).toBe(actor);
  expect(actor[POSITION]).toEqual(assertHero(server)[POSITION]);
  expect(replica.world.metadata.localPlayerId).toBe(
    server.getEntityId(assertHero(server))
  );
  expect(listener).toHaveBeenCalledWith(true);
});

it("rejects old snapshots and server clock rollback", () => {
  const { server, replica, send } = setup();
  const old = createSnapshot(server);
  walk(server, "right", 1);
  send(2);
  const confirmed = { ...assertHero(replica.world)[POSITION] };
  expect(
    replica.receive({
      sequence: 1,
      serverTime: server.metadata.elapsed,
      snapshot: old,
    })
  ).toBe(false);
  expect(replica.receive({ sequence: 3, serverTime: 0, snapshot: old })).toBe(
    false
  );
  expect(assertHero(replica.world)[POSITION]).toEqual(confirmed);
});

it("cannot simulate movement or abilities while disconnected", () => {
  const { server, replica } = setup();
  const actor = replica.world.assertComponents(assertHero(replica.world), [
    POSITION,
    ACTIONABLE,
  ]);
  const confirmed = { ...actor[POSITION] };
  actor[ACTIONABLE].spellTriggered = true;
  holdMove(replica.world, ["right"]);
  advance(replica.world, 1000);
  expect(actor[POSITION]).toEqual(confirmed);
  expect(assertHero(server)[POSITION]).toEqual(confirmed);
  expect(actor[ACTIONABLE].spellTriggered).toBe(true);
});

it("removes stale components and entities while resolving shared entity references", () => {
  const { server, replica, send } = setup();
  const actor = assertHero(server);
  const id = server.getEntityId(actor);
  server.removeComponentFromEntity(
    server.assertComponents(actor, [SPRITE]),
    SPRITE,
    false
  );
  send(1);
  expect(
    replica.world.getEntityByIdAndComponents(id, [SPRITE])
  ).toBeUndefined();
  server.removeEntity(actor, false);
  send(2);
  expect(replica.world.getEntities([PLAYER])).toHaveLength(0);
});

it("advances only presentation time and finishes confirmed movement during a stall", () => {
  const { server, replica, send } = setup();
  walk(server, "right", 1);
  send(1);
  const actor = assertHero(replica.world),
    confirmed = { ...actor[POSITION] };
  const elapsed = replica.world.metadata.elapsed;
  replica.render(60);
  expect(replica.world.metadata.renderTime).toBe(elapsed + 60);
  replica.render(10000);
  expect(replica.world.metadata.renderTime).toBe(elapsed + 1000);
  expect(replica.world.metadata.elapsed).toBe(elapsed);
  expect(actor[POSITION]).toEqual(confirmed);
  expect(assertHero(server)[POSITION]).toEqual(confirmed);
});

it("animates confirmed positions locally without receiving server motion models", () => {
  const { server, replica, send } = setup();
  const actor = assertHero(replica.world);
  const before = { ...actor[POSITION] };
  walk(server, "right", 1);
  send(1);
  const motion = getMotion(actor)!;
  const start = sampleMotion(motion, replica.world.metadata.renderTime);
  expect(start.x).toBeCloseTo(before.x);
  expect(actor[POSITION]).toEqual(assertHero(server)[POSITION]);
  replica.render(60);
  const middle = sampleMotion(motion, replica.world.metadata.renderTime);
  expect(middle.x).toBeGreaterThan(start.x);
  expect(middle.x).toBeLessThan(actor[POSITION].x);
  replica.render(1000);
  expect(sampleMotion(motion, replica.world.metadata.renderTime).x).toBeCloseTo(
    actor[POSITION].x
  );
});

it("drops old presentation clocks when an authenticated connection starts a new snapshot epoch", () => {
  const { server, replica, send } = setup();
  walk(server, "right", 1);
  send(1);
  replica.render(1000);
  const actor = assertHero(replica.world);
  expect(getMotion(actor)).toBeDefined();
  replica.resetOrdering();
  expect(getMotion(actor)).toBeUndefined();
  expect(
    replica.receive({
      sequence: 0,
      serverTime: 10,
      snapshot: createSnapshot(server),
    })
  ).toBe(true);
  expect(getMotion(actor)).toBeUndefined();
  expect(getCameraMotion(replica.world)).toMatchObject({
    x: actor[POSITION].x,
    y: actor[POSITION].y,
  });
});

it("patches changed components without replacing or deleting untouched world state", () => {
  const { server, replica } = setup();
  const hero = assertHero(server),
    id = server.getEntityId(hero);
  const actor = replica.world.assertById(id),
    sprite = actor.SPRITE,
    level = replica.world.metadata.gameEntity.LEVEL;
  const snapshot = createSnapshot(server);
  expect(
    replica.receive({
      sequence: 1,
      serverTime: server.metadata.elapsed,
      removed: [],
      removedComponents: [[id, ["TOOLTIP"]]],
      snapshot: { ...snapshot, entities: [[id, { POSITION: { x: 5, y: 1 } }]] },
    })
  ).toBe(true);
  expect(actor.POSITION).toEqual({ x: 5, y: 1 });
  expect(actor.SPRITE).toBe(sprite);
  expect(actor.TOOLTIP).toBeUndefined();
  expect(replica.world.metadata.gameEntity.LEVEL).toBe(level);
  expect(replica.world.getEntityById(id)).toBe(actor);
  expect(replica.world.metadata.gameEntity.LEVEL.map[5][1][id]).toBe(actor);
  replica.receive({
    sequence: 2,
    serverTime: server.metadata.elapsed,
    removed: [id],
    snapshot: { ...snapshot, entities: [] },
  });
  expect(replica.world.getEntityById(id)).toBeUndefined();
});
