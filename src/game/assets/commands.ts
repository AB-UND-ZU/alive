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
  Weapon,
} from "../../engine/components/item";
import { POSITION } from "../../engine/components/position";
import {
  createItemAsDrop,
  findAdjacentDroppable,
} from "../../engine/systems/drop";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import {
  createItemName,
  createUnitName,
  getItemSprite,
  queueMessage,
} from "./utils";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../../engine/components/orientable";
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
import { createText, none } from "./sprites";
import { moveEntity, registerEntity } from "../../engine/systems/map";
import { combine, copy, normalize, repeat, sorted } from "../math/std";
import { LEVEL } from "../../engine/components/level";
import {
  getIdentifier,
  getIdentifierAndComponents,
  setHighlight,
  setIdentifier,
} from "../../engine/utils";
import { MOVABLE } from "../../engine/components/movable";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { NpcType, npcTypes } from "../../engine/components/npc";
import { PLAYER } from "../../engine/components/player";
import { BELONGABLE } from "../../engine/components/belongable";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { getLevelStats } from "../../engine/systems/leveling";
import { cellNames, CellType, createCell } from "../../bindings/creation";

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

const helpDelay = 350;

const executeHelp = (world: World, entity: Entity, command: string) => {
  if (!command) {
    return commandSignatures.help.usage;
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
  if (!(itemName in items)) {
    return `No item "${itemName}"!`;
  }

  const item = { ...items[itemName] };
  const amount = parseInt(amountText);

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
  const isStat = unitStats.includes(stat as UnitStat);
  const isUnit = npcTypes.includes(stat as NpcType);

  if (!isStat && !isUnit) {
    return `No stat "${stat}"!`;
  }

  if (isNaN(amount)) {
    return `No amount "${amountText}"!`;
  }

  if (isStat) {
    entity[STATS][stat] = amount;
  } else if (isUnit) {
    entity[PLAYER].defeatedUnits[stat] = amount;
  }

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
    if (isNaN(normalizedX) || isNaN(normalizedY)) {
      return `No loc "${idOrLoc}"!`;
    }
    moveEntity(world, entity, { x: normalizedX, y: normalizedY });
    return;
  } else if (idOrLoc) {
    const target = getIdentifierAndComponents(world, idOrLoc, [POSITION]);
    if (target) {
      const position = findAdjacentDroppable(world, target[POSITION]);
      moveEntity(world, entity, position);
      return;
    }
  }

  return `No id "${idOrLoc}"!`;
};

const mods = ["fly", "swim", "walk", "pvp", "pve", "god"];
const executeMod = (world: World, entity: Entity, mod: string) => {
  if (mod === "list") {
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
  } else if (mod === "pvp") {
    entity[BELONGABLE].faction = "hostile";
  } else if (mod === "pve") {
    entity[BELONGABLE].faction = "settler";
  } else if (mod === "god") {
    entity[STATS].maxHp = 99;
    entity[STATS].hp = 99;
    entity[STATS].maxMp = 99;
    entity[STATS].mp = 99;
    entity[STATS].haste = 99;
    entity[STATS].power = 99;
    entity[STATS].armor = 99;
    entity[STATS].wisdom = 99;
    entity[STATS].resist = 99;
  } else if (mod === "reset") {
    const stats = getLevelStats(
      entity[SPAWNABLE].classKey,
      entity[STATS].level
    );
    entity[STATS].maxHp = stats.maxHp;
    entity[STATS].hp = stats.maxHp;
    entity[STATS].maxMp = stats.maxMp;
    entity[STATS].mp = stats.maxMp;
    entity[STATS].maxXp = stats.maxXp;
    entity[STATS].xp = 0;
    entity[STATS].haste = stats.haste;
    entity[STATS].power = stats.power;
    entity[STATS].armor = stats.armor;
    entity[STATS].wisdom = stats.wisdom;
    entity[STATS].resist = stats.resist;
  } else {
    return `No mod "${mod}"!`;
  }
};

const lists = ["list", "cmd", "item", "id", "stat", "cast", "cell"];
const executeList = (world: World, entity: Entity, list: string) => {
  let lines: string[] | Sprite[][] = [];

  if (!list || list === "cmd") {
    const commandNames = sorted(Object.keys(commandSignatures));
    lines = commandNames.map((name, index) => {
      const signature = commandSignatures[name];
      return createText(`/${name}│/${signature.short}`.padStart(10).padEnd(14));
    });
  } else if (list === "list") {
    lines = sorted(lists).map((name) => `/list ${name}`.padEnd(10));
  } else if (list === "cell") {
    lines = sorted([...cellNames]);
  } else if (list === "item") {
    const itemNames = sorted(Object.keys(items));
    lines = itemNames.map((itemName) => {
      const text = createText(`${itemName}│`);
      const name = createItemName(items[itemName]);
      return [
        ...repeat(none, 9 - text.length),
        ...text,
        ...name,
        ...repeat(none, 8 - name.length),
      ];
    });
  } else if (list === "id") {
    const identifiables = world.getEntities([IDENTIFIABLE, POSITION]);
    const ids = new Set(
      identifiables.map((identifiable) => identifiable[IDENTIFIABLE].name)
    );
    lines = sorted([...ids]);
  } else if (list === "stat") {
    const unitLines = unitStats.map((stat) => {
      const text = createText(`${stat}│`);
      const name = createItemName({ stat });
      return [
        ...repeat(none, 10 - text.length),
        ...text,
        ...name,
        ...repeat(none, 9 - name.length),
      ];
    });
    const npcLines = npcTypes.map((npcType) => {
      const text = createText(`${npcType}│`);
      const name = createUnitName(npcType);
      return [
        ...repeat(none, 15 - text.length),
        ...text,
        ...name,
        ...repeat(none, 14 - name.length),
      ];
    });
    lines = [...unitLines, ...npcLines];
  } else if (list === "cast") {
    const castables: Omit<Item, "amount" | "carrier" | "bound">[] = [
      ...sorted([...spells]).map(
        (spell) => ({ spell, material: "wood" } as const)
      ),
      ...sorted(
        skills.filter((skill) => !["zap", "block"].includes(skill))
      ).map(
        (skill) =>
          ({
            skill,
            material: "wood",
            weapon: skillWeapons.includes(
              skill as (typeof skillWeapons)[number]
            )
              ? (skill as Weapon)
              : undefined,
          } as const)
      ),
    ];
    lines = castables.map((castable) => {
      const text = createText(`${castable.spell || castable.skill}│`);
      const name = createItemName(castable);
      return [
        ...repeat(none, 9 - text.length),
        ...text,
        ...name,
        ...repeat(none, 8 - name.length),
      ];
    });
  } else {
    return `No list "${list}"!`;
  }

  lines.forEach((line, index) => {
    queueMessage(world, entity, {
      fast: false,
      orientation: "up",
      delay: (index + 1) * helpDelay,
      line: typeof line === "string" ? createText(line) : line,
    });
  });
};

const executeFocus = (world: World, entity: Entity, id: string) => {
  if (id === "off") {
    setHighlight(world);
    return;
  }

  const target = getIdentifierAndComponents(world, id, [POSITION]);
  if (target) {
    setHighlight(world, "quest", target);
    return;
  }

  return `No id "${id}"!`;
};

const executeNew = (
  world: World,
  entity: Entity,
  cell: string,
  amountText = "1"
) => {
  if (!cellNames.includes(cell as CellType)) {
    return `No cell "${cell}"!`;
  }

  const amount = parseInt(amountText);

  if (isNaN(amount)) {
    return `No number "${amountText}"!`;
  }

  const size = world.metadata.gameEntity[LEVEL].size;
  const delta =
    orientationPoints[(entity[ORIENTABLE]?.facing || "up") as Orientation];
  for (let offset = 0; offset < amount; offset += 1) {
    const { all } = createCell(
      world,
      combine(size, entity[POSITION], {
        x: delta.x * (offset + 1),
        y: delta.y * (offset + 1),
      }),
      cell,
      "hidden"
    );
    all.forEach((unit) => {
      registerEntity(world, unit);
    });
  }
};

const executePin = (world: World, entity: Entity, id: string, loc?: string) => {
  const existing = getIdentifier(world, id);
  if (existing) {
    return `Duplicate "${id}"!`;
  }

  let position = copy(entity[POSITION]);

  const parts = loc ? loc.split(",") : [];
  if (loc && parts.length === 2) {
    const [x, y] = parts;
    const size = world.metadata.gameEntity[LEVEL].size;
    const normalizedX = normalize(parseInt(x), size);
    const normalizedY = normalize(parseInt(y), size);
    if (isNaN(normalizedX) || isNaN(normalizedY)) {
      return `No loc "${loc}"!`;
    }
    position = { x: normalizedX, y: normalizedY };
  }

  const pinEntity = entities.createPin(world, { [POSITION]: position });
  setIdentifier(world, pinEntity, id);
};

commandSignatures.help = {
  short: "h",
  executor: executeHelp,
  minArgs: 0,
  maxArgs: 1,
  usage: "/list│/help [cmd]",
};
commandSignatures.give = {
  short: "g",
  executor: executeGive,
  minArgs: 1,
  maxArgs: 4,
  usage: "/give <item> [num] [mat] [ele]",
};
commandSignatures.stat = {
  short: "s",
  executor: executeStat,
  minArgs: 2,
  maxArgs: 2,
  usage: "/stat <type> <num>",
};
commandSignatures.cast = {
  short: "c",
  executor: executeCast,
  minArgs: 1,
  maxArgs: 3,
  usage: "/cast <item> [mat] [ele]",
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
  usage: "/mod <type>",
};
commandSignatures.list = {
  short: "l",
  executor: executeList,
  minArgs: 0,
  maxArgs: 1,
  usage: "/list [type]",
};
commandSignatures.focus = {
  short: "f",
  executor: executeFocus,
  minArgs: 1,
  maxArgs: 1,
  usage: "/focus <id>",
};
commandSignatures.new = {
  short: "n",
  executor: executeNew,
  minArgs: 1,
  maxArgs: 2,
  usage: "/new <cell> [num]",
};
commandSignatures.pin = {
  short: "p",
  executor: executePin,
  minArgs: 1,
  maxArgs: 2,
  usage: "/pin <name> [x,y]",
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

  return { handler: "help", args: [] };
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
