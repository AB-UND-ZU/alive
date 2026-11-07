import { World } from "../../engine";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LOOTABLE } from "../../engine/components/lootable";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { TypedEntity } from "../../engine/entities";
import { getTabSelections } from "../../engine/systems/popup";
import { getSequence } from "../../engine/systems/sequence";
import { getIndexFromKey, getKeyFromIndex } from "../../components/Keyboard";
import {
  detailsHeight,
  frameHeight,
  frameWidth,
} from "../../game/assets/utils";
import { act as actNow, advanceUntil } from "../../testing/harness";
import { act, getMenu, setupHero } from "../items/helpers";

export { act, getMenu, setupHero };

const setKey = (world: World, key?: string) => {
  const hero = setupHero(world);
  const keyMap = key === undefined ? undefined : getIndexFromKey(key);
  if (key !== undefined && !keyMap) throw new Error(`No key "${key}"`);

  hero[PLAYER].tabTriggered = keyMap?.tab;
  hero[PLAYER].contentTriggered = keyMap?.content;
  hero[PLAYER].offsetTriggered = keyMap?.offset;
};

/** Open the chat tab, optionally starting with a "/" like the command key. */
export const openChat = (world: World, command = false) => {
  setKey(world, command ? "/" : undefined);
  act(world, "chat");
};

/** Type text with the on-screen keyboard while the chat is open. */
export const type = (world: World, text: string) => {
  [...text].forEach((key) => {
    setKey(world, key);
    actNow(world, "type");
  });
};

/** Delete the last typed character. */
export const backspace = (world: World) => {
  setKey(world);
  actNow(world, "type");
};

/** Send the typed text, like pressing enter. */
export const submit = (world: World) => act(world, "right");

/** Open the chat, type a line and send it. */
export const say = (world: World, text: string) => {
  openChat(world);
  type(world, text);
  submit(world);
};

/** Text currently typed into the chat prompt. */
export const getPrompt = (world: World) =>
  getTabSelections(world, getMenu(world))
    .map((keyIndex) => getKeyFromIndex(keyIndex))
    .join("");

const getText = (line: Sprite[]) =>
  line.map((sprite) => sprite.layers[sprite.layers.length - 1]?.char || "");

/** Text of the speech bubble above an entity, without its borders. */
export const getDialog = (entity: TypedEntity) =>
  entity[TOOLTIP]?.dialogs.map((dialog) =>
    getText(dialog.slice(1, -1)).join("")
  ) || [];

/** Items lying on the ground, with their position. */
export const getDrops = (world: World) =>
  world.getEntities([LOOTABLE, INVENTORY, POSITION]).flatMap((drop) =>
    drop[INVENTORY].items.map((itemId) => ({
      position: { ...drop[POSITION] },
      item: world.assertByIdAndComponents(itemId, [ITEM])[ITEM],
    }))
  );

/** Visible text of each row inside the open menu window. */
export const readMenu = (world: World) => {
  const popup = getSequence(world, getMenu(world), "popup");
  if (!popup) return [];

  return Array.from({ length: frameHeight - 2 }, (_, row) =>
    Array.from({ length: frameWidth - 2 }, (_, column) => {
      const particle = world.getEntityByIdAndComponents(
        popup.particles[`popup-content-${row}-${column}`],
        [SPRITE]
      );
      const char = particle && getText([particle[SPRITE]])[0];
      return !char || char === "█" ? " " : char;
    })
      .join("")
      .trimEnd()
  );
};

const getDetails = (world: World) =>
  readMenu(world)
    .slice(-detailsHeight)
    .map((line) => line.trim())
    .join(" ")
    .trim();

/** Item details shown below the list of a menu tab, once they are written. */
export const readDetails = (world: World) => {
  try {
    advanceUntil(world, () => getDetails(world) !== "", 2000);
  } catch {}
  return getDetails(world);
};
