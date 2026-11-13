import { createReplica } from "./replica";
import { decodeState } from "./codec";
import { InputAction } from "./input";
import { Orientation } from "../components/orientable";

export const serverUrl = (value: string) => {
  const url = new URL(value.includes("://") ? value : `ws://${value}`);
  if (
    !["http:", "https:", "ws:", "wss:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash ||
    url.search
  )
    throw new Error("Enter a WebSocket host URL");
  url.protocol = ["https:", "wss:"].includes(url.protocol) ? "wss:" : "ws:";
  return url.href;
};
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "rejected"
  | "closed";
export const connectServer = (
  address: string,
  options: {
    storage?: Pick<Storage, "getItem" | "setItem">;
    socket?: (url: string) => WebSocket;
    onStatus?: (status: ConnectionStatus) => void;
    onReady?: (world: ReturnType<typeof createReplica>["world"]) => void;
  } = {}
) => {
  const url = serverUrl(address),
    key = `alive.server:${url}`;
  const storage = options.storage || localStorage;
  const replica = createReplica();
  let claim: { id: string; token: string } | undefined;
  const saved = storage.getItem(key);
  if (saved) {
    const value = JSON.parse(saved);
    if (typeof value.id === "string" && typeof value.token === "string")
      claim = value;
  }
  let socket: WebSocket | undefined,
    stopped = false,
    welcomed = false,
    ready = false,
    paused = false;
  let status: ConnectionStatus = "connecting",
    sequence = 0,
    retry: ReturnType<typeof setTimeout> | undefined;
  let move: Orientation[] = [],
    lastState = Date.now(),
    attempts = 0;
  const notify = (next: ConnectionStatus) => {
    status = next;
    options.onStatus?.(next);
  };
  const send = (message: unknown) => {
    if (socket?.readyState === 1 && socket.bufferedAmount < 4096)
      socket.send(JSON.stringify(message));
  };
  const input = (action?: InputAction) => {
    if (!welcomed || paused || stopped || status !== "connected") return;
    send({ type: "input", input: { sequence: sequence++, move, action } });
  };
  const open = () => {
    if (stopped) return;
    welcomed = false;
    notify(ready ? "reconnecting" : "connecting");
    const current = (options.socket || ((url) => new WebSocket(url)))(url);
    socket = current;
    current.onopen = () => send({ type: "join", ...claim });
    current.onmessage = (event) => {
      if (socket !== current || stopped) return;
      try {
        const message = JSON.parse(event.data);
        if (message.type === "welcome") {
          replica.resetOrdering();
          if (message.token) {
            const credential = { id: message.id, token: message.token };
            claim = credential;
            try {
              storage.setItem(key, JSON.stringify(credential));
            } catch {
              stopped = true;
              clearInterval(timer);
              notify("rejected");
              current.close();
              return;
            }
          }
          welcomed = true;
          attempts = 0;
          // Restored server mailboxes use a fresh connection sequence.
          send({ type: "pause", paused });
        } else if (message.type === "state" && welcomed) {
          replica.world.metadata.localPlayerId = message.actorId;
          const frame = decodeState(message.state) as Parameters<
            typeof replica.receive
          >[0];
          if (replica.receive(frame)) {
            lastState = Date.now();
            notify("connected");
            if (!ready) {
              ready = true;
              options.onReady?.(replica.world);
            }
          }
        } else if (message.type === "error") current.close();
      } catch (error) {
        current.close(1002, "Invalid server response");
      }
    };
    current.onerror = () => current.close();
    current.onclose = (event) => {
      if (socket !== current || stopped) return;
      welcomed = false;
      move = [];
      if (event.code === 1008) {
        notify("rejected");
        return;
      }
      notify("reconnecting");
      retry = setTimeout(open, Math.min(5000, 250 * ++attempts));
    };
  };
  const timer = setInterval(() => {
    if (welcomed) {
      send({ type: "heartbeat" });
      if (!paused) input();
      if (!paused && Date.now() - lastState > 3000) {
        move = [];
        socket?.close();
      }
    }
  }, 250);
  open();
  const connection = {
    world: replica.world,
    move(orientations: Orientation[]) {
      move = [...orientations];
      input();
    },
    action(action: InputAction) {
      input(action);
    },
    pause(next: boolean) {
      paused = next;
      move = [];
      send({ type: "pause", paused });
    },
    render: replica.render,
    close() {
      stopped = true;
      clearInterval(timer);
      clearTimeout(retry);
      socket?.close();
      notify("closed");
    },
  };
  replica.world.metadata.network = connection;
  return connection;
};
