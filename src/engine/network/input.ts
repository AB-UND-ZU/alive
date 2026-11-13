import { typeChat, navigateChat } from "../systems/popup";
import {
  keyboardSize,
  keyboardPages,
  getKeyFromIndex,
} from "../../components/Keyboard";
import type { World } from "../ecs";
import { ACTIONABLE } from "../components/actionable";
import { MOVABLE } from "../components/movable";
import { PLAYER } from "../components/player";
import { REFERENCE } from "../components/reference";
import { RENDERABLE } from "../components/renderable";
import { Orientation, orientations } from "../components/orientable";

export const inputActions = [
  "text",
  "history",
  "spell",
  "skill",
  "interact",
  "inspect",
  "use",
  "equip",
  "gear",
  "stats",
  "map",
  "chat",
  "type",
  "close",
  "left",
  "right",
  "up",
  "down",
  "content",
  "scroll",
  "tab",
  "backtab",
] as const;
export type InputAction = {
  kind: (typeof inputActions)[number];
  index?: number;
  offset?: number;
  tab?: number;
};
export type PlayerInput = {
  sequence: number;
  move?: Orientation[];
  action?: InputAction;
};

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const keys = (value: Record<string, unknown>, allowed: string[]) =>
  Object.keys(value).every((key) => allowed.includes(key));
const index = (value: unknown) =>
  value === undefined ||
  (Number.isSafeInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= 4096);

export const isPlayerInput = (value: unknown): value is PlayerInput => {
  if (
    !record(value) ||
    !keys(value, ["sequence", "move", "action"]) ||
    !Number.isSafeInteger(value.sequence) ||
    (value.sequence as number) < 0
  )
    return false;
  if (
    value.move !== undefined &&
    (!Array.isArray(value.move) ||
      value.move.length > 2 ||
      new Set(value.move).size !== value.move.length ||
      !value.move.every((entry) => orientations.includes(entry)))
  )
    return false;
  if (
    value.action !== undefined &&
    (!record(value.action) ||
      !keys(value.action, ["kind", "index", "offset", "tab"]) ||
      !inputActions.includes(value.action.kind as InputAction["kind"]) ||
      !index(value.action.index) ||
      !index(value.action.offset) ||
      !index(value.action.tab))
  )
    return false;
  if (
    record(value.action) &&
    value.action.kind === "text" &&
    value.action.index !== undefined &&
    ((value.action.index as number) >= keyboardSize * keyboardPages.length ||
      !getKeyFromIndex(value.action.index as number))
  )
    return false;
  return value.move !== undefined || value.action !== undefined;
};

/** One bounded mailbox per authenticated player, driven only by server time. */
export const createPlayerInput = (world: World, playerId: number) => {
  let received = -1;
  let move: Orientation[] = [];
  let pending: InputAction | undefined;
  const text: InputAction[] = [];
  let lastActionGeneration = -1;
  let lastMessageTime = -Infinity;

  const receive = (message: unknown) => {
    if (!isPlayerInput(message) || message.sequence <= received) return false;
    received = message.sequence;
    lastMessageTime = world.metadata.elapsed;
    if (message.move) move = [...message.move];
    // Never build an action backlog, including when a client floods the socket.
    if (message.action?.kind === "text") {
      if (text.length < 16) text.push({ ...message.action });
    } else if (message.action && !pending) pending = { ...message.action };
    return true;
  };
  const release = () => {
    move = [];
    pending = undefined;
    text.length = 0;
    lastMessageTime = -Infinity;
  };
  const onUpdate = () => {
    const player = world.getEntityByIdAndComponents(playerId, [
      PLAYER,
      MOVABLE,
      ACTIONABLE,
    ]);
    if (!player) {
      release();
      return;
    }
    const frame = world.getEntityByIdAndComponents(player[MOVABLE].reference, [
      REFERENCE,
      RENDERABLE,
    ]);
    if (!frame) return;
    // A stalled connection must not keep a character walking or replay old actions.
    if (world.metadata.elapsed - lastMessageTime > 1000) release();
    for (const edit of text.splice(0, 4)) typeChat(world, player, edit.index);
    const wasMoving = player[MOVABLE].orientations.length > 0;
    player[MOVABLE].orientations = [...move];
    if (
      wasMoving &&
      !move.length &&
      frame[REFERENCE].suspensionCounter === -1
    ) {
      frame[REFERENCE].suspensionCounter = 0;
    }
    if (!move.length) player[MOVABLE].pendingOrientation = undefined;
    if (move.length) {
      player[MOVABLE].pendingOrientation = move[0];
      frame[REFERENCE].suspensionCounter = -1;
      frame[REFERENCE].suspended = false;
    }
    if (
      !pending ||
      lastActionGeneration === frame[RENDERABLE].generation ||
      player[ACTIONABLE].spellTriggered ||
      player[ACTIONABLE].skillTriggered ||
      player[ACTIONABLE].interactTriggered ||
      player[PLAYER].actionTriggered
    )
      return;
    lastActionGeneration = frame[RENDERABLE].generation;
    const action = pending;
    pending = undefined;
    if (action.kind === "history")
      navigateChat(world, player, action.index === 0 ? -1 : 1);
    else if (action.kind === "text") return;
    else if (action.kind === "spell") player[ACTIONABLE].spellTriggered = true;
    else if (action.kind === "skill") player[ACTIONABLE].skillTriggered = true;
    else if (action.kind === "interact")
      player[ACTIONABLE].interactTriggered = true;
    else {
      player[PLAYER].actionTriggered = action.kind;
      player[PLAYER].contentTriggered = action.index;
      player[PLAYER].offsetTriggered = action.offset;
      player[PLAYER].tabTriggered = action.tab;
    }
    if (frame[REFERENCE].suspensionCounter !== -1)
      frame[REFERENCE].suspensionCounter = 1;
    frame[REFERENCE].suspended = false;
  };
  return {
    receive,
    release,
    onUpdate,
    get received() {
      return received;
    },
  };
};
