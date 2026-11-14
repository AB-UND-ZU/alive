import {
  advance,
  assertHero,
  createAreaWorld,
  walk,
} from "../../testing/harness";
import { createSnapshot } from "../snapshot";
import { createReplica } from "./replica";
import {
  getRenderedPosition,
  getMotion,
  sampleMotion,
  getBumpMotion,
} from "../motion";

const setup = () => {
  const server = createAreaWorld("|         |\n| ♀    █  |\n|         |", {
    size: 32,
  });
  advance(server, 2500);
  const id = server.getEntityId(assertHero(server));
  const replica = createReplica();
  replica.world.metadata.localPlayerId = id;
  const send = (sequence: number, inputSequence = -1) =>
    replica.receive({
      sequence,
      inputSequence,
      serverTime: server.metadata.elapsed,
      snapshot: createSnapshot(server),
      cells: server.metadata.gameEntity.LEVEL.initialized.flatMap((column, x) =>
        column.flatMap((known, y) => (known ? [x * 32 + y] : []))
      ),
    });
  send(1);
  return {
    server,
    replica,
    send,
    actor: replica.world.assertByIdAndComponents(id, [
      "POSITION",
      "STATS",
      "ACTIONABLE",
    ]),
  };
};

it("starts movement visually before the server responds and accepts confirmation without moving twice", () => {
  const { server, replica, send, actor } = setup();
  const before = createSnapshot(replica.world);
  replica.prediction.move(["right"], 10);
  expect(getRenderedPosition(actor)).toEqual({ x: 2, y: 1 });
  expect(createSnapshot(replica.world)).toEqual(before);
  replica.render(60);
  expect(
    sampleMotion(getMotion(actor)!, replica.world.metadata.renderTime).x
  ).toBeGreaterThan(1);
  expect(actor.POSITION).toEqual({ x: 1, y: 1 });
  walk(server, "right", 1);
  send(2, 10);
  expect(actor.POSITION).toEqual({ x: 2, y: 1 });
  expect(getMotion(actor)!.x).toBe(2);
});

it("corrects a rejected movement and never predicts beyond one unconfirmed cell during a stall", () => {
  const { server, replica, send, actor } = setup();
  replica.prediction.move(["right"], 10);
  replica.render(5000);
  expect(actor.POSITION).toEqual({ x: 1, y: 1 });
  expect(getRenderedPosition(actor)).toEqual({ x: 2, y: 1 });
  advance(server, 1500);
  send(2, 10);
  expect(getRenderedPosition(actor)).toEqual(actor.POSITION);
  expect(getMotion(actor)!.x).toBe(1);
});

it("does not predict into unknown cells or through known walls", () => {
  const { replica, actor } = setup();
  replica.world.metadata.gameEntity.LEVEL.initialized[2][1] = false;
  replica.prediction.move(["right"], 1);
  expect(getRenderedPosition(actor)).toEqual(actor.POSITION);
  replica.world.metadata.gameEntity.LEVEL.initialized[2][1] = true;
  actor.POSITION.x = 5;
  replica.prediction.move(["right"], 2);
  expect(getRenderedPosition(actor)).toEqual(actor.POSITION);
});

it("clears speculative movement on pause and previews an available action without spending stats or changing gameplay", () => {
  const { replica, actor } = setup();
  replica.prediction.move(["right"], 1);
  replica.prediction.clear();
  expect(getRenderedPosition(actor)).toEqual(actor.POSITION);
  actor.PLAYER!.mount = 123;
  replica.prediction.move(["right"], 2);
  expect(getRenderedPosition(actor)).toEqual(actor.POSITION);
  actor.PLAYER!.mount = undefined;
  actor.ACTIONABLE.spell = 123;
  const before = createSnapshot(replica.world);
  replica.prediction.action("spell");
  expect(getBumpMotion(actor)).toBeDefined();
  expect(createSnapshot(replica.world)).toEqual(before);
});
