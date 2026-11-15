import type { InputAction } from "../../engine/network/input";
import {
  getLocalPlayer,
  getInteraction,
  getPlayerInterface,
} from "../../engine/players";
import { isTestMode } from "../../engine/mode";
import { World } from "../../engine";
import { LEVEL } from "../../engine/components/level";
import { ACTIONABLE } from "../../engine/components/actionable";
import { MOVABLE } from "../../engine/components/movable";
import { PLAYER, Player } from "../../engine/components/player";
import { REFERENCE } from "../../engine/components/reference";
import { getSequence } from "../../engine/systems/sequence";
import { POPUP } from "../../engine/components/popup";
import { Orientation } from "../../engine/components/orientable";
import {
  closePopup,
  getTab,
  getVerticalIndex,
  typeChat,
  completeChat,
  navigateChat,
} from "../../engine/systems/popup";
import { credits } from "../../game/assets/credits";
import { play } from "../../game/sound";
import { isDead } from "../../engine/systems/damage";
import { setMovementOrientations } from "../../engine/systems/movement";
import {
  getIndexFromKey,
  keyboardColumns,
  keyboardSize,
} from "../../game/assets/keyboard";

type Action =
  | Extract<NonNullable<Player["actionTriggered"]>, InputAction["kind"]>
  | "spell"
  | "skill"
  | "interact";
const actions: Record<string, Action> = {
  " ": "spell",
  enter: "interact",
  return: "interact",
  q: "equip",
  e: "use",
  b: "inspect",
  m: "map",
  g: "gear",
  t: "stats",
  c: "chat",
  escape: "close",
  tab: "tab",
  backspace: "close",
};
const directions: Record<string, Orientation> = {
  up: "up",
  right: "right",
  down: "down",
  left: "left",
  w: "up",
  d: "right",
  s: "down",
  a: "left",
};
export type TerminalKey = {
  name?: string;
  sequence?: string;
  shift?: boolean;
  ctrl?: boolean;
};

export const createTerminalInput = (
  world: World,
  openLink: (url: string) => void = () => {}
) => {
  let release: ReturnType<typeof setTimeout> | undefined;
  const getHero = () => getLocalPlayer(world, [MOVABLE, ACTIONABLE]);
  let text: number[] = [];
  const flushText = () => {
    while (text.length)
      world.metadata.network?.action({
        kind: "text",
        indices: text.splice(0, 128),
      });
  };
  const stop = () => {
    clearTimeout(release);
    const hero = getHero();
    if (!hero) return;
    setMovementOrientations(world, hero, []);
  };
  const press = (key: TerminalKey) => {
    const hero = getHero();
    if (!hero) return;
    const name = key.name || key.sequence || "";
    const popup = world.getEntityByIdAndComponents(hero[PLAYER].popup, [POPUP]);
    const tab = popup && getTab(world, popup);
    const chat =
      tab === "chat" || (tab === "server" && !world.metadata.network);
    const send = (kind: "text" | "history" | "complete", index?: number) => {
      if (kind === "text" && index !== undefined) {
        if (!text.length) queueMicrotask(flushText);
        text.push(index);
      } else {
        flushText();
        world.metadata.network?.action({ kind, index });
      }
    };
    if (chat) {
      if (name === "backspace") {
        if (world.metadata.network) send("text");
        else typeChat(world, hero);
        return;
      }
      if (name === "tab") {
        if (world.metadata.network) send("complete");
        else completeChat(world, hero);
        return;
      }
      if (name === "up" || name === "down") {
        if (world.metadata.network) send("history", name === "up" ? 0 : 1);
        else navigateChat(world, hero, name === "up" ? -1 : 1);
        return;
      }
      const char = key.sequence;
      const index =
        char && [...char].length === 1 ? getIndexFromKey(char) : undefined;
      if (index) {
        const value =
          index.tab * keyboardSize +
          index.offset * keyboardColumns +
          index.content;
        if (world.metadata.network) send("text", value);
        else typeChat(world, hero, value);
        return;
      }
    }
    flushText();
    const reference = world.assertByIdAndComponents(hero[MOVABLE].reference, [
      REFERENCE,
    ])[REFERENCE];
    const direction = directions[name];
    if (direction && !key.ctrl && !isDead(world, hero)) {
      setMovementOrientations(world, hero, [direction]);
      clearTimeout(release);
      release = setTimeout(stop, 100);
      return;
    }
    let action: Action | undefined =
      key.shift && name === "tab" ? "backtab" : actions[name];
    if (name === "space") action = key.shift ? "skill" : "spell";
    if (name === "return" || name === "enter")
      action = popup
        ? "right"
        : !hero[PLAYER].ghost &&
          (world.metadata.network ||
            world.metadata.gameEntity[LEVEL].name !== "LEVEL_MENU" ||
            isTestMode(world, hero)) &&
          !getInteraction(world, hero).active
        ? "chat"
        : "interact";
    if (name === "backspace") action = popup ? "left" : undefined;
    if (
      name === "escape" &&
      popup &&
      getSequence(world, popup, "popup")?.args.backButton
    )
      action = "left";
    if (name === "tab" && !chat) {
      action = !popup
        ? "use"
        : getPlayerInterface(world, hero, "use", [POPUP]) === popup
        ? "close"
        : key.shift
        ? "backtab"
        : "tab";
    }
    if (key.ctrl && name === "s") action = "skill";
    const index = /^\d$/.test(name) ? Number(name) : undefined;
    if (index !== undefined) action = "use";
    if (name === "/") action = "chat";
    if (!action) return;
    if (popup) stop();
    if (action === "right" && popup && getTab(world, popup) === "credits") {
      const credit = credits[getVerticalIndex(world, popup)];
      if (credit?.link) {
        play("confirm");
        openLink(credit.link);
      }
      return;
    }
    if (
      world.metadata.network &&
      action === "left" &&
      popup &&
      getTab(world, popup) === "server"
    ) {
      world.metadata.leaveServer();
      return;
    }
    if (world.metadata.network) {
      const slash = name === "/" ? getIndexFromKey("/") : undefined;
      world.metadata.network.action({
        kind: action,
        index: slash?.content ?? index,
        offset: slash?.offset,
        tab: slash?.tab,
      });
      return;
    }
    if (action === "close" && popup) {
      stop();
      hero[PLAYER].actionTriggered = undefined;
      closePopup(world, hero, popup);
      return;
    }
    if (
      hero[ACTIONABLE].spellTriggered ||
      hero[ACTIONABLE].skillTriggered ||
      hero[ACTIONABLE].interactTriggered ||
      hero[PLAYER].actionTriggered
    )
      return;
    if (action === "spell") hero[ACTIONABLE].spellTriggered = true;
    else if (action === "skill") hero[ACTIONABLE].skillTriggered = true;
    else if (action === "interact") hero[ACTIONABLE].interactTriggered = true;
    else {
      hero[PLAYER].actionTriggered = action;
      hero[PLAYER].contentTriggered = index;
      if (name === "/") {
        const slash = getIndexFromKey("/")!;
        hero[PLAYER].contentTriggered = slash.content;
        hero[PLAYER].offsetTriggered = slash.offset;
        hero[PLAYER].tabTriggered = slash.tab;
      }
    }
    reference.suspensionCounter =
      reference.suspensionCounter === -1 ? -1 : reference.suspensionCounter + 1;
    reference.suspended = false;
  };
  return { press, stop };
};
