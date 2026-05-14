import { Entity } from "ecs";
import { entities, World } from "../../engine";
import {
  craftables,
  elements,
  ITEM,
  Item,
  mainWeapons,
  materials,
  offhands,
  reloadables,
  skills,
  skillWeapons,
  spells,
  tools,
} from "../../engine/components/item";
import { POSITION } from "../../engine/components/position";
import {
  createItemAsDrop,
  findAdjacentDroppable,
} from "../../engine/systems/drop";
import { SPRITE } from "../../engine/components/sprite";
import { getItemSprite } from "./utils";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { ORIENTABLE } from "../../engine/components/orientable";
import { TRACKABLE } from "../../engine/components/trackable";
import { accessories } from "../../engine/components/equippable";

export type CommandCall = {
  handler: string;
  args: string[];
};

export type CommandSignature = Record<
  string,
  {
    executor: (
      world: World,
      entity: Entity,
      ...args: string[]
    ) => string | void;
    minArgs: number;
    maxArgs: number;
  }
>;

const items: Record<string, Omit<Item, "carrier" | "amount" | "bound">> = {};
mainWeapons.forEach((weapon) => {
  items[weapon] = { weapon, material: "wood" };
});
skillWeapons.forEach((weapon) => {
  items[weapon] = { weapon, skill: weapon, material: "wood" };
});
offhands.forEach((offhand) => {
  items[offhand] = { offhand, material: "wood" };
});
spells.forEach((spell) => {
  items[spell] = { spell, material: "wood" };
});
skills.forEach((skill) => {
  items[skill] = { skill, material: "wood" };
});
tools.forEach((tool) => {
  items[tool] = { tool, material: "wood" };
});
craftables.forEach((craftable) => {
  items[craftable] = { stackable: craftable };
});
reloadables.forEach((reloadable) => {
  items[reloadable] = { stackable: reloadable };
});
materials.forEach((material) => {
  items[material] = { stackable: "resource", material };
});
elements.forEach((element) => {
  items[element] = { stackable: "resource", material: "wood", element };
});
accessories.forEach((accessory) => {
  items[accessory] = {
    accessory,
    material: accessory === "map" ? "gold" : "wood",
  };
});

const executeGive = (
  world: World,
  entity: Entity,
  itemName: string,
  amountText = "1"
) => {
  const amount = parseInt(amountText);
  const item = items[itemName];

  if (!item) {
    return `Invalid item "${itemName}"!`;
  }

  if (isNaN(amount)) {
    return `Invalid amount "${amountText}"!`;
  }

  const position = findAdjacentDroppable(world, entity[POSITION]);
  createItemAsDrop(
    world,
    position,
    // @ts-ignore
    item.weapon
      ? entities.createSword
      : item.accessory === "compass"
      ? entities.createCompass
      : entities.createItem,
    {
      [ITEM]: { ...item, bound: false, amount },
      [SPRITE]: getItemSprite(item),
      ...(item.weapon
        ? {
            [SEQUENCABLE]: { states: [] },
            [ORIENTABLE]: {},
          }
        : {}),
      ...(item.accessory === "compass"
        ? {
            [SEQUENCABLE]: { states: {} },
            [TRACKABLE]: {},
          }
        : {}),
    }
  );
};

const commandSignatures: CommandSignature = {
  give: { executor: executeGive, minArgs: 1, maxArgs: 2 },
};

export const parseCommand = (prompt: string): CommandCall | undefined => {
  if (!prompt.startsWith("/")) return;

  const [command, ...args] = prompt.substring(1).split(" ");

  for (const verb in commandSignatures) {
    const signature = commandSignatures[verb];
    if (
      verb === command &&
      args.length >= signature.minArgs &&
      args.length <= signature.maxArgs
    ) {
      return { handler: verb, args };
    }
  }
};

export const executeCommand = (
  world: World,
  entity: Entity,
  command: CommandCall
) =>
  commandSignatures[command.handler].executor(world, entity, ...command.args);
