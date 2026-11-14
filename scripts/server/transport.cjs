const { isDeepStrictEqual } = require("node:util");
const { createAdministration } = require("./administration.cjs");
const { WebSocketServer, WebSocket } = require("ws");
const {
  createCredential,
  verifyCredential,
  createPersistence,
} = require("./persistence.cjs");

exports.createGameServer = async ({
  engine,
  file,
  host = "127.0.0.1",
  port = 0,
  manual = false,
  adminIds = [],
  onPlayer,
}) => {
  const persistence = createPersistence(file);
  const saved = await persistence.load();
  if (saved && (!Array.isArray(saved.accounts) || !saved.world))
    throw new Error("Invalid server save");
  let simulation = engine.createHost(saved?.world);
  const accounts = new Map(
    (saved?.accounts || []).map((account) => [account.id, account])
  );
  const clients = new Map();
  const server = new WebSocketServer({
    host,
    port,
    maxPayload: 4096,
    perMessageDeflate: { threshold: 1024 },
  });
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  let closing = false,
    restarting = false;
  const save = () =>
    persistence.save({
      accounts: [...accounts.values()],
      world: simulation.save(),
    });
  const administration = createAdministration({
    accounts,
    clients,
    adminIds,
    simulation: () => simulation,
    save,
    onPlayer,
    restart: async () => {
      restarting = true;
      try {
        for (const [socket, client] of clients) {
          if (client.account) simulation.disconnect(client.account.id);
          client.account = undefined;
          socket.close(1012, "Server restarting");
        }
        await save();
        const data = await persistence.load();
        simulation = engine.createHost(data.world);
        configure();
        administration.reset();
      } finally {
        restarting = false;
      }
    },
  });
  const configure = () =>
    simulation.configure(administration.command, administration.choose);
  configure();
  administration.sync();
  const step = () => {
    if (restarting) return;
    simulation.step();
    void administration.flush();
  };
  const send = (socket, message) => {
    if (
      socket.readyState === WebSocket.OPEN &&
      socket.bufferedAmount < 2 * 1024 * 1024
    )
      socket.send(JSON.stringify(message));
  };
  const publish = () => {
    if (!clients.size) return;
    for (const [socket, client] of clients) {
      if (
        client.account &&
        client.pendingState === undefined &&
        socket.readyState === WebSocket.OPEN &&
        socket.bufferedAmount < 2 * 1024 * 1024 &&
        !client.paused &&
        Date.now() - client.applicationTime < 3000
      ) {
        const frame = simulation.frame(client.account.id, true);
        let transmitted = frame;
        if (client.previous?.realm === frame.realm) {
          const previous = new Map(client.previous.snapshot.entities);
          const removedComponents = [];
          const entities = frame.snapshot.entities.flatMap(([id, data]) => {
            const before = previous.get(id);
            previous.delete(id);
            if (!before) return [[id, data]];
            const changed = {};
            for (const [key, value] of Object.entries(data)) {
              if (key === "LEVEL" && before.LEVEL) {
                const fields = {};
                for (const name of new Set([
                  ...Object.keys(before.LEVEL),
                  ...Object.keys(value),
                ]))
                  if (!isDeepStrictEqual(before.LEVEL[name], value[name]))
                    fields[name] = value[name];
                if (Object.keys(fields).length) changed.LEVEL = fields;
              } else if (!isDeepStrictEqual(before[key], value))
                changed[key] = value;
            }
            const removed = Object.keys(before).filter((key) => !(key in data));
            if (removed.length) removedComponents.push([id, removed]);
            return Object.keys(changed).length || removed.length
              ? [[id, changed]]
              : [];
          });
          transmitted = {
            ...frame,
            cells: isDeepStrictEqual(frame.cells, client.previous.cells)
              ? undefined
              : frame.cells,
            snapshot: { ...frame.snapshot, entities },
            removed: [...previous.keys()],
            removedComponents,
          };
        }
        client.previous = frame;
        client.pendingState = frame.sequence;
        send(socket, {
          type: "state",
          actorId: simulation.actorId(client.account.id),
          state: engine.encodeState(transmitted),
        });
      }
    }
  };
  const reject = (socket) =>
    socket.close(1008, "Invalid or unavailable session");
  server.on("connection", (socket) => {
    if (restarting || clients.size >= 16) {
      socket.close(1013, "Server full");
      return;
    }
    const client = {
      connectedAt: Date.now(),
      account: undefined,
      joining: false,
      pendingState: undefined,
      paused: false,
      received: -1,
      messages: 0,
      window: Date.now(),
      alive: Date.now(),
      applicationTime: Date.now(),
    };
    clients.set(socket, client);
    socket.on("error", () => socket.terminate());
    socket.on("pong", () => {
      client.alive = Date.now();
    });
    socket.on("close", () => {
      if (client.account) simulation.disconnect(client.account.id);
      clients.delete(socket);
      administration.sync();
    });
    socket.on("message", async (bytes) => {
      let createdAccount;
      const discardUnclaimed = async () => {
        if (
          !createdAccount ||
          client.account ||
          accounts.get(createdAccount)?.banned
        )
          return;
        accounts.delete(createdAccount);
        simulation.forget(createdAccount);
        createdAccount = undefined;
        await save();
      };
      try {
        const now = Date.now();
        client.applicationTime = now;
        if (now - client.window >= 1000) {
          client.window = now;
          client.messages = 0;
        }
        if (++client.messages > 120) {
          reject(socket);
          return;
        }
        const message = JSON.parse(bytes.toString());
        if (!message || typeof message !== "object" || Array.isArray(message)) {
          reject(socket);
          return;
        }
        if (message.type === "join") {
          if (
            client.account ||
            client.joining ||
            Object.keys(message).some(
              (key) => !["type", "id", "token", "username"].includes(key)
            )
          ) {
            reject(socket);
            return;
          }
          client.joining = true;
          let account, token;
          if (message.id !== undefined || message.token !== undefined) {
            if (typeof message.id !== "string" || message.id.length > 64) {
              reject(socket);
              return;
            }
            account = accounts.get(message.id);
            if (
              !account ||
              account.banned ||
              !verifyCredential(account.hash, message.token)
            ) {
              reject(socket);
              return;
            }
            if (simulation.actorId(account.id) === undefined && !account.reset)
              throw new Error("Saved player actor is unavailable");
            for (const [previousSocket, previous] of clients) {
              if (previous !== client && previous.account?.id === account.id) {
                previous.account = undefined;
                previousSocket.close(
                  1008,
                  "Session resumed in another connection"
                );
              }
            }
          }
          if (
            [...clients.values()].filter(
              (other) => other !== client && (other.account || other.joining)
            ).length >= 8
          ) {
            socket.close(1013, "Server full");
            return;
          }
          if (!account) {
            if (accounts.size >= 64) {
              reject(socket);
              return;
            }
            const credential = createCredential();
            token = credential.token;
            account = { id: credential.id, hash: credential.hash };
            simulation.join(account.id);
            accounts.set(account.id, account);
            createdAccount = account.id;
            client.claimingId = account.id;
            await save();
          }
          if (
            socket.readyState !== WebSocket.OPEN ||
            account.banned ||
            restarting
          ) {
            await discardUnclaimed();
            return;
          }
          simulation.join(account.id);
          account.reset = false;
          client.account = account;
          client.claimingId = undefined;
          let nameError;
          if (account.username) onPlayer?.(account);
          if (!account.username && message.username !== undefined)
            nameError = administration.choose(account.id, message.username);
          administration.sync();
          if (!account.username)
            simulation.requestUsername(account.id, nameError);
          client.joining = false;
          send(socket, {
            type: "welcome",
            id: account.id,
            token,
            username: account.username,
            actorId: simulation.actorId(account.id),
          });
          publish();
        } else if (message.type === "input") {
          if (
            !client.account ||
            client.paused ||
            Object.keys(message).some((key) => !["type", "input"].includes(key))
          )
            return;
          if (message.input?.sequence <= client.received) return;
          if (simulation.receive(client.account.id, message.input)) {
            client.received = message.input.sequence;
            send(socket, { type: "ack", sequence: client.received });
          }
        } else if (message.type === "stateAck") {
          if (
            !client.account ||
            !Number.isSafeInteger(message.sequence) ||
            Object.keys(message).some(
              (key) => !["type", "sequence"].includes(key)
            )
          ) {
            reject(socket);
            return;
          }
          if (message.sequence === client.pendingState)
            client.pendingState = undefined;
        } else if (message.type === "heartbeat") {
          if (
            !client.account ||
            !Number.isSafeInteger(message.sequence) ||
            message.sequence < -1 ||
            Object.keys(message).some(
              (key) => !["type", "sequence"].includes(key)
            )
          ) {
            reject(socket);
            return;
          }
          if (message.sequence === client.pendingState)
            client.pendingState = undefined;
          send(socket, {
            type: "pong",
            serverTime: simulation.serverTime,
          });
        } else if (message.type === "pause") {
          if (
            !client.account ||
            typeof message.paused !== "boolean" ||
            Object.keys(message).some(
              (key) => !["type", "paused"].includes(key)
            )
          ) {
            reject(socket);
            return;
          }
          client.paused = message.paused;
          if (client.paused) simulation.release(client.account.id);
          send(socket, { type: "paused", paused: client.paused });
          if (!client.paused) publish();
        } else reject(socket);
      } catch (error) {
        try {
          await discardUnclaimed();
        } catch (saveError) {
          console.error("Server account cleanup failed:", saveError);
        }
        send(socket, {
          type: "error",
          message: "Unable to process server request",
        });
        socket.close(1011, "Server request failed");
      }
    });
  });
  const timers = [];
  if (!manual) {
    let previous = performance.now(),
      pending = 0;
    timers.push(
      setInterval(() => {
        const now = performance.now();
        pending = Math.min(pending + now - previous, (5 * 1000) / 30);
        previous = now;
        while (pending >= 1000 / 30) {
          step();
          pending -= 1000 / 30;
        }
      }, 10)
    );
    timers.push(setInterval(publish, 100));
    let saving = false;
    timers.push(
      setInterval(async () => {
        if (saving) return;
        saving = true;
        try {
          await save();
        } catch (error) {
          console.error("Server saving failed:", error);
        } finally {
          saving = false;
        }
      }, 5000)
    );
  }
  timers.push(
    setInterval(() => {
      for (const [socket, client] of clients) {
        if (
          (!client.account && Date.now() - client.connectedAt > 5000) ||
          Date.now() - client.alive > 15000
        )
          socket.terminate();
        else if (socket.readyState === WebSocket.OPEN) socket.ping();
      }
    }, 5000)
  );
  return {
    get simulation() {
      return simulation;
    },
    address: server.address(),
    save,
    publish,
    step() {
      step();
      publish();
    },
    async close() {
      if (closing) return;
      closing = true;
      timers.forEach(clearInterval);
      for (const socket of clients.keys()) socket.terminate();
      await new Promise((resolve) => server.close(resolve));
      await save();
    },
  };
};
