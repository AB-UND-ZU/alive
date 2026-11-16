import { createSoundPlayer } from "./sound";
import { createReplica } from "./replica";
import { decodeState } from "./codec";
import { InputAction } from "./input";
import { Orientation } from "../components/orientable";

import { serverUrl } from "./url";
export { serverUrl } from "./url";
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
    username?: string;
    socket?: (url: string) => WebSocket;
    onStatus?: (status: ConnectionStatus) => void;
    onReady?: (world: ReturnType<typeof createReplica>["world"]) => void;
  } = {}
) => {
  const url = serverUrl(address),
    key = `alive.server:${url}`;
  const storage = options.storage || localStorage;
  const replica = createReplica();
  const sounds = createSoundPlayer();
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
  let pendingMovement: number | undefined;
  const input = (action?: InputAction) => {
    if (!welcomed || paused || stopped || status !== "connected") return;
    if (socket?.readyState !== 1 || socket.bufferedAmount >= 4096) return;
    const hero = replica.world.getEntityById(
      replica.world.metadata.localPlayerId
    );
    const directions = hero?.PLAYER?.popup ? move : undefined;
    const step =
      !hero?.PLAYER?.popup && move.length && pendingMovement === undefined
        ? [...move]
        : undefined;
    if (!action && !directions && !step) return;
    const sent = sequence++;
    send({
      type: "input",
      input: {
        sequence: sent,
        ...(directions ? { move: directions } : {}),
        ...(step ? { step } : {}),
        ...(action ? { action } : {}),
      },
    });
    if (step) {
      pendingMovement = sent;
      replica.prediction.move(step, sent);
    }
    if (action) replica.prediction.action(action.kind);
  };
  const open = () => {
    if (stopped) return;
    welcomed = false;
    lastState = Date.now();
    notify(ready ? "reconnecting" : "connecting");
    const current = (options.socket || ((url) => new WebSocket(url)))(url);
    socket = current;
    current.onopen = () => {
      if (socket !== current || stopped) return;
      send({
        type: "join",
        ...claim,
        ...(options.username ? { username: options.username } : {}),
      });
    };
    current.onmessage = (event) => {
      if (socket !== current || stopped) return;
      try {
        const message = JSON.parse(event.data);
        if (message.type === "welcome") {
          replica.resetOrdering();
          sounds.reset();
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
          lastState = Date.now();
          attempts = 0;
          // Restored server mailboxes use a fresh connection sequence.
          send({ type: "pause", paused });
        } else if (message.type === "state" && welcomed) {
          const previousActor = replica.world.metadata.localPlayerId;
          const previousRealm = replica.world.metadata.gameEntity.LEVEL?.name;
          replica.world.metadata.localPlayerId = message.actorId;
          const frame = decodeState(message.state) as Parameters<
            typeof replica.receive
          >[0];
          if (replica.receive(frame)) {
            if (
              previousActor !== message.actorId ||
              (frame.realm && frame.realm !== previousRealm)
            ) {
              pendingMovement = undefined;
              move = [];
            }
            sounds.receive(replica.world, frame, paused);
            lastState = Date.now();
            if (
              pendingMovement !== undefined &&
              (frame.movementSequence ?? -1) >= pendingMovement
            )
              pendingMovement = undefined;
            notify("connected");
            if (!ready) {
              ready = true;
              options.onReady?.(replica.world);
            }
          }
          send({ type: "stateAck", sequence: frame.sequence });
        } else if (message.type === "error") current.close();
      } catch (error) {
        console.error("Server state could not be applied:", error);
        current.close(1002, "Invalid server response");
      }
    };
    current.onerror = () => {
      if (socket !== current || stopped) return;
      current.onclose?.({ code: 1006 } as CloseEvent);
      current.close();
    };
    current.onclose = (event) => {
      if (socket !== current || stopped) return;
      socket = undefined;
      welcomed = false;
      pendingMovement = undefined;
      replica.prediction.clear();
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
    if (socket && !welcomed && Date.now() - lastState > 5000) {
      const stale = socket;
      stale.onclose?.({ code: 1006 } as CloseEvent);
      stale.close();
    }
    if (welcomed) {
      send({ type: "heartbeat", sequence: replica.sequence });
      if (!paused) input();
      if (!paused && Date.now() - lastState > 15000) {
        move = [];
        const stale = socket;
        stale?.onclose?.({ code: 1006 } as CloseEvent);
        stale?.close();
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
      if (next !== paused) {
        sounds.reset();
        if (!next) lastState = Date.now();
      }
      replica.prediction.clear();
      pendingMovement = undefined;
      paused = next;
      move = [];
      send({ type: "pause", paused });
    },
    render(delta: number) {
      replica.render(delta);
      if (
        !replica.world.getEntityById(replica.world.metadata.localPlayerId)
          ?.PLAYER?.popup
      )
        input();
    },
    close() {
      stopped = true;
      replica.prediction.clear();
      clearInterval(timer);
      clearTimeout(retry);
      socket?.close();
      notify("closed");
    },
  };
  replica.world.metadata.network = connection;
  return connection;
};
