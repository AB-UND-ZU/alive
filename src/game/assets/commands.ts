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
import { Position, POSITION } from "../../engine/components/position";
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
  orientations,
} from "../../engine/components/orientable";
import { TRACKABLE } from "../../engine/components/trackable";
import { accessories, slots } from "../../engine/components/equippable";
import {
  STATS,
  UnitStat,
  unitStats,
  UnitStats,
} from "../../engine/components/stats";
import { rerenderEntity } from "../../engine/systems/renderer";
import { castSkill, castSpell } from "../../engine/systems/trigger";
import { requireComponent, TypedEntity } from "../../engine/entities";
import { none, missing } from "./sprites";
import {
  disposeEntity,
  getCellEntities,
  moveEntity,
  registerEntity,
  updateWalkable,
} from "../../engine/systems/map";
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
import { SWIMMABLE } from "../../engine/components/swimmable";
import { classes, getClassData } from "../balancing/classes";
import { hairColors } from "./pixels";
import { getChangedClassStats, getLevelStats } from "../../engine/systems/leveling";
import { cellNames, CellType, createCell } from "../../bindings/creation";
import { VIEWABLE } from "../../engine/components/viewable";
import { ENTERABLE } from "../../engine/components/enterable";
import { createText } from "./ui";
import { updateShoreline } from "../../engine/systems/water";
import { isCell } from "../../engine/systems/harvest";
import { setUnlocks } from "../unlocks";

export type CommandCall = {
  handler: string;
  args: string[];
};

export type CommandSignature = {
  executor: (
    world: World,
    entity: TypedEntity,
    ...args: string[]
  ) => string | Sprite[] | void;
  minArgs: number;
  maxArgs: number;
  usage: string;
  short: string;
};

export const commandItems: Record<
  string,
  Omit<Item, "carrier" | "amount" | "bound">
> = {};
mainWeapons.forEach((weapon) => {
  commandItems[weapon] = { weapon, material: "wood" };
});
skillWeapons.forEach((weapon) => {
  commandItems[weapon] = { weapon, skill: weapon, material: "wood" };
});
offhands.forEach((offhand) => {
  commandItems[offhand] = { offhand, material: "wood" };
});
spells.forEach((spell) => {
  commandItems[spell] = { spell, material: "wood" };
});
skills.forEach((skill) => {
  // don't override skill weapons
  if (skill in commandItems) return;

  commandItems[skill] = { skill, material: "wood" };
});
tools.forEach((tool) => {
  commandItems[tool] = { tool, material: "wood" };
});
stackables.forEach((stackable) => {
  commandItems[stackable] = { stackable };
});
materials.forEach((material) => {
  commandItems[material] = { stackable: "resource", material };
});
elements.forEach((element) => {
  commandItems[element] = { stackable: "resource", material: "wood", element };
});
accessories.forEach((accessory) => {
  commandItems[accessory] = {
    accessory,
    material:
      accessory === "map" ? "gold" : accessory === "compass" ? "iron" : "wood",
  };
});
unitStats.forEach((stat) => {
  commandItems[stat] = { stat };
});
commandItems.key = { consume: "key", material: "iron" };
commandItems.potion = { consume: "potion", material: "wood" };
commandItems.bucket = { consume: "bucket", material: "iron" };

export const commandSignatures: Record<string, CommandSignature> = {};

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

const executeHelp = (world: World, entity: TypedEntity, command: string) => {
  if (!command) {
    return commandSignatures.help.usage;
  }

  const expanded = expandCommand(command);

  if (expanded && commandSignatures[expanded]) {
    return commandSignatures[expanded].usage;
  }

  return `No command "${command}"!`;
};

const classStat = (entity: TypedEntity, stat: UnitStat) => {
  const level = requireComponent(entity, STATS).level;
  if (stat === "level") return level;
  const stats = getLevelStats(requireComponent(entity, SPAWNABLE).classKey, Math.max(1, level));
  if (stat === "hp") return stats.maxHp;
  if (stat === "mp") return stats.maxMp;
  if (stat === "xp") return 0;
  return stats[stat];
};

const executeGive = (
  world: World,
  entity: TypedEntity,
  itemName: string,
  amountText?: string,
  material?: string,
  element?: string
) => {
  if (!(itemName in commandItems)) {
    return `No item "${itemName}"!`;
  }

  const item = { ...commandItems[itemName] };
  const amount = amountText !== undefined
    ? parseInt(amountText)
    : item.stat ? classStat(entity, item.stat) : 1;

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

  const position = findAdjacentDroppable(world, requireComponent(entity, POSITION));
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

const commandStats = ["view", "class", "hair"];
const hairNames = hairColors.map(({ name }) => name.toLowerCase());
const executeStat = (
  world: World,
  entity: TypedEntity,
  stat: string,
  input?: string
) => {
  if (stat === "class" || stat === "hair") {
    const appearance = requireComponent(entity, SPAWNABLE);
    if (stat === "class") {
      if (input === undefined) return `class = ${appearance.classKey}`;
      const next = classes.find((key) => key === input);
      if (!next) return `No class "${input}"!`;
      if (next === appearance.classKey) return;
      entity[STATS] = getChangedClassStats(
        requireComponent(entity, STATS), appearance.classKey, next
      );
      appearance.classKey = next;
    } else {
      if (input === undefined) {
        const hair = hairColors.find(({ color }) => color === appearance.hairColor);
        return `hair = ${hair?.name.toLowerCase() ?? appearance.hairColor}`;
      }
      const hair = hairColors.find(({ name }) => name.toLowerCase() === input.toLowerCase());
      if (!hair) return `No hair "${input}"!`;
      appearance.hairColor = hair.color;
    }
    const { sprite, swimming } = getClassData(
      appearance.classKey, appearance.hairColor
    );
    entity[SPRITE] = sprite;
    requireComponent(entity, SWIMMABLE).sprite = swimming;
    rerenderEntity(world, entity);
    return;
  }

  const isReading = input === undefined;
  const amount = isReading ? NaN : parseInt(input);
  const isStat = unitStats.includes(stat as UnitStat);
  const isUnit = npcTypes.includes(stat as NpcType);

  if (!isStat && !isUnit && stat !== "view") {
    return `No stat "${stat}"!`;
  }

  if (!isReading && isNaN(amount)) {
    return `No amount "${input}"!`;
  }

  let value: number | string = "";

  if (isStat) {
    if (isReading) {
      value = requireComponent(entity, STATS)[stat as UnitStat];
    } else {
      requireComponent(entity, STATS)[stat as UnitStat] = amount;
    }
  } else if (isUnit) {
    if (isReading) {
      value = requireComponent(entity, PLAYER).defeatedUnits[stat as NpcType] || 0;
    } else {
      requireComponent(entity, PLAYER).defeatedUnits[stat as NpcType] = amount;
    }
  } else if (stat === "view") {
    if (isReading) {
      value = requireComponent(entity, VIEWABLE).priority;
    } else {
      requireComponent(entity, VIEWABLE).priority = amount;
    }
  }

  if (isReading) {
    return `${stat} = ${value}`;
  } else {
    rerenderEntity(world, entity);
  }
};

const executeCast = (
  world: World,
  entity: TypedEntity,
  itemName: string,
  material = "wood",
  element = ""
) => {
  if (!(itemName in commandItems)) {
    return `No item "${itemName}"!`;
  }
  const item = { ...commandItems[itemName], amount: 1 };

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
    castSpell(world, world.assertComponents(entity, [POSITION]), itemEntity);
  } else if (item.skill) {
    castSkill(world, entity, itemEntity);
  }
};

const executeTp = (world: World, entity: TypedEntity, idOrLoc?: string) => {
  if (!idOrLoc) {
    const { x, y } = requireComponent(entity, POSITION);
    return `${x},${y}`;
  }
  const parts = idOrLoc.split(",");
  let position: Position;
  if (parts.length === 2) {
    const [x, y] = parts.map((part) => parseInt(part));
    if (isNaN(x) || isNaN(y)) return `No loc "${idOrLoc}"!`;
    position = { x, y };
  } else {
    const target = getIdentifierAndComponents(world, idOrLoc, [POSITION]);
    if (!target) return `No id "${idOrLoc}"!`;
    position = findAdjacentDroppable(world, target[POSITION]);
  }

  moveEntity(world, entity, position, false);
  world.metadata.cameraTeleport = entity;
};

export const commandMods = [
  "fly",
  "swim",
  "walk",
  "pvp",
  "pve",
  "god",
  "reset",
  "lock",
  "unlock",
];
const executeMod = (world: World, entity: TypedEntity, mod: string) => {
  if (mod === "walk") {
    const movement = requireComponent(entity, MOVABLE);
    movement.swimming = false;
    movement.flying = false;
  } else if (mod === "fly") {
    const movement = requireComponent(entity, MOVABLE);
    movement.swimming = false;
    movement.flying = true;
  } else if (mod === "swim") {
    const movement = requireComponent(entity, MOVABLE);
    movement.swimming = true;
    movement.flying = false;
  } else if (mod === "pvp") {
    requireComponent(entity, BELONGABLE).faction = "hostile";
  } else if (mod === "pve") {
    requireComponent(entity, BELONGABLE).faction = "settler";
  } else if (mod === "god") {
    const entityStats = requireComponent(entity, STATS);
    entityStats.maxHp = 99;
    entityStats.hp = 99;
    entityStats.maxMp = 99;
    entityStats.mp = 99;
    entityStats.maxXp = Infinity;
    entityStats.haste = 99;
    entityStats.power = 99;
    entityStats.armor = 99;
    entityStats.wisdom = 99;
    entityStats.resist = 99;
  } else if (mod === "lock" || mod === "unlock") {
    setUnlocks(mod === "unlock");
    rerenderEntity(world, entity);
  } else if (mod === "reset") {
    const entityStats = requireComponent(entity, STATS);
    const stats = getLevelStats(
      requireComponent(entity, SPAWNABLE).classKey,
      entityStats.level
    );
    entityStats.maxHp = stats.maxHp;
    entityStats.hp = stats.maxHp;
    entityStats.maxMp = stats.maxMp;
    entityStats.mp = stats.maxMp;
    entityStats.maxXp = stats.maxXp;
    entityStats.xp = 0;
    entityStats.haste = stats.haste;
    entityStats.power = stats.power;
    entityStats.armor = stats.armor;
    entityStats.wisdom = stats.wisdom;
    entityStats.resist = stats.resist;
  } else {
    return `No mod "${mod}"!`;
  }
};

export const commandLists = [
  "list",
  "mod",
  "cmd",
  "item",
  "id",
  "stat",
  "cast",
  "cell",
];
const executeList = (world: World, entity: TypedEntity, list: string) => {
  let lines: string[] | Sprite[][] = [];

  if (!list || list === "cmd") {
    const commandNames = sorted(Object.keys(commandSignatures));
    lines = commandNames.map((name, index) => {
      const signature = commandSignatures[name];
      return createText(`/${name}│/${signature.short}`.padStart(10).padEnd(14));
    });
  } else if (list === "list") {
    lines = sorted(commandLists).map((name) => `/list ${name}`.padEnd(10));
  } else if (list === "mod") {
    lines = sorted(commandMods).map((name) => `/mod ${name}`);
  } else if (list === "cell") {
    lines = sorted([...cellNames]);
  } else if (list === "item") {
    const itemNames = sorted(Object.keys(commandItems));
    lines = itemNames.map((itemName) => {
      const text = createText(`${itemName}│`);
      const name = createItemName(commandItems[itemName]);
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
    lines = [...commandStats.map((stat) => createText(stat)), ...unitLines, ...npcLines];
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

const executeFocus = (world: World, entity: TypedEntity, id: string) => {
  if (!id) {
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
  entity: TypedEntity,
  cellName: string,
  amountText = "1",
  direction?: string
) => {
  const cell = cellName as CellType;
  if (!cellNames.includes(cell)) {
    return `No cell "${cell}"!`;
  }

  const amount = parseInt(amountText);

  if (isNaN(amount)) {
    return `No number "${amountText}"!`;
  }

  let orientation = (entity[ORIENTABLE]?.facing || "up") as Orientation;
  if (direction && !orientations.includes(direction as Orientation)) {
    return `No direction "${orientation}"!`;
  } else if (direction) {
    orientation = direction as Orientation;
  }

  const size = world.metadata.gameEntity[LEVEL].size;
  const delta = orientationPoints[orientation];
  for (let offset = 0; offset < amount; offset += 1) {
    const target = combine(size, requireComponent(entity, POSITION), {
      x: delta.x * (offset + 1),
      y: delta.y * (offset + 1),
    });

    // clear cell but prevent removing self and buildings
    if (cell === "air") {
      getCellEntities(world, target).forEach((cellEntity) => {
        if (
          cellEntity === entity ||
          !isCell(world, cellEntity) ||
          cellEntity[ENTERABLE]
        )
          return;
        disposeEntity(world, cellEntity);
      });
      world.metadata.gameEntity[LEVEL].cells[target.x][target.y] = "air";
    } else {
      const { all } = createCell(world, target, cell, "hidden");
      all.forEach((unit) => {
        if (unit[POSITION]) registerEntity(world, unit);
      });
      world.metadata.gameEntity[LEVEL].cells[target.x][target.y] =
        cell === "water" ? "water_deep" : cell;
    }

    updateWalkable(world, target);
    updateShoreline(world, target);
  }
};

const executePin = (world: World, entity: TypedEntity, id: string, loc?: string) => {
  const existing = getIdentifier(world, id);
  if (existing) {
    return `Duplicate "${id}"!`;
  }

  let position = copy(requireComponent(entity, POSITION));

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
  minArgs: 1,
  maxArgs: 2,
  usage: "/stat <type> [value]",
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
  minArgs: 0,
  maxArgs: 1,
  usage: "/tp [id|x,y]",
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
  minArgs: 0,
  maxArgs: 1,
  usage: "/focus [id]",
};
commandSignatures.new = {
  short: "n",
  executor: executeNew,
  minArgs: 1,
  maxArgs: 3,
  usage: "/new <cell> [num] [dir]",
};
commandSignatures.pin = {
  short: "p",
  executor: executePin,
  minArgs: 1,
  maxArgs: 2,
  usage: "/pin <name> [x,y]",
};

export const completeCommand = (
  world: World,
  input: string,
  selection = 0
): string => {
  input = input.trimStart();
  if (!input.startsWith("/")) return "";
  const words = input.split(" ");
  const last = words[words.length - 1];
  let values: readonly string[] = [];

  if (words.length === 1) {
    values = Object.keys(commandSignatures).map((name) => `/${name}`);
  } else {
    const command = expandCommand(words[0].slice(1));
    const identifiers = () =>
      world
        .getEntities([IDENTIFIABLE, POSITION])
        .map((entity) => entity[IDENTIFIABLE].name);
    const item = commandItems[words[1]];
    const actor = command === "give" && words.length === 3 && item?.stat &&
      world.getEntity([PLAYER, STATS, SPAWNABLE]);
    const defaultStat = actor && item.stat ? String(classStat(actor, item.stat)) : undefined;
    const hasSprite = (variant: Omit<Item, "amount" | "carrier" | "bound">) =>
      getItemSprite(variant).name !== missing.name;
    const hasGiveSprite = (
      variant: Omit<Item, "amount" | "carrier" | "bound">
    ) =>
      variant.consume === "potion"
        ? unitStats.some((stat) => hasSprite({ ...variant, stat }))
        : hasSprite(variant);
    const material =
      words[3] === "default" ? undefined : (words[3] as Material);
    const argumentsByCommand: Record<string, readonly (readonly string[])[]> = {
      help: [Object.keys(commandSignatures)],
      give: [
        Object.keys(commandItems).filter((name) =>
          hasGiveSprite(commandItems[name])
        ),
        item ? [defaultStat ?? (slots.some((slot) => item[slot]) ? "1" : "10")] : [],
        item
          ? [...materials, "default"].filter((value) =>
              hasGiveSprite({
                ...item,
                material: value === "default" ? undefined : (value as Material),
              })
            )
          : [],
        item
          ? [...(item.consume === "potion" ? unitStats : elements)].filter(
              (value) =>
                hasSprite({
                  ...item,
                  material,
                  ...(item.consume === "potion"
                    ? { stat: value as UnitStat }
                    : { element: value as Element }),
                })
            )
          : [],
      ],
      cast: [
        Object.keys(commandItems).filter((name) => {
          const item = commandItems[name];
          return (
            (item.spell || item.skill) &&
            !["zap", "block"].includes(item.skill!)
          );
        }),
        materials,
        elements,
      ],
      stat: [
        [...unitStats, ...npcTypes, ...commandStats],
        words[1] === "class" ? classes : words[1] === "hair" ? hairNames : [],
      ],
      mod: [commandMods],
      list: [commandLists],
      new: [cellNames, ["1"], orientations],
      tp: [command === "tp" ? identifiers() : []],
      focus: [command === "focus" ? identifiers() : []],
    };
    values = argumentsByCommand[command || ""]?.[words.length - 2] || [];
  }

  const matches = sorted([...new Set(values)]).filter((value) =>
    value.startsWith(last)
  );
  if (!matches.length) return "";
  return matches[normalize(selection, matches.length)].slice(last.length) + " ";
};

export const parseCommand = (prompt: string): CommandCall | undefined => {
  prompt = prompt.trim();
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
  entity: TypedEntity,
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
