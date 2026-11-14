import { isActionable } from "../systems/freeze";
import { isDead } from "../systems/damage";
import { POPUP } from "../components/popup";
import { frameWidth, frameHeight } from "../../game/assets/utils";
import { typeChat, navigateChat } from "../systems/popup";
import {
  keyboardSize,
  keyboardPages,
  keyboardColumns,
  keyboardRows,
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
      !(value.action.kind === "scroll"
        ? typeof value.action.index === "number" &&
          Number.isFinite(value.action.index) &&
          value.action.index >= 0 &&
          value.action.index <= 1
        : index(value.action.index)) ||
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
  let tap: Orientation | undefined;
  let pending: InputAction | undefined;
  const text: InputAction[] = [];
  let lastActionGeneration = -1;
  let lastMessageTime = -Infinity;

  const receive = (message: unknown) => {
    if (!isPlayerInput(message) || message.sequence <= received) return false;
    received = message.sequence;
    lastMessageTime = world.metadata.elapsed;
    if (message.move) {
      if (message.move.length && message.move[0] !== move[0])
        tap = message.move[0];
      move = [...message.move];
    }
    // Never build an action backlog, including when a client floods the socket.
    if (message.action?.kind === "text") {
      if (text.length < 16) text.push({ ...message.action });
    } else if (message.action && !pending) pending = { ...message.action };
    return true;
  };
  const release = () => {
    move = [];
    tap = undefined;
    pending = undefined;
    text.length = 0;
    lastMessageTime = -Infinity;
    const player = world.getEntityById(playerId);
    if (player?.[ACTIONABLE]) {
      player[ACTIONABLE].spellTriggered = false;
      player[ACTIONABLE].skillTriggered = false;
      player[ACTIONABLE].interactTriggered = false;
    }
    if (player?.[PLAYER]) {
      player[PLAYER].actionTriggered = undefined;
      player[PLAYER].tabTriggered = undefined;
      player[PLAYER].contentTriggered = undefined;
      player[PLAYER].offsetTriggered = undefined;
    }
    if (player?.[MOVABLE]) {
      player[MOVABLE].orientations = [];
      player[MOVABLE].pendingOrientation = undefined;
      const frame = world.getEntityByIdAndComponents(
        player[MOVABLE].reference,
        [REFERENCE]
      );
      if (frame && !player[MOVABLE].momentum)
        frame[REFERENCE].suspensionCounter = 0;
    }
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
      frame[REFERENCE].suspensionCounter = player[MOVABLE].pendingOrientation
        ? 1
        : 0;
    }
    if (world.metadata.elapsed - lastMessageTime > 1000)
      player[MOVABLE].pendingOrientation = undefined;
    if (move.length || tap) {
      if (tap) player[MOVABLE].pendingOrientation = tap;
      frame[REFERENCE].suspensionCounter = move.length ? -1 : 1;
      tap = undefined;
      frame[REFERENCE].suspended = false;
    }
    if (!isActionable(world, player)) {
      const dead = isDead(world, player);
      if (!dead || pending?.kind !== "interact") pending = undefined;
      player[ACTIONABLE].spellTriggered = false;
      player[ACTIONABLE].skillTriggered = false;
      if (!dead) player[ACTIONABLE].interactTriggered = false;
      player[PLAYER].actionTriggered = undefined;
    }
    if (
      pending ||
      player[PLAYER].actionTriggered ||
      player[ACTIONABLE].spellTriggered ||
      player[ACTIONABLE].skillTriggered ||
      player[ACTIONABLE].interactTriggered
    ) {
      if (frame[REFERENCE].suspensionCounter === 0)
        frame[REFERENCE].suspensionCounter = 1;
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
    const action = pending;
    pending = undefined;
    const popup = world.getEntityByIdAndComponents(player[PLAYER].popup, [
      POPUP,
    ]);
    if (
      !popup &&
      [
        "close",
        "left",
        "right",
        "up",
        "down",
        "content",
        "scroll",
        "tab",
        "backtab",
        "type",
      ].includes(action.kind)
    )
      return;
    if (
      action.kind === "tab" &&
      action.tab !== undefined &&
      (!popup || action.tab >= popup[POPUP].tabs.length)
    )
      return;
    if (
      action.kind === "content" &&
      (action.index === undefined ||
        action.offset === undefined ||
        action.index > frameHeight + 1 ||
        action.offset > frameWidth)
    )
      return;
    if (
      ["type", "chat"].includes(action.kind) &&
      ((action.index !== undefined && action.index >= keyboardColumns) ||
        (action.offset !== undefined && action.offset >= keyboardRows) ||
        (action.tab !== undefined && action.tab >= keyboardPages.length))
    )
      return;
    if (action.kind === "history" && action.index !== 0 && action.index !== 1)
      return;
    if (action.kind === "use" && action.index !== undefined && action.index > 9)
      return;
    lastActionGeneration = frame[RENDERABLE].generation;
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
