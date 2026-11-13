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
