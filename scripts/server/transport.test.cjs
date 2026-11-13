const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { WebSocket } = require("ws");
const { buildServer } = require("./build.cjs");
const { createGameServer } = require("./transport.cjs");
let directory, engine;
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "alive-transport-"));
  const outfile = path.join(directory, "engine.cjs");
  await buildServer({
    stdin: {
      contents: `export {createHost} from "./src/engine/network/host";
    export {encodeState,decodeState} from "./src/engine/network/codec";
    export {giveItems} from "./src/testing/harness";`,
      resolveDir: process.cwd(),
      loader: "ts",
    },
    outfile,
  });
  engine = require(outfile);
});
after(async () => {
  await rm(directory, { recursive: true, force: true });
});

const connect = (url, claim = {}) => {
  const socket = new WebSocket(url);
  const messages = [],
    waiting = [];
  const closed = new Promise((resolve) =>
    socket.once("close", (code) => resolve(code))
  );
  socket.on("error", () => {});
  socket.on("open", () =>
    socket.send(JSON.stringify({ type: "join", ...claim }))
  );
  socket.on("message", (bytes) => {
    const message = JSON.parse(bytes.toString());
    const index = waiting.findIndex((waiter) => waiter.type === message.type);
    if (index < 0) messages.push(message);
    else {
      const [waiter] = waiting.splice(index, 1);
      clearTimeout(waiter.timer);
      waiter.resolve(message);
    }
  });
  const next = (type) => {
    const index = messages.findIndex((message) => message.type === type);
    if (index >= 0) return Promise.resolve(messages.splice(index, 1)[0]);
    return new Promise((resolve, reject) => {
      const waiter = { type, resolve, timer: undefined };
      waiter.timer = setTimeout(() => {
        waiting.splice(waiting.indexOf(waiter), 1);
        reject(new Error(`Missing ${type} message`));
      }, 5000);
      waiting.push(waiter);
    });
  };
  return {
    socket,
    closed,
    next,
    send: (message) => socket.send(JSON.stringify(message)),
  };
};
const start = (file) => createGameServer({ engine, file, manual: true });
const url = (server) => `ws://127.0.0.1:${server.address.port}`;

test("real sockets enqueue bounded intents; only server ticks cast and ownership cannot be forged", async () => {
  const server = await start(path.join(directory, "authority.bin"));
  try {
    const first = connect(url(server)),
      second = connect(url(server));
    const a = await first.next("welcome"),
      b = await second.next("welcome");
    await first.next("state");
    await second.next("state");
    assert.notEqual(a.id, b.id);
    assert.notEqual(a.actorId, b.actorId);
    const world = server.simulation.world;
    const hero = world.getEntityById(a.actorId);
    engine.giveItems(world, hero, [
      { spell: "wave", material: "wood", amount: 1 },
    ]);
    hero.STATS.mp = 5;
    hero.STATS.maxMp = 5;
    const now = world.metadata.elapsed;
    for (let sequence = 0; sequence < 100; sequence++)
      first.send({
        type: "input",
        input: { sequence, action: { kind: "spell" } },
      });
    for (let sequence = 0; sequence < 100; sequence++) await first.next("ack");
    assert.equal(world.metadata.elapsed, now);
    assert.equal(hero.STATS.mp, 5);
    for (let index = 0; index < 15; index++) server.simulation.step();
    assert.equal(hero.STATS.mp, 4);
    const other = world.getEntityById(b.actorId);
    const before = { ...other.POSITION };
    first.send({
      type: "input",
      input: { sequence: 100, playerId: b.actorId, move: ["right"] },
    });
    first.send({ type: "input", input: { sequence: 101, move: [] } });
    await first.next("ack");
    for (let index = 0; index < 15; index++) server.simulation.step();
    assert.deepEqual(other.POSITION, before);
    server.publish();
    let frame;
    do {
      frame = engine.decodeState((await first.next("state")).state);
    } while (frame.serverTime < world.metadata.elapsed);
    assert.ok(frame.snapshot.entities.length > 0);
    assert.equal(frame.serverTime, world.metadata.elapsed);
  } finally {
    await server.close();
  }
});

test("another account cannot claim an active or persisted player", async () => {
  const server = await start(path.join(directory, "claims.bin"));
  try {
    const first = connect(url(server));
    const claim = await first.next("welcome");
    const intruder = connect(url(server), {
      id: claim.id,
      token: "x".repeat(43),
    });
    assert.equal(await intruder.closed, 1008);
    const duplicate = connect(url(server), {
      id: claim.id,
      token: claim.token,
    });
    assert.equal(await duplicate.closed, 1008);
    assert.equal(first.socket.readyState, WebSocket.OPEN);
    assert.equal(server.simulation.actorId(claim.id), claim.actorId);
  } finally {
    await server.close();
  }
});

test("reconnection after a server restart resumes the same owned actor", async () => {
  const file = path.join(directory, "restart.bin");
  let server = await start(file);
  let claim;
  try {
    const first = connect(url(server));
    claim = await first.next("welcome");
    const actor = server.simulation.world.getEntityById(claim.actorId);
    actor.STATS.xp = 17;
  } finally {
    await server.close();
  }
  server = await start(file);
  try {
    const resumed = connect(url(server), { id: claim.id, token: claim.token });
    const welcome = await resumed.next("welcome");
    assert.equal(welcome.actorId, claim.actorId);
    assert.equal(welcome.token, undefined);
    assert.equal(
      server.simulation.world.getEntityById(welcome.actorId).STATS.xp,
      17
    );
  } finally {
    await server.close();
  }
});

test("pausing one socket releases only its own input and does not pause the shared clock", async () => {
  const server = await start(path.join(directory, "pause.bin"));
  try {
    const first = connect(url(server)),
      second = connect(url(server));
    const a = await first.next("welcome"),
      b = await second.next("welcome");
    first.send({ type: "pause", paused: true });
    await first.next("paused");
    second.send({ type: "input", input: { sequence: 0, move: ["right"] } });
    await second.next("ack");
    const world = server.simulation.world;
    const paused = { ...world.getEntityById(a.actorId).POSITION };
    const moving = { ...world.getEntityById(b.actorId).POSITION };
    for (let index = 0; index < 20; index++) server.simulation.step();
    assert.deepEqual(world.getEntityById(a.actorId).POSITION, paused);
    assert.notDeepEqual(world.getEntityById(b.actorId).POSITION, moving);
    assert.ok(world.metadata.elapsed > 0);
  } finally {
    await server.close();
  }
});
