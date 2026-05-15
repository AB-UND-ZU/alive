import { Entity } from "ecs";
import { entities, World } from "../../engine";
import {
  Element,
  elements,
  ITEM,
  Item,
  mainWeapons,
  Material,
  materials,
  offhands,
  skills,
  skillWeapons,
  spells,
  stackables,
  tools,
} from "../../engine/components/item";
import { POSITION } from "../../engine/components/position";
import {
  createItemAsDrop,
  findAdjacentDroppable,
} from "../../engine/systems/drop";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import { getItemSprite, queueMessage } from "./utils";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { ORIENTABLE } from "../../engine/components/orientable";
import { TRACKABLE } from "../../engine/components/trackable";
import { accessories } from "../../engine/components/equippable";
import {
  STATS,
  UnitStat,
  unitStats,
  UnitStats,
} from "../../engine/components/stats";
import { rerenderEntity } from "../../engine/systems/renderer";
import { castSkill, castSpell } from "../../engine/systems/trigger";
import { TypedEntity } from "../../engine/entities";
import { createText } from "./sprites";
import { moveEntity } from "../../engine/systems/map";
import { normalize } from "../math/std";
import { LEVEL } from "../../engine/components/level";
import { getIdentifierAndComponents } from "../../engine/utils";
import { MOVABLE } from "../../engine/components/movable";

export type CommandCall = {
  handler: string;
  args: string[];
};

export type CommandSignature = {
  executor: (
    world: World,
    entity: Entity,
    ...args: string[]
  ) => string | Sprite[] | void;
  minArgs: number;
  maxArgs: number;
  usage: string;
  short: string;
};

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
  // don't override skill weapons
  if (skill in items) return;

  items[skill] = { skill, material: "wood" };
});
tools.forEach((tool) => {
  items[tool] = { tool, material: "wood" };
});
stackables.forEach((stackable) => {
  items[stackable] = { stackable };
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
    material:
      accessory === "map" ? "gold" : accessory === "compass" ? "iron" : "wood",
  };
});
unitStats.forEach((stat) => {
  items[stat] = { stat };
});
items.key = { consume: "key", material: "iron" };
items.potion = { consume: "potion", material: "wood" };

const commandSignatures: Record<string, CommandSignature> = {};

const expandCommand = (commandOrShort: string) => {
  if (commandOrShort in commandSignatures) return commandOrShort;

  for (const command in commandSignatures) {
    const signature = commandSignatures[command];
    if (commandOrShort === signature.short) {
      return command;
    }
  }
};

const helpDelay = 1000;
const executeHelp = (world: World, entity: Entity, command: string) => {
  if (!command) {
    return commandSignatures.help.usage;
  }

  if (command === "all") {
    Object.entries(commandSignatures).forEach(([name, signature], index) => {
      queueMessage(world, entity, {
        fast: false,
        orientation: "up",
        delay: index * helpDelay,
        line: createText(`/${name}│/${signature.short}`),
      });
    });
    return;
  }

  const expanded = expandCommand(command);

  if (expanded && commandSignatures[expanded]) {
    return commandSignatures[expanded].usage;
  }

  return `No command "${command}"!`;
};

const executeGive = (
  world: World,
  entity: Entity,
  itemName: string,
  amountText = "1",
  material?: string,
  element?: string
) => {
  const amount = parseInt(amountText);

  if (!(itemName in items)) {
    return `No item "${itemName}"!`;
  }

  const item = { ...items[itemName] };

  if (isNaN(amount)) {
    return `No number "${amountText}"!`;
  }

  if (item.consume === "potion") {
    const stat = element;
    if (!stat) {
      return `No "${itemName}" stat!`;
    } else if (!unitStats.includes(stat as UnitStat)) {
      return `No stat "${stat}"!`;
    } else {
      item.stat = stat as keyof UnitStats;
      element = undefined;
    }
  }

  if (material === "default") {
    item.material = undefined;
  } else if (material && !materials.includes(material as Material)) {
    return `No material "${material}"!`;
  } else if (material) {
    item.material = material as Material;
  }

  if (element && !elements.includes(element as Element)) {
    return `No element "${element}"!`;
  } else if (element) {
    item.element = element as Element;
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

const executeStat = (
  world: World,
  entity: Entity,
  stat: string,
  amountText = "1"
) => {
  const amount = parseInt(amountText);

  if (!unitStats.includes(stat as UnitStat)) {
    return `No stat "${stat}"!`;
  }

  if (isNaN(amount)) {
    return `No amount "${amountText}"!`;
  }

  entity[STATS][stat] = amount;
  rerenderEntity(world, entity);
};

const executeCast = (
  world: World,
  entity: Entity,
  itemName: string,
  material = "wood",
  element = ""
) => {
  if (!(itemName in items)) {
    return `No item "${itemName}"!`;
  }
  const item = { ...items[itemName], amount: 1 };

  if (!(item.spell || item.skill) || ["zap", "block"].includes(item.skill!)) {
    return `Can't cast "${itemName}"!`;
  }

  if (material && !materials.includes(material as Material)) {
    return `No material "${material}"!`;
  } else if (material) {
    item.material = material as Material;
  }

  if (element && !elements.includes(element as Element)) {
    return `No element "${element}"!`;
  } else if (element) {
    item.element = element as Element;
  }

  const itemEntity = {
    [ITEM]: { ...item, carrier: world.getEntityId(entity), bound: true },
  };
  if (item.spell) {
    castSpell(world, entity as TypedEntity<"POSITION">, itemEntity);
  } else if (item.skill) {
    castSkill(world, entity as TypedEntity<"POSITION">, itemEntity);
  }
};

const executeTp = (world: World, entity: Entity, idOrLoc: string) => {
  const parts = idOrLoc.split(",");
  if (idOrLoc.includes(",") && parts.length === 2) {
    const [x, y] = parts;
    const size = world.metadata.gameEntity[LEVEL].size;
    const normalizedX = normalize(parseInt(x), size);
    const normalizedY = normalize(parseInt(y), size);
    if (!isNaN(normalizedX) && !isNaN(normalizedY)) {
      moveEntity(world, entity, { x: normalizedX, y: normalizedY });
      return;
    }
  } else if (idOrLoc) {
    const target = getIdentifierAndComponents(world, idOrLoc, [POSITION]);
    if (target) {
      const position = findAdjacentDroppable(world, target[POSITION]);
      moveEntity(world, entity, position);
      return;
    }
  }

  return `No target "${idOrLoc}"!`;
};

const mods = ["fly", "swim", "walk"];
const executeMod = (world: World, entity: Entity, mod: string) => {
  if (mod === "all") {
    mods.forEach((name, index) => {
      queueMessage(world, entity, {
        fast: false,
        orientation: "up",
        delay: index * helpDelay,
        line: createText(`/mod ${name}`),
      });
    });
  } else if (mod === "walk") {
    entity[MOVABLE].swimming = false;
    entity[MOVABLE].flying = false;
  } else if (mod === "fly") {
    entity[MOVABLE].swimming = false;
    entity[MOVABLE].flying = true;
  } else if (mod === "swim") {
    entity[MOVABLE].swimming = true;
    entity[MOVABLE].flying = false;
  } else {
    return `No mod "${mod}"!`;
  }
};

commandSignatures.help = {
  short: "h",
  executor: executeHelp,
  minArgs: 0,
  maxArgs: 1,
  usage: "/help all│/help <cmd>",
};
commandSignatures.give = {
  short: "g",
  executor: executeGive,
  minArgs: 1,
  maxArgs: 4,
  usage: "/give item <num> <mat> <ele>",
};
commandSignatures.stat = {
  short: "s",
  executor: executeStat,
  minArgs: 2,
  maxArgs: 2,
  usage: "/stat stat num",
};
commandSignatures.cast = {
  short: "c",
  executor: executeCast,
  minArgs: 1,
  maxArgs: 3,
  usage: "/cast item <mat> <ele>",
};
commandSignatures.tp = {
  short: "t",
  executor: executeTp,
  minArgs: 1,
  maxArgs: 1,
  usage: "/tp <id|x,y>",
};
commandSignatures.mod = {
  short: "m",
  executor: executeMod,
  minArgs: 1,
  maxArgs: 1,
  usage: "/mod all│/mod <type>",
};

export const parseCommand = (prompt: string): CommandCall | undefined => {
  if (!prompt.startsWith("/")) return;

  const [command, ...args] = prompt.substring(1).split(" ");

  for (const verb in commandSignatures) {
    const expanded = expandCommand(command);
    if (verb === expanded) {
      return { handler: verb, args };
    }
  }

  return { handler: "help", args: ["all"] };
};

export const executeCommand = (
  world: World,
  entity: Entity,
  command: CommandCall
) => {
  const signature = commandSignatures[command.handler];
  if (
    command.args.length < signature.minArgs ||
    command.args.length > signature.maxArgs
  ) {
    command = { handler: "help", args: [command.handler] };
  }

  return commandSignatures[command.handler].executor(
    world,
    entity,
    ...command.args
  );
};
