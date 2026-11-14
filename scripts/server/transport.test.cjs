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
    export {createReplica} from "./src/engine/network/replica";
    export {encodeState,decodeState} from "./src/engine/network/codec";
    export {giveItems} from "./src/testing/harness";
    export {submitChat} from "./src/engine/systems/popup";`,
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

let playerNumber = 0;
const connect = (url, claim = {}, acknowledge = true) => {
  const socket = new WebSocket(url);
  const messages = [],
    waiting = [];
  const closed = new Promise((resolve) =>
    socket.once("close", (code) => resolve(code))
  );
  socket.on("error", () => {});
  socket.on("open", () =>
    socket.send(
      JSON.stringify({
        type: "join",
        username: `Player${++playerNumber}`,
        ...claim,
      })
    )
  );
  socket.on("message", (bytes) => {
    const message = JSON.parse(bytes.toString());
    if (message.type === "state" && acknowledge) {
      const frame = engine.decodeState(message.state);
      socket.send(
        JSON.stringify({ type: "stateAck", sequence: frame.sequence })
      );
    }
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

test("only the authenticated owner can replace an active connection", async () => {
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
    const resumed = await duplicate.next("welcome");
    assert.equal(resumed.actorId, claim.actorId);
    assert.equal(await first.closed, 1008);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(duplicate.socket.readyState, WebSocket.OPEN);
    assert.equal(
      server.simulation.world.getEntityById(claim.actorId).PLAYER.connected,
      true
    );
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

test("a reloaded authenticated client can restart input numbering at zero", async () => {
  const server = await start(path.join(directory, "reload.bin"));
  try {
    const first = connect(url(server));
    const claim = await first.next("welcome");
    first.send({ type: "input", input: { sequence: 500, move: ["right"] } });
    await first.next("ack");
    first.socket.close();
    await first.closed;
    const next = connect(url(server), { id: claim.id, token: claim.token });
    await next.next("welcome");
    next.send({ type: "input", input: { sequence: 0, move: ["left"] } });
    assert.equal((await next.next("ack")).sequence, 0);
  } finally {
    await server.close();
  }
});

test("an owner reconnects at capacity without allowing a ninth active player", async () => {
  const server = await start(path.join(directory, "capacity.bin"));
  try {
    const players = [];
    for (let index = 0; index < 8; index++) {
      const client = connect(url(server));
      players.push({ client, claim: await client.next("welcome") });
    }
    const excess = connect(url(server));
    assert.equal(await excess.closed, 1013);
    const { client, claim } = players[0];
    const resumed = connect(url(server), { id: claim.id, token: claim.token });
    assert.equal((await resumed.next("welcome")).actorId, claim.actorId);
    assert.equal(await client.closed, 1008);
    assert.equal(server.simulation.world.getEntities(["PLAYER"]).length, 8);
  } finally {
    await server.close();
  }
});

test("a stalled client receives one full state and catches up directly after acknowledging it", async () => {
  const server = await start(path.join(directory, "flow-control.bin"));
  try {
    const slow = connect(url(server), {}, false);
    let states = 0;
    slow.socket.on("message", (bytes) => {
      if (JSON.parse(bytes.toString()).type === "state") states++;
    });
    const welcome = await slow.next("welcome");
    const first = engine.decodeState((await slow.next("state")).state);
    const replica = engine.createReplica();
    replica.world.metadata.localPlayerId = welcome.actorId;
    replica.receive(first);
    const actor = replica.world.getEntityById(welcome.actorId);
    const sprite = actor.SPRITE;
    slow.send({ type: "input", input: { sequence: 0, move: ["right"] } });
    await slow.next("ack");
    for (let step = 0; step < 30; step++) server.simulation.step();
    const world = server.simulation.worldFor(welcome.id);
    const authoritative = world.getEntityById(welcome.actorId);
    world.removeComponentFromEntity(authoritative, "TOOLTIP", false);
    for (let publish = 0; publish < 50; publish++) server.publish();
    slow.send({ type: "heartbeat" });
    await slow.next("pong");
    assert.equal(states, 1);
    slow.send({ type: "stateAck", sequence: first.sequence + 1000 });
    slow.send({ type: "heartbeat" });
    await slow.next("pong");
    server.publish();
    slow.send({ type: "heartbeat" });
    await slow.next("pong");
    assert.equal(states, 1);
    slow.send({ type: "stateAck", sequence: first.sequence });
    slow.send({ type: "heartbeat" });
    await slow.next("pong");
    server.publish();
    const current = engine.decodeState((await slow.next("state")).state);
    assert.equal(current.serverTime, server.simulation.serverTime);
    assert.equal(states, 2);
    assert.ok(Array.isArray(current.removed));
    assert.ok(
      current.snapshot.entities.length < first.snapshot.entities.length
    );
    assert.equal(replica.receive(current), true);
    assert.equal(replica.world.getEntityById(welcome.actorId), actor);
    assert.equal(actor.SPRITE, sprite);
    assert.deepEqual(actor.POSITION, authoritative.POSITION);
    assert.equal(actor.TOOLTIP, undefined);
  } finally {
    await server.close();
  }
});

test("unnamed players must choose a unique name; returning credentials restore it", async () => {
  const file = path.join(directory, "names.bin");
  const server = await start(file);
  try {
    const first = connect(url(server), { username: undefined });
    const claim = await first.next("welcome");
    const world = server.simulation.worldFor(claim.id);
    const hero = world.getEntityById(claim.actorId);
    assert.equal(hero.PLAYER.naming, true);
    assert.equal(
      server.simulation.receive(claim.id, { sequence: 0, move: ["right"] }),
      false
    );
    assert.equal(
      server.simulation.receive(claim.id, {
        sequence: 1,
        action: { kind: "close" },
      }),
      false
    );
    assert.equal(world.metadata.chooseUsername(claim.id, "Alice"), undefined);
    assert.equal(hero.PLAYER.naming, false);
    assert.equal(hero.PLAYER.username, "Alice");
    const duplicate = connect(url(server), { username: "aLiCe" });
    const duplicateClaim = await duplicate.next("welcome");
    const other = server.simulation
      .worldFor(duplicateClaim.id)
      .getEntityById(duplicateClaim.actorId);
    assert.equal(other.PLAYER.naming, true);
    assert.equal(other.PLAYER.nameError, "Name already used!");
    const resumed = connect(url(server), {
      id: claim.id,
      token: claim.token,
      username: "Other",
    });
    const welcome = await resumed.next("welcome");
    assert.equal(welcome.username, "Alice");
    assert.equal(welcome.actorId, claim.actorId);
    assert.equal(await first.closed, 1008);
    await server.save();
    const { createPersistence } = require("./persistence.cjs");
    const saved = await createPersistence(file).load();
    assert.equal(
      saved.accounts.find((account) => account.id === claim.id).username,
      "Alice"
    );
  } finally {
    await server.close();
  }
});

test("startup admins can manage players through authoritative commands and restart with saved bans", async () => {
  const file = path.join(directory, "admin-live.bin");
  let server = await start(file);
  let alice, bob;
  try {
    const first = connect(url(server), { username: "Alice" });
    const second = connect(url(server), { username: "Bob" });
    alice = await first.next("welcome");
    bob = await second.next("welcome");
  } finally {
    await server.close();
  }
  server = await createGameServer({
    engine,
    file,
    manual: true,
    adminIds: [alice.id],
  });
  try {
    const first = connect(url(server), { id: alice.id, token: alice.token });
    const second = connect(url(server), { id: bob.id, token: bob.token });
    await first.next("welcome");
    await second.next("welcome");
    const world = server.simulation.worldFor(alice.id);
    const hero = world.getEntityById(server.simulation.actorId(alice.id));
    const other = world.getEntityById(server.simulation.actorId(bob.id));
    assert.equal(hero.PLAYER.admin, true);
    assert.equal(other.PLAYER.admin, false);
    assert.equal(
      world.metadata.serverCommand(bob.id, ["ban", "Alice"]),
      "Commands disabled!"
    );
    const command = async (...args) => {
      engine.submitChat(world, hero, "/server " + args.join(" "));
      server.step();
      await new Promise((resolve) => setTimeout(resolve, 30));
    };
    await command("players");
    assert.equal(hero.PLAYER.popup, hero.PLAYER.interface.server);
    assert.notEqual(hero.PLAYER.interface.server, other.PLAYER.popup);
    await command("admin", "Bob", "on");
    assert.equal(other.PLAYER.admin, true);
    await command("ban", "Bob");
    assert.equal(await second.closed, 1008);
    assert.equal(server.simulation.actorId(bob.id), undefined);
    const banned = connect(url(server), { id: bob.id, token: bob.token });
    assert.equal(await banned.closed, 1008);
    const previous = server.simulation;
    await command("restart");
    assert.equal(await first.closed, 1012);
    for (
      let attempt = 0;
      server.simulation === previous && attempt < 200;
      attempt++
    )
      await new Promise((resolve) => setTimeout(resolve, 10));
    assert.notEqual(server.simulation, previous);
    const resumed = connect(url(server), { id: alice.id, token: alice.token });
    await resumed.next("welcome");
    const restarted = server.simulation.worldFor(alice.id);
    assert.equal(
      restarted.getEntityById(server.simulation.actorId(alice.id)).PLAYER.admin,
      true
    );
    assert.equal(
      restarted.metadata.gameEntity.LEVEL.serverPlayers.find(
        (p) => p.id === bob.id
      ).status,
      "banned"
    );
    restarted.metadata.serverCommand(alice.id, ["unban", "Bob"]);
    server.step();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const fresh = connect(url(server), { id: bob.id, token: bob.token });
    const welcome = await fresh.next("welcome");
    assert.equal(welcome.username, "Bob");
    assert.notEqual(welcome.actorId, bob.actorId);
    const newHero = server.simulation
      .worldFor(bob.id)
      .getEntityById(welcome.actorId);
    assert.equal(newHero.PLAYER.admin, false);
    assert.equal(newHero.PLAYER.naming, undefined);
  } finally {
    await server.close();
  }
});
