import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { MOVABLE } from "../../engine/components/movable";
import { PLAYER } from "../../engine/components/player";
import { POPUP } from "../../engine/components/popup";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import { getSequence } from "../../engine/systems/sequence";
import { registerEntity } from "../../engine/systems/map";
import { entities } from "../../engine";
import { FOG } from "../../engine/components/fog";
import { HOOKABLE } from "../../engine/components/hookable";
import { LAYER } from "../../engine/components/layer";
import { LOOTABLE } from "../../engine/components/lootable";
import { Position, POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { SPRITE } from "../../engine/components/sprite";
import { SWIMMABLE } from "../../engine/components/swimmable";
import { shadow } from "../../game/assets/sprites";
import * as utils from "../../game/assets/utils";
import { assertIdentifierAndComponents } from "../../engine/utils";
import {
  advanceUntil,
  assertHero,
  GivenItem,
  giveItems,
  HeroAction,
  step,
  act as actNow,
} from "../../testing/harness";

export const setupHero = (world: World) =>
  world.assertComponents(assertHero(world), [
    ACTIONABLE,
    EQUIPPABLE,
    INVENTORY,
    MOVABLE,
    PLAYER,
    POSITION,
    STATS,
  ]);

/** The hero's inventory menu with use, inspect, gear and other tabs. */
export const getMenu = (world: World) =>
  assertIdentifierAndComponents(world, "use", [POPUP]);

/** Act and let a menu window unroll before the next input. */
export const act = (world: World, action: HeroAction) => {
  setupHero(world);
  actNow(world, action);
  step(world, 14);
};

/** Press a number key to use or equip the item assigned to that quick slot. */
export const pressQuickKey = (world: World, hotKey: number) => {
  const hero = setupHero(world);
  hero[PLAYER].contentTriggered = hotKey;
  act(world, "use");
};

/** Wait until all pending pickups of an entity have arrived. */
export const finishCollecting = (world: World, entity: TypedEntity) =>
  advanceUntil(world, () => !getSequence(world, entity, "collect"), 2000);

/** Item entity carried by an entity, matched by item properties. */
export const findItem = (
  world: World,
  entity: TypedEntity<"INVENTORY">,
  match: Partial<TypedEntity<"ITEM">["ITEM"]>
) =>
  entity[INVENTORY].items
    .map((itemId) => world.assertByIdAndComponents(itemId, [ITEM]))
    .find((item) =>
      (Object.keys(match) as (keyof typeof match)[]).every(
        (key) => item[ITEM][key] === match[key]
      )
    );

/** Lay items on the ground like dropped loot, ready to be picked up. */
export const placeDrop = (
  world: World,
  position: Position,
  items: GivenItem[]
) => {
  const container = entities.createDrop(world, {
    [FOG]: { visibility: "visible", type: "unit" },
    [HOOKABLE]: { escaping: false },
    [INVENTORY]: { items: [] },
    [LAYER]: {},
    [LOOTABLE]: { disposable: true },
    [POSITION]: { ...position },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: shadow,
    [SWIMMABLE]: { swimming: false },
  });
  registerEntity(world, container);
  giveItems(world, container, items);
  return container;
};

/** Record the text of every message shown above an entity from now on. */
export const recordMessages = () => {
  const messages: string[] = [];
  const queue = utils.queueMessage;
  jest
    .spyOn(utils, "queueMessage")
    .mockImplementation((world, entity, message) => {
      messages.push(
        message.line
          .map((sprite) => sprite.layers[sprite.layers.length - 1]?.char || "")
          .join("")
      );
      return queue(world, entity, message);
    });
  return messages;
};
