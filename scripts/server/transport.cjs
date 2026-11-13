const { WebSocketServer, WebSocket } = require("ws");
const {
  createCredential,
  verifyCredential,
  createPersistence,
} = require("./persistence.cjs");

// Engine integration API; the gameplay menu/realm transition flow is not wired yet.
exports.createGameServer = async ({
  engine,
  file,
  host = "127.0.0.1",
  port = 0,
  manual = false,
}) => {
  const persistence = createPersistence(file);
  const saved = await persistence.load();
  if (saved && (!Array.isArray(saved.accounts) || !saved.world))
    throw new Error("Invalid server save");
  const simulation = engine.createHost(saved?.world);
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
  let closing = false;
  const save = () =>
    persistence.save({
      accounts: [...accounts.values()],
      world: simulation.save(),
    });
  const send = (socket, message) => {
    if (
      socket.readyState === WebSocket.OPEN &&
      socket.bufferedAmount < 2 * 1024 * 1024
    )
      socket.send(JSON.stringify(message));
  };
  const publish = () => {
    if (!clients.size) return;
    const states = new Map();
    for (const [socket, client] of clients) {
      if (
        client.account &&
        !client.paused &&
        Date.now() - client.applicationTime < 3000
      ) {
        const world = simulation.worldFor(client.account.id);
        if (!states.has(world))
          states.set(
            world,
            engine.encodeState(simulation.frame(client.account.id))
          );
        send(socket, {
          type: "state",
          actorId: simulation.actorId(client.account.id),
          state: states.get(world),
        });
      }
    }
  };
  const reject = (socket) =>
    socket.close(1008, "Invalid or unavailable session");
  server.on("connection", (socket) => {
    if (clients.size >= 8) {
      socket.close(1013, "Server full");
      return;
    }
    const client = {
      account: undefined,
      joining: false,
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
      if (client.account) simulation.release(client.account.id);
      clients.delete(socket);
    });
    socket.on("message", async (bytes) => {
      let createdAccount;
      const discardUnclaimed = async () => {
        if (!createdAccount || client.account) return;
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
              (key) => !["type", "id", "token"].includes(key)
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
              !verifyCredential(account.hash, message.token) ||
              [...clients.values()].some(
                (other) => other !== client && other.account?.id === account.id
              )
            ) {
              reject(socket);
              return;
            }
            if (simulation.actorId(account.id) === undefined)
              throw new Error("Saved player actor is unavailable");
          } else {
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
            await save();
          }
          if (socket.readyState !== WebSocket.OPEN) {
            await discardUnclaimed();
            return;
          }
          simulation.join(account.id);
          client.account = account;
          client.joining = false;
          send(socket, {
            type: "welcome",
            id: account.id,
            token,
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
        } else if (message.type === "heartbeat") {
          if (
            !client.account ||
            Object.keys(message).some((key) => key !== "type")
          ) {
            reject(socket);
            return;
          }
          send(socket, {
            type: "pong",
            serverTime: simulation.frame().serverTime,
          });
          publish();
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
          simulation.step();
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
        if (Date.now() - client.alive > 15000) socket.terminate();
        else if (socket.readyState === WebSocket.OPEN) socket.ping();
      }
    }, 5000)
  );
  return {
    simulation,
    address: server.address(),
    save,
    publish,
    step() {
      simulation.step();
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
