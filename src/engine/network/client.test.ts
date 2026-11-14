import { connectServer, serverUrl } from "./client";
import { createAreaWorld, assertHero, advance } from "../../testing/harness";
import { createSnapshot } from "../snapshot";
import { encodeState } from "./codec";

class Socket {
  readyState = 0;
  bufferedAmount = 0;
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  onclose?: (event: { code: number }) => void;
  onerror?: () => void;
  messages: any[] = [];
  send(data: string) {
    this.messages.push(JSON.parse(data));
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  receive(message: unknown) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
  close(code = 1000) {
    this.readyState = 3;
    this.onclose?.({ code });
  }
}
const setup = (username?: string) => {
  const sockets: Socket[] = [],
    store = new Map<string, string>();
  const onReady = jest.fn(),
    onStatus = jest.fn();
  const connection = connectServer("localhost:3001", {
    username,
    storage: {
      getItem: (key) => store.get(key) || null,
      setItem: (key, value) => {
        store.set(key, value);
      },
    },
    socket: () => {
      const socket = new Socket();
      sockets.push(socket);
      return socket as unknown as WebSocket;
    },
    onReady,
    onStatus,
  });
  const world = createAreaWorld("|       |\n| ♀     |\n|       |");
  advance(world, 2500);
  const snapshot = createSnapshot(world),
    actorId = world.getEntityId(assertHero(world));
  const state = (socket: Socket, sequence = 1) =>
    socket.receive({
      type: "state",
      actorId,
      state: encodeState({
        sequence,
        serverTime: world.metadata.elapsed,
        snapshot,
      }),
    });
  return { connection, sockets, store, onReady, onStatus, state, actorId };
};
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it("normalizes LAN host addresses and rejects unsupported or credential-bearing URLs", () => {
  expect(serverUrl("192.168.0.2:3001")).toBe("ws://192.168.0.2:3001/");
  expect(serverUrl("https://host/game")).toBe("wss://host/game");
  expect(() => serverUrl("ftp://host")).toThrow();
  expect(() => serverUrl("ws://user:password@host")).toThrow();
});

it("stores reconnect ownership and sends only intents while leaving the confirmed actor untouched", () => {
  const { connection, sockets, store, onReady, state, actorId } = setup();
  const socket = sockets[0];
  socket.open();
  expect(socket.messages[0]).toEqual({ type: "join" });
  socket.receive({ type: "welcome", id: "account", token: "secret" });
  expect(JSON.parse([...store.values()][0])).toEqual({
    id: "account",
    token: "secret",
  });
  state(socket);
  expect(onReady).toHaveBeenCalledWith(connection.world);
  const hero = connection.world.assertById(actorId),
    before = createSnapshot(connection.world);
  connection.move(["right"]);
  connection.action({ kind: "spell" });
  expect(socket.messages.slice(-2)).toEqual([
    { type: "input", input: { sequence: 0, move: ["right"] } },
    {
      type: "input",
      input: { sequence: 1, move: ["right"], action: { kind: "spell" } },
    },
  ]);
  expect(createSnapshot(connection.world)).toEqual(before);
  expect(hero.POSITION).toEqual({ x: 1, y: 1 });
  connection.close();
});

it("drops held input and never replays actions across reconnection", () => {
  const { connection, sockets, onReady, state } = setup();
  sockets[0].open();
  sockets[0].receive({ type: "welcome", id: "account", token: "secret" });
  state(sockets[0], 20);
  connection.move(["up"]);
  connection.action({ kind: "skill" });
  sockets[0].close(1006);
  connection.action({ kind: "spell" });
  jest.advanceTimersByTime(250);
  const next = sockets[1];
  next.open();
  expect(next.messages[0]).toEqual({
    type: "join",
    id: "account",
    token: "secret",
  });
  next.receive({ type: "welcome", id: "account" });
  state(next, 1);
  expect(onReady).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(250);
  const inputs = next.messages.filter((message) => message.type === "input");
  expect(inputs).toHaveLength(1);
  expect(inputs[0].input.move).toEqual([]);
  expect(inputs[0].input.action).toBeUndefined();
  connection.close();
});

it("stops reconnecting when a claim is rejected and stops sending actions while paused", () => {
  const { connection, sockets, state, onStatus } = setup();
  const socket = sockets[0];
  socket.open();
  socket.receive({ type: "welcome", id: "account", token: "secret" });
  state(socket);
  connection.pause(true);
  const count = socket.messages.length;
  connection.move(["left"]);
  connection.action({ kind: "interact" });
  expect(socket.messages).toHaveLength(count);
  socket.close(1008);
  jest.advanceTimersByTime(10000);
  expect(sockets).toHaveLength(1);
  expect(onStatus).toHaveBeenLastCalledWith("rejected");
  connection.close();
});

it("acknowledges a full state only after applying its confirmed actor", () => {
  const { connection, sockets, state, actorId } = setup();
  const socket = sockets[0];
  socket.open();
  socket.receive({ type: "welcome", id: "account", token: "secret" });
  state(socket, 7);
  expect(connection.world.getEntityById(actorId)).toBeDefined();
  expect(socket.messages).toContainEqual({ type: "stateAck", sequence: 7 });
  connection.close();
});

it("forwards a requested username separately from reconnect credentials", () => {
  const { connection, sockets } = setup("Alice");
  sockets[0].open();
  expect(sockets[0].messages[0]).toEqual({ type: "join", username: "Alice" });
  connection.close();
});
