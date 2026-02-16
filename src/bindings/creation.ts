import { Entity } from "ecs";
import { isTouch } from "../components/Dimensions";
import { entities, World } from "../engine";
import { ACTIONABLE } from "../engine/components/actionable";
import {
  AFFECTABLE,
  getEmptyAffectable,
} from "../engine/components/affectable";
import { ATTACKABLE } from "../engine/components/attackable";
import { BEHAVIOUR } from "../engine/components/behaviour";
import { BELONGABLE } from "../engine/components/belongable";
import { BURNABLE } from "../engine/components/burnable";
import { COLLECTABLE } from "../engine/components/collectable";
import { COLLIDABLE } from "../engine/components/collidable";
import { DISPLACABLE } from "../engine/components/displacable";
import { DROPPABLE } from "../engine/components/droppable";
import { ENTERABLE } from "../engine/components/enterable";
import { EQUIPPABLE } from "../engine/components/equippable";
import { FOCUSABLE } from "../engine/components/focusable";
import { Fog, FOG } from "../engine/components/fog";
import { FRAGMENT } from "../engine/components/fragment";
import { FREEZABLE } from "../engine/components/freezable";
import { IMMERSIBLE } from "../engine/components/immersible";
import { INVENTORY } from "../engine/components/inventory";
import { ITEM, Item } from "../engine/components/item";
import { LAYER } from "../engine/components/layer";
import { BiomeName, LEVEL } from "../engine/components/level";
import { LIGHT } from "../engine/components/light";
import { LOCKABLE } from "../engine/components/lockable";
import { LOOTABLE } from "../engine/components/lootable";
import { MELEE } from "../engine/components/melee";
import { MOVABLE } from "../engine/components/movable";
import { NPC, NpcType, npcTypes } from "../engine/components/npc";
import {
  ORIENTABLE,
  Orientation,
  orientations,
} from "../engine/components/orientable";
import { Position, POSITION } from "../engine/components/position";
import { RECHARGABLE } from "../engine/components/rechargable";
import { REFERENCE } from "../engine/components/reference";
import { RENDERABLE } from "../engine/components/renderable";
import {
  FocusSequence,
  FountainSequence,
  SEQUENCABLE,
  VortexSequence,
  WormSequence,
} from "../engine/components/sequencable";
import { SPAWNABLE } from "../engine/components/spawnable";
import { SPIKABLE } from "../engine/components/spikable";
import { Sprite, SPRITE } from "../engine/components/sprite";
import { STATS } from "../engine/components/stats";
import { STRUCTURABLE } from "../engine/components/structurable";
import { SWIMMABLE } from "../engine/components/swimmable";
import { TEMPO } from "../engine/components/tempo";
import { TOOLTIP } from "../engine/components/tooltip";
import { TRACKABLE } from "../engine/components/trackable";
import { VIEWABLE } from "../engine/components/viewable";
import { WARPABLE } from "../engine/components/warpable";
import { TypedEntity } from "../engine/entities";
import { getLockable } from "../engine/systems/action";
import { defaultLight, roomLight, spawnLight } from "../engine/systems/consume";
import {
  createItemAsDrop,
  createItemInInventory,
} from "../engine/systems/drop";
import { getEnterable } from "../engine/systems/enter";
import { createHero } from "../engine/systems/fate";
import { applySnow } from "../engine/systems/freeze";
import { getHasteInterval } from "../engine/systems/movement";
import { createPopup } from "../engine/systems/popup";
import { createSequence } from "../engine/systems/sequence";
import { getIdentifier, setIdentifier } from "../engine/utils";
import { colors } from "../game/assets/colors";
import {
  apple,
  banana,
  blockDown,
  blockUp,
  bush,
  campfire,
  coconut,
  createButton,
  createDialog,
  createText,
  createTooltip,
  delay,
  doorOpen,
  enemySpawner,
  fire,
  fog,
  fountain,
  fountainCorner,
  fountainSide,
  fruit,
  getOrientedSprite,
  getStatSprite,
  granite,
  grass,
  heal,
  heart,
  herb,
  ice,
  info,
  ironMine,
  leaves,
  leverOn,
  mana,
  maxCountable,
  mergeSprites,
  minCountable,
  none,
  oakBurnt,
  palm1,
  palm2,
  palmBurnt1,
  palmBurnt2,
  parseSprite,
  path,
  portal,
  portalVortex,
  rock1,
  rock2,
  sand,
  shadow,
  shroom,
  stem,
  swirl,
  tree1,
  tree2,
  treeBurnt1,
  treeBurnt2,
  wall,
  waterShallow,
  leverOff,
  waterDeep,
  desertPalmBurnt1,
  desertPalmBurnt2,
  mapDiscovery,
  scout,
  oakStem,
  oakLeaves,
  oakMouth,
  wormMouth,
} from "../game/assets/sprites";
import {
  anvil,
  basementLeftInside,
  basementRightInside,
  fenceBurnt1,
  fenceBurnt2,
  fenceDoor,
  fenceDoorBurnt,
  fenceDoorBurntPath,
  fenceDoorOpen,
  fenceDoorOpenPath,
  fenceDoorPath,
  house,
  houseDruid,
  houseSmith,
  houseLeft,
  houseRight,
  houseTrader,
  kettle,
  roof,
  roofDown,
  roofDownLeft,
  roofLeft,
  roofLeftUp,
  roofLeftUpInside,
  roofRight,
  roofRightDown,
  roofUp,
  roofUpInside,
  roofUpRight,
  roofUpRightInside,
  sign,
  wallInside,
  window,
  windowInside,
} from "../game/assets/sprites/structures";
import {
  createItemName,
  createUnitName,
  frameWidth,
  getItemSprite,
  npcSequence,
} from "../game/assets/utils";
import {
  generateNpcData,
  generateUnitData,
  UnitKey,
} from "../game/balancing/units";
import {
  getOverlappingCell,
  iterateMatrix,
  mapMatrix,
  Matrix,
  setMatrix,
} from "../game/math/matrix";
import {
  add,
  choice,
  combine,
  copy,
  distribution,
  normalize,
  Point,
  random,
  repeat,
  reversed,
  signedDistance,
} from "../game/math/std";
import { CLICKABLE } from "../engine/components/clickable";
import { centerSprites, overlay } from "../game/assets/pixels";
import { levelConfig } from "../game/levels";
import { POPUP } from "../engine/components/popup";
import { openDoor } from "../engine/systems/trigger";
import { craftingRecipes } from "../game/balancing/crafting";
import addHarvestable, { HARVESTABLE } from "../engine/components/harvestable";
import { getHarvestConfig } from "../game/balancing/harvesting";
import { SHOOTABLE } from "../engine/components/shootable";
import { VANISHABLE } from "../engine/components/vanishable";
import { recolorSprite } from "../game/assets/templates";
import { doorClosed, entryClosed } from "../game/assets/templates/units";
import { compass } from "../game/assets/templates/equipments";
import { bottle, key } from "../game/assets/templates/items";

export const cellNames = [
  "air",
  "player",
  "water_shallow",
  "water_deep",
  "sand",
  "path",
  "mountain",
  "ore",
  "stone",
  "desert_stone",
  "rock",
  "desert_rock",
  "tree",
  "hedge",
  "bush",
  "grass",
  "cactus",
  "ice",
  "snow",
  "palm",
  "palm_fruit",
  "desert_palm",
  "desert_palm_fruit",
  "fence",
  "fruit",
  "wood",
  "berry",
  "flower",
  "leaf",
  "tumbleweed",
  "pot",
  ...npcTypes,
] as const;
export type CellType = (typeof cellNames)[number];

const populateItems = (
  world: World,
  entity: TypedEntity<"INVENTORY">,
  items: Omit<Item, "carrier">[],
  equip: boolean = true
) => {
  for (const item of items) {
    if (item.equipment === "sword") {
      createItemInInventory(
        world,
        entity,
        entities.createSword,
        {
          [ITEM]: item,
          [ORIENTABLE]: {},
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: getItemSprite(item),
        },
        equip
      );
    } else if (item.stackable === "note") {
      createItemInInventory(
        world,
        entity,
        entities.createNote,
        {
          [ITEM]: item,
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: getItemSprite(item),
          [POPUP]: {
            active: false,
            verticalIndezes: [0],
            horizontalIndex: 0,
            selections: [],
            deals: [],
            recipes: [],
            lines: [[]],
            objectives: [],
            choices: [],
            targets: [],
            viewpoint: world.getEntityId(entity),
            tabs: ["info"],
          },
        },
        equip
      );
    } else if (item.equipment === "compass") {
      createItemInInventory(
        world,
        entity,
        entities.createCompass,
        {
          [ITEM]: item,
          [ORIENTABLE]: {},
          [TRACKABLE]: {},
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: getItemSprite(item),
        },
        equip
      );
    } else {
      createItemInInventory(
        world,
        entity,
        entities.createItem,
        {
          [ITEM]: item,
          [SPRITE]: item.stat
            ? getStatSprite(item.stat, equip ? "resource" : "drop")
            : getItemSprite(item, equip ? "resource" : undefined),
        },
        equip
      );
    }
  }
};

export const populateInventory = (
  world: World,
  entity: TypedEntity<"INVENTORY">,
  items: Omit<Item, "carrier" | "bound">[],
  equipments: Omit<Item, "carrier">[] = []
) => {
  populateItems(
    world,
    entity,
    items.map((item) => ({ ...item, bound: false })),
    false
  );
  populateItems(world, entity, equipments);
};

export const smoothenWater = (cellMatrix: Matrix<CellType>): Matrix<CellType> =>
  mapMatrix(cellMatrix, (x, y, cell) => {
    if (cell !== "water_deep") return cell;

    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const neighbour = getOverlappingCell(
          cellMatrix,
          x + offsetX,
          y + offsetY
        );

        if (neighbour !== "water_deep") {
          return "water_shallow";
        }
      }
    }
    return cell;
  });

export const smoothenSand = (
  cellMatrix: Matrix<CellType>,
  biomeMatrix: Matrix<BiomeName>
) => {
  iterateMatrix(cellMatrix, (x, y, cell) => {
    if (cell !== "water_shallow" && cell !== "water_deep") return;

    const targetCell = biomeMatrix[x][y] === "glacier" ? "ice" : "sand";

    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const target = { x: x + offsetX, y: y + offsetY };
        const neighbour = getOverlappingCell(cellMatrix, target.x, target.y);

        if (neighbour === "air") {
          setMatrix(cellMatrix, x, y, targetCell);
        }
      }
    }
  });
  return cellMatrix;
};

export const smoothenBeaches = (
  cellMatrix: Matrix<CellType>,
  biomeMatrix: Matrix<BiomeName>
) => smoothenWater(smoothenSand(cellMatrix, biomeMatrix));

export const assignBuilding = (
  world: World,
  position: Point,
  priority: number = 50
) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  const buildingEntity = entities.createBuilding(world, {
    [FOG]: { visibility: "hidden", type: "terrain" },
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [STRUCTURABLE]: {},
    [VIEWABLE]: { active: false, priority },
  });
  const buildingId = world.getEntityId(buildingEntity);
  let doorEntity: Entity | undefined;

  const fragmentEntities: Entity[] = [];

  // find bottom edge of building
  let downCursor = copy(position);
  while (true) {
    const target = getEnterable(world, add(downCursor, { x: 0, y: 1 }));

    if (!target) break;

    downCursor = target[POSITION];
  }

  // find left edge of building
  let leftCursor = copy(downCursor);
  while (true) {
    const target = getEnterable(world, add(leftCursor, { x: -1, y: 0 }));

    if (!target) break;

    leftCursor = target[POSITION];
  }

  // find right edge of building
  let rightCursor = copy(downCursor);
  while (true) {
    const target = getEnterable(world, add(rightCursor, { x: 1, y: 0 }));

    if (!target) break;

    rightCursor = target[POSITION];
  }

  // fill square area of building
  let upCursor = add(rightCursor, { x: 0, y: 1 });
  while (true) {
    const fillPosition =
      signedDistance(upCursor.x, rightCursor.x, size) === 0
        ? { x: leftCursor.x, y: upCursor.y - 1 }
        : add(upCursor, { x: 1, y: 0 });
    const target = getEnterable(world, fillPosition);

    if (!target) break;

    upCursor = target[POSITION];
    fragmentEntities.push(target);

    // save door for convenience
    const door = getLockable(world, fillPosition);
    if (door) doorEntity = door;
  }

  for (const fragmentEntity of fragmentEntities) {
    world.addComponentToEntity(fragmentEntity, FRAGMENT, {
      structure: buildingId,
    });
  }

  const width = Math.abs(signedDistance(leftCursor.x, rightCursor.x, size)) + 1;
  const height = Math.abs(signedDistance(leftCursor.y, upCursor.y, size)) + 1;

  buildingEntity[VIEWABLE].fraction = {
    x: width % 2 === 0 ? 0.5 : 0,
    y: height % 2 === 0 ? 0.5 : 0,
  };

  return {
    building: buildingEntity,
    fragments: fragmentEntities,
    door: doorEntity,
  };
};

export const createNpc = (
  world: World,
  npcKey: NpcType,
  position: Position
) => {
  const npcUnit = generateNpcData(npcKey);
  const npcEntity = entities.createVillager(world, {
    [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
    [AFFECTABLE]: getEmptyAffectable(),
    [ATTACKABLE]: { scratchColor: npcUnit.scratch },
    [BEHAVIOUR]: { patterns: npcUnit.patterns },
    [BELONGABLE]: { faction: npcUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: {
      decayed: false,
      evaporate: npcUnit.evaporate,
      remains: npcUnit.remains,
    },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [] },
    [LAYER]: {},
    [MELEE]: {},
    [MOVABLE]: {
      bumpGeneration: 0,
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
      flying: false,
    },
    [NPC]: { type: npcUnit.type },
    [ORIENTABLE]: {},
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SHOOTABLE]: { shots: 0 },
    [SPRITE]: npcUnit.sprite,
    [STATS]: npcUnit.stats,
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [],
      persistent: true,
      nextDialog: -1,
    },
  });
  populateInventory(world, npcEntity, npcUnit.items, npcUnit.equipments);
  setIdentifier(world, npcEntity, npcKey);
  return npcEntity;
};

export const createChest = (
  world: World,
  unitKey: UnitKey,
  position: Position,
  items?: Omit<Item, "carrier" | "bound">[]
) => {
  const chestData = generateUnitData(unitKey);
  const chestEntity = entities.createChest(world, {
    [ATTACKABLE]: { scratchColor: chestData.scratch },
    [BELONGABLE]: { faction: chestData.faction },
    [DROPPABLE]: { decayed: false, remains: chestData.remains },
    [INVENTORY]: { items: [] },
    [FOG]: { visibility: "hidden", type: "object" },
    [LAYER]: {},
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SHOOTABLE]: { shots: 0 },
    [SPRITE]: chestData.sprite,
    [STATS]: chestData.stats,
    [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
  });
  populateInventory(world, chestEntity, items || chestData.items);
  return chestEntity;
};

export const createSign = (
  world: World,
  position: Position,
  lines: Sprite[][][]
) => {
  const signData = generateUnitData("sign");
  const signEntity = entities.createSign(world, {
    [ATTACKABLE]: { scratchColor: signData.scratch },
    [BELONGABLE]: { faction: signData.faction },
    [BURNABLE]: {
      burning: false,
      eternal: false,
      simmer: false,
      decayed: false,
      combusted: false,
      remains: choice(treeBurnt1, treeBurnt2),
    },
    [DROPPABLE]: {
      decayed: false,
      remains: choice(treeBurnt1, treeBurnt2),
    },
    [FOG]: { visibility: "hidden", type: "object" },
    [INVENTORY]: { items: [] },
    [LAYER]: {},
    [POSITION]: position,
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SHOOTABLE]: { shots: 0 },
    [SPRITE]: signData.sprite,
    [STATS]: signData.stats,
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: -1,
    },
  });
  populateInventory(world, signEntity, signData.items);
  createPopup(world, signEntity, {
    lines,
    tabs: repeat("info", lines.length),
  });
  return signEntity;
};

export const flipArea = (
  area: string,
  vertical: boolean,
  horizontal: boolean
) => {
  const lines = area.split("\n");
  return [...(vertical ? reversed(lines) : lines)]
    .map((lineString) => {
      const line = lineString.split("");
      return [...(horizontal ? reversed(line) : line)].join("");
    })
    .join("\n");
};

export const insertArea = (
  world: World,
  area: string,
  xOffset: number,
  yOffset: number,
  override = false
) => {
  const areaRows = area.split("\n");
  const matrix = world.metadata.gameEntity[LEVEL].cells;
  const width = matrix.length;
  const height = matrix[0].length;

  areaRows.forEach((row, rowIndex) => {
    row.split("").forEach((cell, columnIndex) => {
      const x = normalize(columnIndex - (row.length - 1) / 2 + xOffset, width);
      const y = normalize(
        rowIndex - (areaRows.length - 1) / 2 + yOffset,
        height
      );

      if ((!override && cell === " ") || (override && cell === "?")) return;

      let entity = "air";
      if (cell === "█") entity = "mountain";
      else if (cell === "≈") entity = "water_deep";
      else if (cell === "~") entity = "water_shallow";
      else if (cell === "░") entity = "beach";
      else if (cell === "%") entity = "ice";
      else if (cell === "+") entity = "snow";
      else if (cell === "▒") entity = "path";
      else if (cell === "▓") entity = "block";
      else if (cell === "X") entity = "granite";
      else if (cell === "▄") entity = "block_down";
      else if (cell === "▀") entity = "block_up";
      else if (cell === "◙") entity = "iron_entry";
      else if (cell === "◘") entity = "ore_one";
      else if (cell === "∙") entity = "coin_one";
      else if (cell === "o") entity = "intro_pot";
      else if (cell === "φ") entity = "compass";
      else if (cell === "■") entity = "tutorial_box";
      else if (cell === "#") entity = "tree";
      else if (cell === "¶") entity = "palm";
      else if (cell === "(") entity = "banana";
      else if (cell === "¥") entity = "cactus";
      else if (cell === ">") entity = "rock";
      else if (cell === "^") entity = "desert_rock";
      else if (cell === "≡") entity = "wood_one";
      else if (cell === ".") entity = "fruit_one";
      else if (cell === ";") entity = "mushroom";
      else if (cell === "ß") entity = "hedge";
      else if (cell === "&") entity = "path_hedge";
      else if (cell === "τ") entity = "bush";
      else if (cell === "ô") entity = "oak_bush";
      else if (cell === "'") entity = "berry_one";
      else if (cell === ",") entity = "grass";
      else if (cell === "·") entity = "flower_one";
      else if (cell === "♀") entity = "player";
      else if (cell === "÷") entity = "spawner";
      else if (cell === "◀") entity = "prism";
      else if (cell === "0") entity = "eye";
      else if (cell === "*") entity = "campfire";
      else if (cell === "!") entity = "iron_key";
      else if (cell === "¡") entity = "spawn_key";
      else if (cell === "x") entity = "fireplace";
      else if (cell === "Ω") entity = "dummy";
      else if (cell === "±") entity = "fence";
      else if (cell === "=") entity = "fence_door";
      else if (cell === "├") entity = "house_left";
      else if (cell === "└") entity = "basement_left";
      else if (cell === "┤") entity = "house_right";
      else if (cell === "┘") entity = "basement_right";
      else if (cell === "┴") entity = "wall";
      else if (cell === "─") entity = "wall_window";
      else if (cell === "┼") entity = "house";
      else if (cell === "┬") entity = "house_window";
      else if (cell === "╬") entity = "roof";
      else if (cell === "╠") entity = "roof_left";
      else if (cell === "╣") entity = "roof_right";
      else if (cell === "╒") entity = "roof_left_up";
      else if (cell === "╦") entity = "roof_up";
      else if (cell === "╕") entity = "roof_up_right";
      else if (cell === "╞") entity = "roof_down_left";
      else if (cell === "╪") entity = "roof_down";
      else if (cell === "╡") entity = "roof_right_down";
      else if (cell === "m") entity = "menu_sign";
      else if (cell === "s") entity = "spawn_sign";
      else if (cell === "f") entity = "fruit_sign";
      else if (cell === "F") entity = "fruit_chest";
      else if (cell === "p") entity = "potion_sign";
      else if (cell === "P") entity = "potion_chest";
      else if (cell === "g") entity = "guide_sign";
      else if (cell === "G") entity = "guide_door";
      else if (cell === "N") entity = "nomad_door";
      else if (cell === "Y") entity = "chest_tower";
      else if (cell === "y") entity = "chest_tower_statue";
      else if (cell === "I") entity = "ilex_elite";
      else if (cell === "i") entity = "ilexChest";
      else if (cell === "O") entity = "oak_boss";
      else if (cell === "C") entity = "chest_boss";
      else if (cell === "∩") entity = "portal";
      else if (cell === "⌠") entity = "fountain";
      else if (cell === "1") entity = "1";
      else if (cell === "½") entity = "settings_sound";
      else if (cell === "¼") entity = "settings_controls";
      else if (!override) {
        console.error(`Unrecognized cell: "${cell}"!`);
      }

      // TODO: properly type all cells
      matrix[x][y] = entity as CellType;
    });
  });
};

export const createCell = (
  world: World,
  position: Position,
  cell: string,
  visibility: Fog["visibility"],
  air = true
): { cell: TypedEntity; all: TypedEntity[] } => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const x = normalize(position.x, size);
  const y = normalize(position.y, size);
  const all: TypedEntity[] = [];

  // track distribution of cell types
  world.metadata.gameEntity[LEVEL].cellPositions[cell] = (
    world.metadata.gameEntity[LEVEL].cellPositions[cell] || []
  ).concat([{ x, y }]);

  if (cell !== "" && air) {
    all.push(
      entities.createGround(world, {
        [FOG]: { visibility, type: "air" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: fog,
      })
    );
  }

  if (!cell) {
    return { cell: all[0], all };
  } else if (cell === "player") {
    const hero = getIdentifier(world, "hero");
    if (hero) {
      all.push(hero);
      hero[POSITION] = { x, y };
      return { cell: hero, all };
    }

    // create viewpoint for inspecting
    const inspectEntity = entities.createViewpoint(world, {
      [POSITION]: { x: 0, y: 0 },
      [RENDERABLE]: { generation: 0 },
      [VIEWABLE]: { active: false, priority: 90 },
    });
    all.push(inspectEntity);
    setIdentifier(world, inspectEntity, "inspect");

    // set initial focus on hero
    const highlighEntity = entities.createHighlight(world, {
      [FOCUSABLE]: {},
      [MOVABLE]: {
        bumpGeneration: 0,
        orientations: [],
        reference: world.getEntityId(world.metadata.gameEntity),
        spring: {
          duration: 500,
        },
        lastInteraction: 0,
        flying: false,
      },
      [ORIENTABLE]: {},
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: none,
      [TRACKABLE]: {},
    });
    all.push(highlighEntity);
    createSequence<"focus", FocusSequence>(
      world,
      highlighEntity,
      "focus",
      "focusCircle",
      {}
    );
    setIdentifier(world, highlighEntity, "focus");

    // create spawn dummy to set needle target
    const spawnEntity = entities.createViewpoint(world, {
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [VIEWABLE]: { active: false, priority: 30 },
    });
    all.push(spawnEntity);
    setIdentifier(world, spawnEntity, "spawn");
    const heroEntity = createHero(world, {
      [POSITION]: copy(spawnEntity[POSITION]),
      [BELONGABLE]: { faction: "settler" },
      [SPAWNABLE]: {
        classKey: "scout",
        hairColor: colors.white,
        position: copy(spawnEntity[POSITION]),
        viewable: { active: true, priority: 10 },
        light: {
          ...(world.metadata.gameEntity[LEVEL].name === "LEVEL_MENU"
            ? spawnLight
            : world.metadata.gameEntity[LEVEL].name === "LEVEL_TUTORIAL"
            ? roomLight
            : defaultLight),
        },
      },
    });
    all.push(heroEntity);
    return { cell: heroEntity, all };
  } else if (cell === "mountain") {
    const mountainEntity = entities.createMountain(world, {
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [SPRITE]: wall,
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [RENDERABLE]: { generation: 0 },
      [COLLIDABLE]: {},
    });
    all.push(mountainEntity);
    return { cell: mountainEntity, all };
  } else if (cell === "granite") {
    const mountainEntity = entities.createMountain(world, {
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [SPRITE]: granite,
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [RENDERABLE]: { generation: 0 },
      [COLLIDABLE]: {},
    });
    all.push(mountainEntity);
    return { cell: mountainEntity, all };
  } else if (cell === "rock" || cell === "desert_rock") {
    const rock = (["rock1", "rock2"] as const)[random(0, 1)];
    const { items, sprite, stats, faction, scratch } = generateUnitData(rock);
    const sprites = {
      rock: { rock1, rock2 },
      desert_rock: { [rock]: sprite },
    };
    const rockEntity = entities.createDeposit(world, {
      [ATTACKABLE]: { scratchColor: scratch },
      [BELONGABLE]: { faction },
      [DROPPABLE]: {
        decayed: false,
        remains: cell === "desert_rock" ? sand : undefined,
      },
      [FOG]: { visibility, type: "object" },
      [INVENTORY]: { items: [] },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: sprites[cell][rock],
      [STATS]: stats,
    });
    all.push(rockEntity);
    populateInventory(world, rockEntity, items);
    if (cell === "desert_rock") {
      const areaEntity = entities.createArea(world, {
        [POSITION]: { x, y },
        [TEMPO]: { amount: -1 },
      });
      all.push(areaEntity);
    }
    return { cell: rockEntity, all };
  } else if (cell === "iron") {
    const mineEntity = entities.createMine(world, {
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: ironMine,
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [COLLIDABLE]: {},
    });
    all.push(mineEntity);
    return { cell: mineEntity, all };
  } else if (cell === "ore" || cell === "ore_one") {
    const oreEntity = entities.createOre(world, {
      [INVENTORY]: { items: [] },
      [LOOTABLE]: { disposable: false },
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: wall,
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [COLLIDABLE]: {},
    });
    all.push(oreEntity);
    populateInventory(
      world,
      oreEntity,
      [],
      [
        {
          amount: cell === "ore" ? distribution(80, 15, 5) + 1 : 1,
          stackable: "ore",
          bound: false,
        },
      ]
    );
    return { cell: oreEntity, all };
  } else if (cell === "stone" || cell === "desert_stone") {
    if (cell === "desert_stone") {
      all.push(
        entities.createTile(world, {
          [FOG]: { visibility, type: "object" },
          [POSITION]: { x, y },
          [RENDERABLE]: { generation: 0 },
          [SPRITE]: sand,
          [TEMPO]: { amount: -1 },
        })
      );
    }
    const stoneEntity = createItemAsDrop(
      world,
      { x, y },
      entities.createItem,
      {
        [ITEM]: {
          stackable: "ore",
          amount: 1,
          bound: false,
        },
        [SPRITE]: getItemSprite({ stackable: "ore" }),
      },
      cell === "desert_stone"
    );
    all.push(stoneEntity);
    return { cell: stoneEntity, all };
  } else if (["block", "block_down", "block_up"].includes(cell)) {
    if (cell === "block" || cell === "block_down") {
      all.push(
        entities.createBlock(world, {
          [CLICKABLE]: { clicked: false, player: true },
          [COLLIDABLE]: {},
          [FOG]: { visibility, type: "object" },
          [POSITION]: { x, y },
          [SPRITE]: blockDown,
          [RENDERABLE]: { generation: 0 },
        })
      );
    }
    if (cell === "block" || cell === "block_up") {
      all.push(
        entities.createBlock(world, {
          [CLICKABLE]: { clicked: false, player: true },
          [COLLIDABLE]: {},
          [FOG]: { visibility, type: "object" },
          [POSITION]: { x, y },
          [SPRITE]: blockUp,
          [RENDERABLE]: { generation: 0 },
        })
      );
    }
    return { cell: all[0], all };
  } else if (cell === "beach" || cell === "desert" || cell === "sand") {
    const tileEntity = entities.createTile(world, {
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: sand,
      [TEMPO]: { amount: -1 },
    });
    all.push(tileEntity);
    return { cell: tileEntity, all };
  } else if (cell === "path") {
    const tileEntity = entities.createTile(world, {
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: path,
      [TEMPO]: { amount: 2 },
    });
    all.push(tileEntity);
    return { cell: tileEntity, all };
  } else if (cell === "water_shallow" || cell === "spring") {
    const waterEntity = entities.createWater(world, {
      [FOG]: { visibility, type: "terrain" },
      [FREEZABLE]: { frozen: false },
      [IMMERSIBLE]: { type: "water", deep: false },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: waterShallow,
      [TEMPO]: { amount: -2 },
    });
    all.push(waterEntity);
    return { cell: waterEntity, all };
  } else if (cell === "water_deep") {
    const waterEntity = entities.createWater(world, {
      [FOG]: { visibility, type: "terrain" },
      [FREEZABLE]: { frozen: false },
      [IMMERSIBLE]: { type: "water", deep: true },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: waterDeep,
      [TEMPO]: { amount: -2 },
    });
    all.push(waterEntity);
    return { cell: waterEntity, all };
  } else if (cell === "ice") {
    const iceEntity = entities.createIce(world, {
      [FOG]: { visibility, type: "terrain" },
      [FREEZABLE]: { frozen: true },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: ice,
      [TEMPO]: { amount: 0 },
    });
    all.push(iceEntity);
    return { cell: iceEntity, all };
  } else if (cell === "snow") {
    const snowEntity = applySnow(world, { x, y });
    all.push(snowEntity);
    return { cell: snowEntity, all };
  } else if (cell === "wood" || cell === "wood_one") {
    const woodEntity = createItemAsDrop(world, { x, y }, entities.createItem, {
      [ITEM]: {
        stackable: "stick",
        amount: cell === "wood_one" ? 1 : distribution(80, 15, 5) + 1,
        bound: false,
      },
      [SPRITE]: getItemSprite({ stackable: "stick" }, "resource"),
    });
    all.push(woodEntity);
    if (cell === "wood_one")
      setIdentifier(world, world.assertById(woodEntity[ITEM].carrier), cell);
    return { cell: woodEntity, all };
  } else if (cell === "fruit" || cell === "fruit_one") {
    if (random(0, 1) === 0 || cell === "fruit_one") {
      const { harvestable, yields } = getHarvestConfig(world, "tree", "wood");
      const remains = [treeBurnt1, treeBurnt2][random(0, 1)];
      const treeEntity = entities.createOrganic(world, {
        [BURNABLE]: {
          burning: false,
          eternal: false,
          simmer: false,
          combusted: false,
          decayed: false,
          remains,
        },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false, remains },
        [FOG]: { visibility, type: "object" },
        [HARVESTABLE]: harvestable,
        [INVENTORY]: { items: [] },
        [ORIENTABLE]: {},
        [MOVABLE]: {
          bumpGeneration: 0,
          orientations: [],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: {
            duration: 100,
          },
          lastInteraction: 0,
          flying: false,
        },
        [POSITION]: { x, y },
        [SPRITE]: tree2,
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
      });
      all.push(treeEntity);
      populateInventory(world, treeEntity, yields);

      const fruitEntity = entities.createContainer(world, {
        [FOG]: { visibility, type: "object" },
        [INVENTORY]: { items: [] },
        [LAYER]: {},
        [LOOTABLE]: { disposable: true },
        [POSITION]: { x, y },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: tree2,
        [SWIMMABLE]: { swimming: false },
        [RENDERABLE]: { generation: 0 },
      });
      all.push(fruitEntity);
      populateInventory(
        world,
        fruitEntity,
        [],
        [
          {
            amount: 1,
            stackable: "apple",
            bound: false,
          },
        ]
      );
      return { cell: fruitEntity, all };
    }

    const fruitEntity = createItemAsDrop(
      world,
      { x, y },
      entities.createItem,
      {
        [ITEM]: {
          amount: 1,
          stackable: "shroom",
          bound: false,
        },
        [SPRITE]: getItemSprite({ stackable: "shroom" }),
      },
      false
    );
    all.push(fruitEntity);
    return { cell: fruitEntity, all };
  } else if (cell === "mushroom") {
    const mushroomEntity = createItemAsDrop(
      world,
      { x, y },
      entities.createItem,
      {
        [ITEM]: {
          stackable: "shroom",
          amount: 1,
          bound: false,
        },
        [SPRITE]: getItemSprite({ stackable: "shroom" }, "resource"),
      }
    );
    all.push(mushroomEntity);
    return { cell: mushroomEntity, all };
  } else if (cell === "tree" || cell === "leaves") {
    if (cell === "leaves") {
      const rootEntity = entities.createRoot(world, {
        [BURNABLE]: {
          burning: false,
          eternal: false,
          simmer: false,
          combusted: false,
          decayed: false,
          remains: oakBurnt,
        },
        [COLLIDABLE]: {},
        [FOG]: { visibility, type: "object" },
        [FRAGMENT]: { structure: -1 },
        [POSITION]: { x, y: y + 1 },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: stem,
        [STRUCTURABLE]: {},
      });
      all.push(rootEntity);
      const rootId = world.getEntityId(rootEntity);
      rootEntity[FRAGMENT].structure = rootId;

      const leavesEntity = entities.createPlant(world, {
        [BURNABLE]: {
          burning: false,
          eternal: false,
          simmer: false,
          combusted: false,
          decayed: false,
        },
        [FOG]: { visibility, type: "object" },
        [FRAGMENT]: { structure: rootId },
        [COLLIDABLE]: {},
        [POSITION]: { x, y },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: leaves,
        [RENDERABLE]: { generation: 0 },
      });
      all.push(leavesEntity);

      return { cell: leavesEntity, all };
    }

    const { harvestable, yields } = getHarvestConfig(world, "tree", "wood");
    const remains = [treeBurnt1, treeBurnt2][random(0, 1)];
    const treeEntity = entities.createOrganic(world, {
      [BURNABLE]: {
        burning: false,
        eternal: false,
        simmer: false,
        combusted: false,
        decayed: false,
        remains,
      },
      [COLLIDABLE]: {},
      [DROPPABLE]: { decayed: false, remains },
      [FOG]: { visibility, type: "object" },
      [HARVESTABLE]: harvestable,
      [INVENTORY]: { items: [] },
      [ORIENTABLE]: {},
      [MOVABLE]: {
        bumpGeneration: 0,
        orientations: [],
        reference: world.getEntityId(world.metadata.gameEntity),
        spring: {
          duration: 100,
        },
        lastInteraction: 0,
        flying: false,
      },
      [POSITION]: { x, y },
      [SPRITE]: [tree1, tree2][distribution(50, 50)],
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
    });
    all.push(treeEntity);
    populateInventory(world, treeEntity, yields);
    return { cell: treeEntity, all };
  } else if (
    cell === "palm" ||
    cell === "palm_fruit" ||
    cell === "desert_palm" ||
    cell === "desert_palm_fruit" ||
    cell === "banana"
  ) {
    const [stack, palm] = (
      [
        ["coconut", palm1],
        ["banana", palm2],
      ] as const
    )[cell === "banana" ? 1 : random(0, 1)];

    all.push(
      entities.createArea(world, {
        [POSITION]: { x, y },
        [TEMPO]: { amount: -1 },
      })
    );

    const { harvestable, yields } = getHarvestConfig(world, "tree", "iron");
    const remains =
      cell === "palm"
        ? [palmBurnt1, palmBurnt2][random(0, 1)]
        : [desertPalmBurnt1, desertPalmBurnt2][random(0, 1)];
    const palmEntity = entities.createOrganic(world, {
      [BURNABLE]: {
        burning: false,
        eternal: false,
        simmer: false,
        combusted: false,
        decayed: false,
        remains,
      },
      [COLLIDABLE]: {},
      [DROPPABLE]: { decayed: false, remains },
      [FOG]: { visibility, type: "object" },
      [HARVESTABLE]: harvestable,
      [INVENTORY]: { items: [] },
      [ORIENTABLE]: {},
      [MOVABLE]: {
        bumpGeneration: 0,
        orientations: [],
        reference: world.getEntityId(world.metadata.gameEntity),
        spring: {
          duration: 100,
        },
        lastInteraction: 0,
        flying: false,
      },
      [POSITION]: { x, y },
      [SPRITE]: palm,
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
    });
    all.push(palmEntity);
    populateInventory(world, palmEntity, yields);

    if (
      cell === "palm_fruit" ||
      cell === "desert_palm_fruit" ||
      cell === "banana"
    ) {
      const fruitEntity = entities.createContainer(world, {
        [FOG]: { visibility, type: "object" },
        [INVENTORY]: { items: [] },
        [LAYER]: {},
        [LOOTABLE]: { disposable: true },
        [POSITION]: { x, y },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: palm,
        [SWIMMABLE]: { swimming: false },
        [RENDERABLE]: { generation: 0 },
      });
      all.push(fruitEntity);
      populateInventory(
        world,
        fruitEntity,
        [],
        [
          {
            amount: 1,
            stackable: stack,
            bound: false,
          },
        ]
      );
    }

    return { cell: palmEntity, all };
  } else if (cell === "hedge" || cell === "path_hedge") {
    const { items, sprite, stats, faction, scratch } = generateUnitData(
      (["hedge1", "hedge2"] as const)[random(0, 1)]
    );
    const hedgeEntity = entities.createResource(world, {
      [ATTACKABLE]: { scratchColor: scratch },
      [BELONGABLE]: { faction },
      [BURNABLE]: {
        burning: false,
        eternal: false,
        simmer: false,
        combusted: false,
        decayed: false,
      },
      [DROPPABLE]: { decayed: false },
      [FOG]: { visibility, type: "object" },
      [INVENTORY]: { items: [] },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SHOOTABLE]: { shots: 0 },
      [SPRITE]: sprite,
      [STATS]: stats,
    });
    all.push(hedgeEntity);
    populateInventory(world, hedgeEntity, items);

    if (cell === "path_hedge") {
      all.push(
        entities.createTile(world, {
          [FOG]: { visibility, type: "terrain" },
          [POSITION]: { x, y },
          [RENDERABLE]: { generation: 0 },
          [SPRITE]: path,
          [TEMPO]: { amount: 2 },
        })
      );
    }
    return { cell: hedgeEntity, all };
  } else if (cell === "tumbleweed") {
    const { items, sprite, stats, faction, patterns, scratch } =
      generateUnitData("tumbleweed");
    const tumbleweedEntity = entities.createTumbleweed(world, {
      [ATTACKABLE]: { scratchColor: scratch },
      [BEHAVIOUR]: { patterns },
      [BELONGABLE]: { faction },
      [DROPPABLE]: { decayed: false },
      [FOG]: { visibility, type: "unit" },
      [INVENTORY]: { items: [] },
      [MOVABLE]: {
        bumpGeneration: 0,
        orientations: [],
        reference: world.getEntityId(world.metadata.gameEntity),
        spring: {
          duration: 200,
        },
        lastInteraction: 0,
        flying: true,
      },
      [ORIENTABLE]: {},
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SHOOTABLE]: { shots: 0 },
      [SPRITE]: sprite,
      [STATS]: stats,
    });
    all.push(tumbleweedEntity);
    all.push(
      entities.createTile(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: sand,
        [TEMPO]: { amount: -1 },
      })
    );
    populateInventory(world, tumbleweedEntity, items);
    return { cell: tumbleweedEntity, all };
  } else if (
    cell === "bush" ||
    cell === "oak_bush" ||
    cell === "berry" ||
    cell === "berry_one"
  ) {
    const bushEntity = entities.createWeeds(world, {
      [BURNABLE]: {
        burning: false,
        eternal: false,
        simmer: false,
        combusted: false,
        decayed: false,
      },
      [FOG]: { visibility, type: "object" },
      [POSITION]: { x, y },
      [SPRITE]: bush,
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
    });
    all.push(bushEntity);

    if (cell === "oak_bush") {
      setIdentifier(world, bushEntity, "oak:bush");
    }

    if (cell === "berry" || cell === "berry_one") {
      const berryItem = createItemAsDrop(
        world,
        { x, y },
        entities.createItem,
        {
          [ITEM]: {
            stackable: "berry",
            amount: cell === "berry" ? distribution(80, 15, 5) + 1 : 1,
            bound: false,
          },
          [SPRITE]: getItemSprite({ stackable: "berry" }, "resource"),
        },
        false
      );
      all.push(berryItem);
      return { cell: world.assertById(berryItem[ITEM].carrier), all };
    }
    return { cell: bushEntity, all };
  } else if (cell === "grass" || cell === "flower" || cell === "flower_one") {
    const grassEntity = entities.createWeeds(world, {
      [BURNABLE]: {
        burning: false,
        eternal: false,
        simmer: false,
        combusted: false,
        decayed: false,
      },
      [FOG]: { visibility, type: "object" },
      [POSITION]: { x, y },
      [SPRITE]: grass,
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
    });
    all.push(grassEntity);
    if (cell === "flower" || cell === "flower_one") {
      const flowerItem = createItemAsDrop(
        world,
        { x, y },
        entities.createItem,
        {
          [ITEM]: {
            stackable: "flower",
            amount: cell === "flower" ? distribution(80, 15, 5) + 1 : 1,
            bound: false,
          },
          [SPRITE]: getItemSprite({ stackable: "flower" }, "resource"),
        },
        false
      );
      all.push(flowerItem);
      return { cell: world.assertById(flowerItem[ITEM].carrier), all };
    }
    return { cell: grassEntity, all };
  } else if (cell === "leaf") {
    const leafItem = createItemAsDrop(world, { x, y }, entities.createItem, {
      [ITEM]: {
        stackable: "leaf",
        amount: distribution(80, 15, 5) + 1,
        bound: false,
      },
      [SPRITE]: getItemSprite({ stackable: "leaf" }, "resource"),
    });
    all.push(leafItem);
    return { cell: world.assertById(leafItem[ITEM].carrier), all };
  } else if (cell === "coin_one") {
    const coinItem = createItemAsDrop(world, { x, y }, entities.createItem, {
      [ITEM]: {
        stackable: "coin",
        amount: 1,
        bound: false,
      },
      [SPRITE]: getItemSprite({ stackable: "coin" }, "resource"),
    });
    all.push(coinItem);
    setIdentifier(world, world.assertById(coinItem[ITEM].carrier), "coin");
    return { cell: coinItem, all };
  } else if (cell === "cactus") {
    const { sprite, stats, faction, items, scratch } = generateUnitData(
      (["cactus1", "cactus2"] as const)[random(0, 1)]
    );
    all.push(
      entities.createArea(world, {
        [POSITION]: { x, y },
        [TEMPO]: { amount: -1 },
      })
    );
    const cactusEntity = entities.createCactus(world, {
      [ATTACKABLE]: { scratchColor: scratch },
      [BELONGABLE]: { faction },
      [DROPPABLE]: { decayed: false, remains: sand },
      [FOG]: { visibility, type: "object" },
      [INVENTORY]: { items: [] },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SHOOTABLE]: { shots: 0 },
      [SPIKABLE]: { damage: stats.power },
      [SPRITE]: sprite,
      [STATS]: stats,
    });
    all.push(cactusEntity);
    populateInventory(world, cactusEntity, items);
    return { cell: cactusEntity, all };
  } else if (
    cell === "wood_door" ||
    cell === "guide_door" ||
    cell === "nomad_door" ||
    cell === "iron_door"
  ) {
    const doorEntity = entities.createDoor(world, {
      [ENTERABLE]: { sprite: doorOpen, orientation: "down" },
      [FOG]: { visibility, type: "float" },
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [LOCKABLE]: {
        locked: true,
        material: cell === "iron_door" ? "iron" : "wood",
        sprite: doorOpen,
        type: "door",
      },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]:
        cell === "iron_door"
          ? doorClosed.iron.default
          : doorClosed.wood.default,
      [TOOLTIP]: {
        dialogs: [],
        persistent: false,
        nextDialog: 0,
      },
    });
    all.push(doorEntity);
    if (["guide_door", "nomad_door"].includes(cell)) {
      setIdentifier(world, doorEntity, cell);
    }
    return { cell: doorEntity, all };
  } else if (
    cell === "entry" ||
    cell === "wood_entry" ||
    cell === "iron_entry" ||
    cell === "gold_entry"
  ) {
    const entryEntity = entities.createEntry(world, {
      [FOG]: { visibility, type: "float" },
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [LOCKABLE]: {
        locked: true,
        material:
          cell === "iron_entry"
            ? "iron"
            : cell === "gold_entry"
            ? "gold"
            : "wood",
        type: "entry",
      },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]:
        cell === "iron_entry"
          ? entryClosed.iron.default
          : cell === "gold_entry"
          ? entryClosed.gold.default
          : entryClosed.wood.default,
    });
    all.push(entryEntity);
    if (cell === "entry") {
      openDoor(world, entryEntity);
    }
    return { cell: entryEntity, all };
  } else if (cell === "compass") {
    const compassEntity = createItemAsDrop(
      world,
      { x, y },
      entities.createCompass,
      {
        [ITEM]: {
          equipment: "compass",
          material: "iron",
          amount: 1,
          bound: false,
        },
        [SPRITE]: compass.iron.default,
        [ORIENTABLE]: {},
        [SEQUENCABLE]: { states: {} },
        [TRACKABLE]: {},
      }
    );
    all.push(compassEntity);
    setIdentifier(world, compassEntity, "compass");
    return { cell: compassEntity, all };
  } else if (cell === "spawn_key" || cell === "iron_key") {
    const spawnKeyEntity = createItemAsDrop(
      world,
      { x, y },
      entities.createItem,
      {
        [ITEM]: {
          consume: "key",
          material: "iron",
          amount: 1,
          bound: false,
        },
        [SPRITE]: key.iron.default,
      }
    );
    all.push(spawnKeyEntity);

    if (cell === "spawn_key") {
      setIdentifier(
        world,
        world.assertById(spawnKeyEntity[ITEM].carrier),
        "spawn_key"
      );
    }
    return { cell: spawnKeyEntity, all };
  } else if (cell === "menu_sign") {
    const warpButton = createButton("WARP", 6, false, false, -1, "lime");
    const menuSign = createSign(world, { x, y }, [
      [
        repeat(swirl, 17),
        [
          ...createText("Welcome to "),
          ...createText("ALIVE", colors.maroon),
          ...createText("!"),
        ],
        repeat(swirl, 17),
        [],
        [
          ...createText("I am a "),
          sign,
          ...createText("Sign", colors.grey),
          ...createText(" with"),
        ],
        [
          ...createText("helpful "),
          info,
          ...createText("Tips", colors.grey),
          ...createText("."),
        ],
        [],
        createText("You can scroll by"),
        isTouch
          ? [
              ...createText("swiping "),
              ...createText("UP", colors.grey),
              ...createText("/"),
              ...createText("DOWN", colors.grey),
              ...createText("."),
            ]
          : [
              ...createText("pressing "),
              ...createText("\u0117", colors.grey),
              ...createText(" or "),
              ...createText("\u0118", colors.grey),
              ...createText("."),
            ],
        [],
        [
          ...createText("To change "),
          ...createText("╡", colors.silver),
          ...createText("TABS", colors.lime),
          ...createText("╞", colors.silver),
          ...createText(","),
        ],
        isTouch
          ? [
              ...createText("swipe "),
              ...createText("LEFT", colors.grey),
              ...createText("/"),
              ...createText("RIGHT", colors.grey),
              ...createText("."),
            ]
          : [
              ...createText("press "),
              ...createText("\u011a", colors.grey),
              ...createText(" or "),
              ...createText("\u0119", colors.grey),
              ...createText("."),
            ],
        [],
        createText("Try it out..."),
      ],
      [
        createText("Well done!"),
        [],
        createText("Now walk down and"),
        createText("start a new game:"),
        [],
        [...repeat(none, 4), mapDiscovery],
        [
          ...repeat(none, 3),
          mergeSprites(scout, parseSprite("\x0a_")),
          mergeSprites(portalVortex, portal),
          ...repeat(none, 5),
          ...warpButton[0],
        ],
        [
          none,
          ...createTooltip(world, { [SPRITE]: portal }),
          none,
          ...warpButton[1],
        ],
        [],
        [],
        isTouch
          ? [...createText("Tap", colors.grey), ...createText(" button below")]
          : [
              ...createText("Press "),
              ...createText("[SHIFT]", colors.grey),
              ...createText(" key"),
            ],
        [
          ...createText("to "),
          ...createText("CLOSE", colors.black, colors.red),
          ...createText(" dialogs."),
        ],
        [],
        [...createText("Good luck! "), heart],
      ],
    ]);
    all.push(menuSign);
    return { cell: menuSign, all };
  } else if (cell === "spawn_sign") {
    const spawnSign = createSign(world, { x, y }, [
      [
        [
          ...createText("Open the "),
          ...createItemName({ materialized: "entry", material: "iron" }),
        ],
        [
          ...createText("with a "),
          ...createItemName({ consume: "key", material: "iron" }),

          ...createText("."),
        ],
        [],
        createText("Watch out for the"),
        [
          mergeSprites(campfire, maxCountable(fire)),
          ...createText("Fire", colors.grey),
          ...createText("!"),
        ],
        [],
        [
          ...createText("A "),
          fountain,
          ...createText("Fountain", colors.grey),
          ...createText(" can"),
        ],
        [
          ...createText("always "),
          minCountable(heal),
          ...createText("Heal", colors.lime),
          ...createText(" you."),
        ],
      ],
    ]);
    all.push(spawnSign);
    setIdentifier(world, spawnSign, "spawn_sign");
    return { cell: spawnSign, all };
  } else if (cell === "potion_sign") {
    const signEntity = createSign(world, { x, y }, [
      [
        [
          ...createText("A "),
          bottle.wood.fire,
          ...createItemName({
            consume: "potion",
            material: "wood",
            element: "water",
          }),
          ...createText(" will"),
        ],
        [
          ...createText("restore "),
          heart,
          ...createText("HP", colors.red),
          ...createText("/"),
          mana,
          ...createText("MP", colors.blue),
        ],
        createText("automatically."),
        [],
        createText("It will activate"),
        [
          ...createText("after a "),
          delay,
          ...createText("Delay", colors.olive),
          ...createText("."),
        ],
      ],
    ]);
    all.push(signEntity);
    setIdentifier(world, signEntity, "potion_sign");
    signEntity[SPRITE] = mergeSprites(shadow, signEntity[SPRITE]);
    return { cell: signEntity, all };
  } else if (cell === "fruit_sign") {
    const signEntity = createSign(world, { x, y }, [
      [
        [
          ...createText("Eat "),
          apple,
          shroom,
          banana,
          coconut,
          fruit,
          herb,
          ...createText("Fruit", colors.grey),
        ],
        [
          ...createText("to heal "),
          heart,
          ...createText("HP", colors.red),
          ...createText("/"),
          mana,
          ...createText("MP", colors.blue),
          ...createText("."),
        ],
        [],
        createText("Open inventory by"),
        isTouch
          ? [
              ...createText("tapping on "),
              ...createText("BAG", colors.black, colors.silver),
              ...createText("."),
            ]
          : [
              ...createText("pressing "),
              ...createText("[TAB]", colors.grey),
              ...createText("."),
            ],
        [],
        [
          ...createText("Or you can "),
          minCountable(heal),
          ...createText("Heal", colors.lime),
        ],
        [
          ...createText("at the "),
          fountain,
          ...createText("Fountain", colors.grey),
          ...createText("."),
        ],
      ],
    ]);
    all.push(signEntity);
    setIdentifier(world, signEntity, "fruit_sign");
    signEntity[SPRITE] = mergeSprites(shadow, signEntity[SPRITE]);
    return { cell: signEntity, all };
  } else if (cell === "guide_sign") {
    const guideSign = createSign(world, { x, y }, [
      [
        [
          ...createText("Collect a "),
          ...createItemName({ stackable: "stick" }),
          ...createText("."),
        ],
        createText("It will turn into"),
        [
          ...createText("a "),
          ...createItemName({ equipment: "sword", material: "wood" }),
          ...createText("."),
        ],
        [],
        [...createText("Kill the "), ...createUnitName("dummy")],
        [
          ...createText("and grab a "),
          ...createItemName({ stackable: "coin" }),
          ...createText("."),
        ],
        [],
        [
          ...createText("Buy a "),
          ...createItemName({ consume: "key", material: "iron" }),
          ...createText(" from"),
        ],
        [...createText("the "), ...createUnitName("guide"), ...createText(".")],
      ],
    ]);
    all.push(guideSign);
    setIdentifier(world, guideSign, "guide_sign");
    return { cell: guideSign, all };
  } else if (cell === "campfire" || cell === "fireplace") {
    const fireEntity = entities.createFire(world, {
      [BURNABLE]: {
        burning: cell === "campfire",
        eternal: true,
        simmer: false,
        combusted: false,
        decayed: false,
      },
      [FOG]: { visibility, type: "object" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: campfire,
    });
    all.push(fireEntity);
    return { cell: fireEntity, all };
  } else if (cell === "pot" || cell === "intro_pot") {
    const potEntity = createChest(
      world,
      "pot",
      { x, y },
      cell === "intro_pot"
        ? [
            {
              stackable: "apple",
              amount: 1,
            },
          ]
        : undefined
    );
    all.push(potEntity);
    return { cell: potEntity, all };
  } else if (cell === "fence") {
    const { sprite, stats, faction, items, equipments, scratch } =
      generateUnitData("fence");
    const remains = [fenceBurnt1, fenceBurnt2][random(0, 1)];
    const fenceEntity = entities.createObject(world, {
      [ATTACKABLE]: { scratchColor: scratch },
      [BELONGABLE]: { faction },
      [BURNABLE]: {
        burning: false,
        eternal: false,
        simmer: false,
        decayed: false,
        combusted: false,
        remains,
      },
      [DROPPABLE]: { decayed: false, remains },
      [FOG]: { visibility, type: "object" },
      [INVENTORY]: { items: [] },
      [LAYER]: {},
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SHOOTABLE]: { shots: 0 },
      [SPRITE]: sprite,
      [STATS]: stats,
    });
    all.push(fenceEntity);
    populateInventory(world, fenceEntity, items, equipments);
    return { cell: fenceEntity, all };
  } else if (cell === "fence_door" || cell === "fence_door_path") {
    if (cell === "fence_door_path") {
      all.push(
        entities.createTile(world, {
          [FOG]: { visibility, type: "object" },
          [POSITION]: { x, y },
          [RENDERABLE]: { generation: 0 },
          [SPRITE]: none,
          [TEMPO]: { amount: 2 },
        })
      );
    }
    const gateEntity = entities.createGate(world, {
      [BURNABLE]: {
        burning: false,
        eternal: false,
        simmer: false,
        decayed: false,
        combusted: false,
        remains:
          cell === "fence_door_path" ? fenceDoorBurntPath : fenceDoorBurnt,
      },
      [FOG]: { visibility, type: "object" },
      [LOCKABLE]: {
        material: "wood",
        locked: true,
        sprite: cell === "fence_door_path" ? fenceDoorOpenPath : fenceDoorOpen,
        type: "gate",
      },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: cell === "fence_door_path" ? fenceDoorPath : fenceDoor,
      [TOOLTIP]: {
        dialogs: [],
        persistent: false,
        nextDialog: 0,
      },
    });
    all.push(gateEntity);
    return { cell: gateEntity, all };
  } else if (cell === "box" || cell === "tutorial_box") {
    const { items, equipments, sprite, stats, faction, scratch } =
      generateUnitData("box");
    const frameEntity = entities.createFrame(world, {
      [REFERENCE]: {
        tick: getHasteInterval(world, 7),
        delta: 0,
        suspended: true,
        suspensionCounter: -1,
      },
      [RENDERABLE]: { generation: 0 },
    });
    all.push(frameEntity);
    const boxEntity = entities.createBox(world, {
      [AFFECTABLE]: getEmptyAffectable(),
      [ATTACKABLE]: { scratchColor: scratch },
      [BELONGABLE]: { faction },
      [DROPPABLE]: { decayed: false },
      [DISPLACABLE]: {},
      [FOG]: { visibility, type: "object" },
      [INVENTORY]: { items: [] },
      [LAYER]: {},
      [MOVABLE]: {
        bumpGeneration: 0,
        orientations: [],
        reference: world.getEntityId(frameEntity),
        spring: {
          duration: frameEntity[REFERENCE].tick,
        },
        lastInteraction: 0,
        flying: false,
      },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SHOOTABLE]: { shots: 0 },
      [SPRITE]: sprite,
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      [STATS]: stats,
    });
    all.push(boxEntity);
    populateInventory(
      world,
      boxEntity,
      cell === "tutorial_box"
        ? [
            {
              consume: "potion",
              material: "wood",
              element: "water",
              amount: 10,
              bound: false,
            },
          ]
        : items,
      equipments
    );
    return { cell: boxEntity, all };
  } else if (cell === "fruit_chest") {
    const chestEntity = createChest(world, "woodChest", { x, y }, [
      {
        stackable: "banana",
        amount: 1,
      },
      {
        consume: "key",
        material: "gold",
        amount: 1,
      },
    ]);
    all.push(chestEntity);
    setIdentifier(world, chestEntity, "fruit_chest");
    all.push(
      entities.createTile(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: sand,
        [TEMPO]: { amount: -1 },
      })
    );
    chestEntity[SPRITE] = mergeSprites(shadow, chestEntity[SPRITE]);
    return { cell: chestEntity, all };
  } else if (cell === "potion_chest") {
    const chestEntity = createChest(world, "woodChest", { x, y }, [
      {
        consume: "key",
        material: "iron",
        amount: 1,
      },
      {
        consume: "potion",
        material: "wood",
        element: "fire",
        amount: 10,
      },
    ]);
    all.push(chestEntity);
    return { cell: chestEntity, all };
  } else if (cell === "spawner") {
    const spawnerEntity = entities.createSpawner(world, {
      [BEHAVIOUR]: { patterns: [] },
      [BELONGABLE]: { faction: "wild" },
      [LAYER]: {},
      [FOG]: { visibility, type: "terrain" },
      [MOVABLE]: {
        bumpGeneration: 0,
        orientations: [],
        reference: world.getEntityId(world.metadata.gameEntity),
        spring: { duration: 200 },
        lastInteraction: 0,
        flying: false,
      },
      [POSITION]: { x, y },
      [SPRITE]: enemySpawner,
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
    });
    all.push(spawnerEntity, all);
  } else if (npcTypes.includes(cell as NpcType)) {
    const mobUnit = generateNpcData(cell as NpcType);

    let mobEntity: TypedEntity<"FOG" | "INVENTORY">;

    if (mobUnit.dormant) {
      mobEntity = entities.createDormant(world, {
        [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
        [BEHAVIOUR]: {
          patterns: [{ name: "passive", memory: {} }, ...mobUnit.patterns],
        },
        [BELONGABLE]: { faction: mobUnit.faction },
        [CLICKABLE]: { clicked: false, player: true },
        [COLLIDABLE]: {},
        [DROPPABLE]: {
          decayed: false,
          evaporate: mobUnit.evaporate,
          remains: mobUnit.remains,
        },
        [EQUIPPABLE]: {},
        [FOG]: { visibility, type: "unit" },
        [INVENTORY]: { items: [] },
        [LAYER]: {},
        [MELEE]: {},
        [MOVABLE]: {
          bumpGeneration: 0,
          orientations: [],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: mobUnit.spring || {
            duration: 200,
          },
          lastInteraction: 0,
          flying: mobUnit.flying,
        },
        [NPC]: { type: mobUnit.type },
        [ORIENTABLE]: {
          facing: mobUnit.sprite.facing ? choice(...orientations) : undefined,
        },
        [POSITION]: { x, y },
        [RECHARGABLE]: { hit: false },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: mobUnit.sprite,
        [STATS]: mobUnit.stats,
        [SWIMMABLE]: { swimming: false, sprite: mobUnit.swimming },
        [TOOLTIP]: { dialogs: [], persistent: true, nextDialog: -1 },
      });
    } else {
      mobEntity = entities.createMob(world, {
        [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
        [AFFECTABLE]: getEmptyAffectable(),
        [ATTACKABLE]: { scratchColor: mobUnit.scratch },
        [BEHAVIOUR]: {
          patterns: [
            { name: "wait", memory: { ticks: 1 } },
            ...mobUnit.patterns,
          ],
        },
        [BELONGABLE]: { faction: mobUnit.faction },
        [DROPPABLE]: {
          decayed: false,
          evaporate: mobUnit.evaporate,
          remains: mobUnit.remains,
        },
        [EQUIPPABLE]: {},
        [FOG]: { visibility, type: "unit" },
        [INVENTORY]: { items: [] },
        [LAYER]: {},
        [MELEE]: {},
        [MOVABLE]: {
          bumpGeneration: 0,
          orientations: [],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: mobUnit.spring || {
            duration: 200,
          },
          lastInteraction: 0,
          flying: mobUnit.flying,
        },
        [NPC]: { type: mobUnit.type },
        [ORIENTABLE]: {
          facing: mobUnit.sprite.facing ? choice(...orientations) : undefined,
        },
        [POSITION]: { x, y },
        [RECHARGABLE]: { hit: false },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SHOOTABLE]: { shots: 0 },
        [SPRITE]: mobUnit.sprite,
        [STATS]: mobUnit.stats,
        [SWIMMABLE]: { swimming: false, sprite: mobUnit.swimming },
        [TOOLTIP]: { dialogs: [], persistent: true, nextDialog: -1 },
      });
    }
    all.push(mobEntity);
    populateInventory(world, mobEntity, mobUnit.items, mobUnit.equipments);

    if (mobUnit.harvestable) {
      addHarvestable(world, mobEntity, mobUnit.harvestable);
    }

    if (mobUnit.faction === "unit") {
      mobEntity[FOG].type = "object";
    }
    if (cell === "dummy") {
      setIdentifier(world, mobEntity, "dummy");
    }

    return { cell: mobEntity, all };
  } else if (
    ["house_left", "house_right", "basement_left", "basement_right"].includes(
      cell
    )
  ) {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: {
        sprite:
          {
            house_left: houseRight,
            house_right: houseLeft,
            basement_left: basementLeftInside,
            basement_right: basementRightInside,
          }[cell] || none,
        orientation:
          cell === "house_left" || cell === "basement_left" ? "right" : "left",
      },
      [FOG]: { visibility, type: "terrain" },
      [LAYER]: {},
      [LIGHT]: {
        brightness: 0,
        darkness: 1,
        visibility: 0,
        orientation:
          cell === "house_left" || cell === "basement_left" ? "right" : "left",
      },
      [POSITION]: { x, y },
      [SPRITE]:
        cell === "house_left" || cell === "basement_left"
          ? houseLeft
          : houseRight,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "wall") {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: wallInside, orientation: "down" },
      [FOG]: { visibility, type: "terrain" },
      [LAYER]: {},
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [POSITION]: { x, y },
      [SPRITE]: house,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "wall_window") {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: {
        sprite: windowInside,
        orientation: "down",
      },
      [FOG]: { visibility, type: "terrain" },
      [LAYER]: {},
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [POSITION]: { x, y },
      [SPRITE]: window,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "float") {
    const floatEntity = entities.createFloat(world, {
      [FOG]: { visibility, type: "float" },
      [ORIENTABLE]: {},
      [POSITION]: { x, y },
      [SPRITE]: wall,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(floatEntity);
    return { cell: floatEntity, all };
  } else if (cell === "house") {
    const facadeEntity = entities.createFacade(world, {
      [ENTERABLE]: { sprite: none },
      [FOG]: { visibility, type: "float" },
      [LAYER]: {},
      [POSITION]: { x, y },
      [SPRITE]: house,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(facadeEntity);
    return { cell: facadeEntity, all };
  } else if (cell === "roof") {
    const facadeEntity = entities.createFacade(world, {
      [ENTERABLE]: { sprite: none },
      [FOG]: { visibility, type: "float" },
      [LAYER]: {},
      [POSITION]: { x, y },
      [SPRITE]: roof,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(facadeEntity);
    return { cell: facadeEntity, all };
  } else if (cell === "roof_left") {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: houseRight },
      [FOG]: { visibility, type: "terrain" },
      [LAYER]: {},
      [LIGHT]: {
        brightness: 0,
        darkness: 1,
        visibility: 0,
        orientation: "right",
      },
      [POSITION]: { x, y },
      [SPRITE]: roofLeft,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "roof_right") {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: houseLeft },
      [FOG]: { visibility, type: "terrain" },
      [LAYER]: {},
      [LIGHT]: {
        brightness: 0,
        darkness: 1,
        visibility: 0,
        orientation: "left",
      },
      [POSITION]: { x, y },
      [SPRITE]: roofRight,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "roof_left_up") {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: roofLeftUpInside },
      [FOG]: { visibility, type: "float" },
      [LAYER]: {},
      [LIGHT]: { brightness: 0, darkness: 0, visibility: 0 },
      [POSITION]: { x, y },
      [SPRITE]: roofLeftUp,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "roof_up") {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: roofUpInside },
      [FOG]: { visibility, type: "float" },
      [LAYER]: {},
      [LIGHT]: {
        brightness: 0,
        darkness: 1,
        visibility: 0,
        orientation: "down",
      },
      [POSITION]: { x, y },
      [SPRITE]: roofUp,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "roof_up_right") {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: roofUpRightInside },
      [LAYER]: {},
      [LIGHT]: { brightness: 0, darkness: 0, visibility: 0 },
      [FOG]: { visibility, type: "float" },
      [POSITION]: { x, y },
      [SPRITE]: roofUpRight,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "roof_down_left") {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: houseRight },
      [FOG]: { visibility, type: "terrain" },
      [LAYER]: {},
      [LIGHT]: {
        brightness: 0,
        darkness: 1,
        visibility: 0,
        orientation: "right",
      },
      [POSITION]: { x, y },
      [SPRITE]: roofDownLeft,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "roof_down") {
    const facadeEntity = entities.createFacade(world, {
      [ENTERABLE]: { sprite: none },
      [FOG]: { visibility, type: "float" },
      [LAYER]: {},
      [POSITION]: { x, y },
      [SPRITE]: roofDown,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(facadeEntity);
    return { cell: facadeEntity, all };
  } else if (cell === "roof_right_down") {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: houseLeft },
      [FOG]: { visibility, type: "terrain" },
      [LAYER]: {},
      [LIGHT]: {
        brightness: 0,
        darkness: 1,
        visibility: 0,
        orientation: "left",
      },
      [POSITION]: { x, y },
      [SPRITE]: roofRightDown,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "house_window") {
    const facadeEntity = entities.createFacade(world, {
      [ENTERABLE]: { sprite: none },
      [FOG]: { visibility, type: "float" },
      [LAYER]: {},
      [POSITION]: { x, y },
      [SPRITE]: window,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(facadeEntity);
    return { cell: facadeEntity, all };
  } else if (cell === "house_druid") {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: wallInside },
      [FOG]: { visibility, type: "terrain" },
      [LAYER]: {},
      [LIGHT]: {
        brightness: 0,
        darkness: 1,
        visibility: 0,
        orientation: "down",
      },
      [POSITION]: { x, y },
      [SPRITE]: houseDruid,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "house_smith") {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: wallInside },
      [FOG]: { visibility, type: "terrain" },
      [LAYER]: {},
      [LIGHT]: {
        brightness: 0,
        darkness: 1,
        visibility: 0,
        orientation: "down",
      },
      [POSITION]: { x, y },
      [SPRITE]: houseSmith,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "house_trader") {
    const wallEntity = entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: wallInside },
      [FOG]: { visibility, type: "terrain" },
      [LAYER]: {},
      [LIGHT]: {
        brightness: 0,
        darkness: 1,
        visibility: 0,
        orientation: "down",
      },
      [POSITION]: { x, y },
      [SPRITE]: houseTrader,
      [RENDERABLE]: { generation: 0 },
    });
    all.push(wallEntity);
    return { cell: wallEntity, all };
  } else if (cell === "chest_tower_statue") {
    const towerEntity = entities.createTerrain(world, {
      [COLLIDABLE]: {},
      [FOG]: { visibility, type: "object" },
      [POSITION]: { x, y },
      [SPRITE]: [rock1, rock2][random(0, 1)],
      [RENDERABLE]: { generation: 0 },
    });
    all.push(towerEntity);
    setIdentifier(world, towerEntity, "chest_tower_statue");
    return { cell: towerEntity, all };
  } else if (cell === "chest_tower") {
    const towerUnit = generateNpcData("waveTower");
    const towerEntity = entities.createMob(world, {
      [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
      [AFFECTABLE]: getEmptyAffectable(),
      [ATTACKABLE]: {},
      [BEHAVIOUR]: { patterns: towerUnit.patterns },
      [BELONGABLE]: { faction: towerUnit.faction },
      [DROPPABLE]: {
        decayed: false,
        evaporate: towerUnit.evaporate,
        remains: towerUnit.remains,
      },
      [EQUIPPABLE]: {},
      [FOG]: { visibility, type: "unit" },
      [INVENTORY]: { items: [] },
      [LAYER]: {},
      [MELEE]: {},
      [MOVABLE]: {
        bumpGeneration: 0,
        orientations: [],
        reference: world.getEntityId(world.metadata.gameEntity),
        spring: towerUnit.spring || {
          duration: 200,
        },
        lastInteraction: 0,
        flying: false,
      },
      [NPC]: { type: towerUnit.type },
      [ORIENTABLE]: {},
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [RECHARGABLE]: { hit: false },
      [SEQUENCABLE]: { states: {} },
      [SHOOTABLE]: { shots: 0 },
      [SPRITE]: towerUnit.sprite,
      [STATS]: towerUnit.stats,
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: {
        dialogs: [],
        persistent: false,
        nextDialog: -1,
      },
    });
    all.push(towerEntity);
    populateInventory(
      world,
      towerEntity,
      towerUnit.items,
      towerUnit.equipments
    );
    setIdentifier(world, towerEntity, "chest_tower");
    return { cell: towerEntity, all };
  } else if (cell === "ilex_elite") {

    const eliteUnit = generateNpcData("ilexElite");

    // create unit and base
    const eliteEntity = entities.createBoss(world, {
      [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
      [BEHAVIOUR]: {
        patterns: [{ name: "passive", memory: {} }, ...eliteUnit.patterns],
      },
      [BELONGABLE]: { faction: eliteUnit.faction },
      [CLICKABLE]: { clicked: false, player: true },
      [COLLIDABLE]: {},
      [EQUIPPABLE]: {},
      [FOG]: { visibility, type: "object" },
      [FRAGMENT]: { structure: -1 },
      [INVENTORY]: { items: [] },
      [LAYER]: {},
      [MELEE]: {},
      [MOVABLE]: {
        bumpGeneration: 0,
        orientations: [],
        reference: world.getEntityId(world.metadata.gameEntity),
        spring: eliteUnit.spring || {
          duration: 200,
        },
        lastInteraction: 0,
        flying: false,
      },
      [NPC]: { type: eliteUnit.type },
      [ORIENTABLE]: {},
      [POSITION]: { x, y },
      [RECHARGABLE]: { hit: false },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: eliteUnit.sprite,
      [STATS]: eliteUnit.stats,
      [STRUCTURABLE]: { scale: 3, offsetY: 2 },
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      [VANISHABLE]: {
        decayed: false,
        remains: eliteUnit.vanish?.remains || [],
        spawns: eliteUnit.vanish?.spawns || [],
        type: eliteUnit.vanish?.type || "evaporate",
        evaporate: eliteUnit.vanish?.evaporate,
      },
    });
    all.push(eliteEntity);
    populateInventory(
      world,
      eliteEntity,
      eliteUnit.items,
      eliteUnit.equipments
    );
    setIdentifier(world, eliteEntity, "ilex_elite");
    const eliteId = world.getEntityId(eliteEntity);
    eliteEntity[FRAGMENT].structure = eliteId;

    // create stem and leaves
    const ilexLimbs: {
      offset: Position;
      sprite: Sprite;
      orientation?: Orientation;
    }[] = [
      { offset: { x: 1, y: 0 }, sprite: eliteUnit.sprite },
      { offset: { x: 1, y: 1 }, sprite: eliteUnit.sprite },
      { offset: { x: 1, y: 2 }, sprite: eliteUnit.sprite },
      { offset: { x: 0, y: 2 }, sprite: eliteUnit.sprite },
      { offset: { x: -1, y: 2 }, sprite: eliteUnit.sprite },
      { offset: { x: -1, y: 1 }, sprite: eliteUnit.sprite },
      { offset: { x: -1, y: 0 }, sprite: eliteUnit.sprite },
    ];

    for (const { offset, sprite, orientation } of ilexLimbs) {
      const limbEntity = entities.createLimb(world, {
        [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
        [COLLIDABLE]: {},
        [DROPPABLE]: {
          decayed: false,
          evaporate: eliteUnit.vanish?.evaporate,
          remains: eliteUnit.remains,
        },
        [FOG]: { visibility, type: "object" },
        [FRAGMENT]: { structure: eliteId },
        [LAYER]: {},
        [MOVABLE]: {
          bumpGeneration: 0,
          orientations: [],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: eliteUnit.spring || {
            duration: 200,
          },
          lastInteraction: 0,
          flying: false,
        },
        [ORIENTABLE]: { facing: orientation },
        [POSITION]: combine(size, { x, y }, offset),
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SHOOTABLE]: { shots: 0 },
        [SPRITE]: sprite,
      });
      all.push(limbEntity);
    }

    return { cell: eliteEntity, all };
  } else if (cell === "ilexChest") {
    const chestEntity = createChest(world, "ilexChest", { x, y });
    all.push(chestEntity);
    return { cell: chestEntity, all };
  } else if (cell === "oak_boss") {
    const bossUnit = generateNpcData("oakBoss");

    // create unit and base
    const bossEntity = entities.createBoss(world, {
      [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
      [BEHAVIOUR]: { patterns: bossUnit.patterns },
      [BELONGABLE]: { faction: bossUnit.faction },
      [COLLIDABLE]: {},
      [CLICKABLE]: { clicked: false, player: true },
      [EQUIPPABLE]: {},
      [FOG]: { visibility, type: "object" },
      [FRAGMENT]: { structure: -1 },
      [INVENTORY]: { items: [] },
      [LAYER]: {},
      [MELEE]: {},
      [MOVABLE]: {
        bumpGeneration: 0,
        orientations: [],
        reference: world.getEntityId(world.metadata.gameEntity),
        spring: bossUnit.spring || {
          duration: 200,
        },
        lastInteraction: 0,
        flying: false,
      },
      [NPC]: { type: bossUnit.type },
      [ORIENTABLE]: {},
      [POSITION]: { x, y },
      [RECHARGABLE]: { hit: false },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: oakLeaves,
      [STATS]: bossUnit.stats,
      [STRUCTURABLE]: { scale: 3, offsetY: 3 },
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      [VANISHABLE]: {
        decayed: false,
        remains: bossUnit.vanish?.remains || [],
        spawns: bossUnit.vanish?.spawns || [],
        type: bossUnit.vanish?.type || "evaporate",
        evaporate: bossUnit.vanish?.evaporate,
      },
    });
    all.push(bossEntity);
    populateInventory(world, bossEntity, bossUnit.items, bossUnit.equipments);
    setIdentifier(world, bossEntity, "oak_boss");
    const bossId = world.getEntityId(bossEntity);
    bossEntity[FRAGMENT].structure = bossId;

    // create stem and leaves
    const oakLimbs: {
      offset: Position;
      sprite: Sprite;
      orientation?: Orientation;
    }[] = [
      { offset: { x: 0, y: 3 }, sprite: oakStem, orientation: "down" },
      {
        offset: { x: 0, y: 2 },
        sprite: oakStem,
        orientation: choice("left", "right"),
      },
      { offset: { x: -2, y: 1 }, sprite: oakLeaves, orientation: "down" },
      { offset: { x: -1, y: 1 }, sprite: oakLeaves },
      { offset: { x: 0, y: 1 }, sprite: oakMouth },
      { offset: { x: 1, y: 1 }, sprite: oakLeaves },
      { offset: { x: 2, y: 1 }, sprite: oakLeaves, orientation: "down" },
      { offset: { x: -2, y: 0 }, sprite: oakLeaves, orientation: "left" },
      { offset: { x: -1, y: 0 }, sprite: oakLeaves },
      { offset: { x: 0, y: 0 }, sprite: oakLeaves },
      { offset: { x: 1, y: 0 }, sprite: oakLeaves },
      { offset: { x: 2, y: 0 }, sprite: oakLeaves, orientation: "right" },
      { offset: { x: -1, y: -1 }, sprite: oakLeaves, orientation: "left" },
      { offset: { x: 0, y: -1 }, sprite: oakLeaves },
      { offset: { x: 1, y: -1 }, sprite: oakLeaves, orientation: "right" },
    ];

    for (const { offset, sprite, orientation } of oakLimbs) {
      const limbEntity = entities.createLimb(world, {
        [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false, evaporate: bossUnit.vanish?.evaporate },
        [FOG]: { visibility, type: "object" },
        [FRAGMENT]: { structure: bossId },
        [LAYER]: {},
        [MOVABLE]: {
          bumpGeneration: 0,
          orientations: [],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: bossUnit.spring || {
            duration: 200,
          },
          lastInteraction: 0,
          flying: false,
        },
        [ORIENTABLE]: { facing: orientation },
        [POSITION]: combine(size, { x, y }, offset),
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SHOOTABLE]: { shots: 0 },
        [SPRITE]: sprite,
      });
      all.push(limbEntity);
    }

    // create room
    const roomEntity = entities.createRoom(world, {
      [LIGHT]: { brightness: 0, darkness: 0, visibility: 0 },
      [POSITION]: { x: 0, y: 0 },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: none,
      [VIEWABLE]: { active: false, priority: 50 },
    });
    all.push(roomEntity);
    npcSequence(world, roomEntity, "oakRoom", {});
    setIdentifier(world, roomEntity, "oakRoom");

    return { cell: bossEntity, all };
  } else if (cell === "oakChest") {
    const chestEntity = createChest(world, "oakChest", { x, y });
    all.push(chestEntity);
    return { cell: chestEntity, all };
  } else if (cell === "worm_boss") {
    const bossUnit = generateNpcData("wormBoss");

    // create unit and base
    const bossEntity = entities.createElite(world, {
      [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
      [AFFECTABLE]: getEmptyAffectable(),
      [ATTACKABLE]: { scratchColor: bossUnit.scratch },
      [BEHAVIOUR]: { patterns: bossUnit.patterns },
      [BELONGABLE]: { faction: bossUnit.faction },
      [DROPPABLE]: { decayed: false },
      [EQUIPPABLE]: {},
      [FOG]: { visibility, type: "unit" },
      [FRAGMENT]: { structure: -1 },
      [INVENTORY]: { items: [] },
      [LAYER]: {},
      [MELEE]: {},
      [MOVABLE]: {
        bumpGeneration: 0,
        orientations: [],
        reference: world.getEntityId(world.metadata.gameEntity),
        spring: bossUnit.spring || {
          duration: 350,
        },
        lastInteraction: 0,
        flying: bossUnit.flying,
      },
      [NPC]: { type: bossUnit.type },
      [ORIENTABLE]: {},
      [POSITION]: { x, y },
      [RECHARGABLE]: { hit: false },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SHOOTABLE]: { shots: 0 },
      [SPRITE]: wormMouth,
      [STATS]: bossUnit.stats,
      [STRUCTURABLE]: {},
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      [VANISHABLE]: {
        decayed: false,
        remains: bossUnit.vanish?.remains || [],
        spawns: bossUnit.vanish?.spawns || [],
        type: bossUnit.vanish?.type || "evaporate",
        evaporate: bossUnit.vanish?.evaporate,
      },
    });
    all.push(bossEntity);
    populateInventory(world, bossEntity, bossUnit.items, bossUnit.equipments);

    // npcSequence(world, bossEntity, "wormNpc", {});
    setIdentifier(world, bossEntity, "worm_boss");
    const bossId = world.getEntityId(bossEntity);
    bossEntity[FRAGMENT].structure = bossId;
    createSequence<"worm", WormSequence>(
      world,
      bossEntity,
      "worm",
      "wormLimbs",
      { type: "mouth" }
    );

    return { cell: bossEntity, all };
  } else if (cell === "chest_boss") {
    const bossUnit = generateNpcData("chestBoss");

    const bossEntity = entities.createMob(world, {
      [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
      [AFFECTABLE]: getEmptyAffectable(),
      [ATTACKABLE]: {},
      [BEHAVIOUR]: { patterns: bossUnit.patterns },
      [BELONGABLE]: { faction: bossUnit.faction },
      [DROPPABLE]: { decayed: false },
      [EQUIPPABLE]: {},
      [FOG]: { visibility, type: "unit" },
      [INVENTORY]: { items: [] },
      [LAYER]: {},
      [MELEE]: {},
      [MOVABLE]: {
        bumpGeneration: 0,
        orientations: [],
        reference: world.getEntityId(world.metadata.gameEntity),
        spring: bossUnit.spring || {
          duration: 200,
        },
        lastInteraction: 0,
        flying: false,
      },
      [NPC]: { type: bossUnit.type },
      [ORIENTABLE]: {},
      [POSITION]: { x, y },
      [RECHARGABLE]: { hit: false },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SHOOTABLE]: { shots: 0 },
      [SPRITE]: bossUnit.sprite,
      [STATS]: bossUnit.stats,
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
    });
    all.push(bossEntity);
    populateInventory(world, bossEntity, bossUnit.items, bossUnit.equipments);

    npcSequence(world, bossEntity, "chestNpc", {});
    setIdentifier(world, bossEntity, "chest_boss");
    return { cell: bossEntity, all };
  } else if (cell === "chest_mob") {
    const mobUnit = generateNpcData(
      (["goldPrism", "goldOrb", "goldEye"] as const)[distribution(33, 33, 33)]
    );
    const mobEntity = entities.createMob(world, {
      [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
      [AFFECTABLE]: getEmptyAffectable(),
      [ATTACKABLE]: {},
      [BEHAVIOUR]: {
        patterns: [{ name: "wait", memory: { ticks: 1 } }, ...mobUnit.patterns],
      },
      [BELONGABLE]: { faction: mobUnit.faction },
      [DROPPABLE]: { decayed: false },
      [EQUIPPABLE]: {},
      [FOG]: { visibility: "hidden", type: "unit" },
      [INVENTORY]: { items: [] },
      [LAYER]: {},
      [MELEE]: {},
      [MOVABLE]: {
        bumpGeneration: 0,
        orientations: [],
        reference: world.getEntityId(world.metadata.gameEntity),
        spring: mobUnit.spring || {
          duration: 200,
        },
        lastInteraction: 0,
        flying: false,
      },
      [NPC]: { type: mobUnit.type },
      [ORIENTABLE]: {},
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [RECHARGABLE]: { hit: false },
      [SEQUENCABLE]: { states: {} },
      [SHOOTABLE]: { shots: 0 },
      [SPRITE]: mobUnit.sprite,
      [STATS]: mobUnit.stats,
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: {
        dialogs: [],
        persistent: true,
        nextDialog: -1,
      },
    });
    all.push(mobEntity);
    populateInventory(
      world,
      mobEntity,
      [
        {
          stat: (["hp", "mp"] as const)[distribution(70, 30)],
          amount: 1,
        },
      ],
      mobUnit.equipments
    );
    setIdentifier(world, mobEntity, "chest_mob");
    return { cell: mobEntity, all };
  } else if (cell === "portal") {
    const currentLevel = world.metadata.gameEntity[LEVEL].name;
    const inMenu = currentLevel === "LEVEL_MENU";
    const level = levelConfig[currentLevel];
    const portalEntity = entities.createPortal(world, {
      [COLLIDABLE]: {},
      [FOG]: { visibility, type: "float" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: portal,
      [TOOLTIP]: {
        dialogs: [],
        persistent: false,
        nextDialog: -1,
      },
      [WARPABLE]: {
        name: level.warps[0],
      },
    });
    all.push(portalEntity);
    createSequence<"vortex", VortexSequence>(
      world,
      portalEntity,
      "vortex",
      "vortexDots",
      {
        generation: 0,
      }
    );
    const mapText = [
      [
        ...repeat(swirl, 3),
        ...createText("scroll down", colors.grey),
        ...repeat(swirl, 3),
      ],
      [],
      [],
      [],
      centerSprites(createText("ALIVE", colors.maroon), frameWidth - 2),
      centerSprites(
        [
          ...createText(`${"─".repeat(3)}-`, colors.grey),
          mergeSprites(portalVortex, portal),
        ],
        frameWidth - 2
      ),
      centerSprites(createText("─".repeat(5), colors.grey), frameWidth - 2),
      [],
      [],
      [...repeat(none, 16), sand],
      [
        none,
        getOrientedSprite(fountainCorner, "left"),
        getOrientedSprite(fountainSide, "up"),
        getOrientedSprite(fountainCorner, "up"),
        none,
        mergeSprites(portalVortex, portal),
        ...repeat(none, 9),
        ...repeat(sand, 2),
      ],
      [
        none,
        getOrientedSprite(fountainSide, "left"),
        mergeSprites(fountainCorner, fountain),
        getOrientedSprite(fountainSide, "right"),
        ...repeat(none, 4),
        mergeSprites(campfire, maxCountable(fire)),
        ...repeat(none, 3),
        ...repeat(sand, 5),
      ],
      [
        none,
        getOrientedSprite(fountainCorner, "down"),
        getOrientedSprite(fountainSide, "down"),
        getOrientedSprite(fountainCorner, "right"),
        ...repeat(none, 6),
        ...repeat(sand, 4),
        ...repeat(waterDeep, 3),
      ],
      [...repeat(none, 5), ...repeat(sand, 6), ...repeat(waterDeep, 6)],
      [...repeat(sand, 6), ...repeat(waterDeep, 11)],
      repeat(waterDeep, 17),
      [...repeat(waterDeep, 10), ...repeat(sand, 6), waterDeep],
      [
        ...repeat(waterDeep, 7),
        ...repeat(sand, 4),
        none,
        mergeSprites(portalVortex, portal),
        grass,
        tree1,
        sand,
        waterDeep,
      ],
      [
        ...repeat(waterDeep, 7),
        sand,
        palm1,
        palm2,
        sand,
        ...repeat(none, 2),
        bush,
        tree2,
        sand,
        waterDeep,
      ],
      [
        ice,
        ...repeat(waterDeep, 6),
        ...repeat(sand, 5),
        none,
        ...repeat(sand, 3),
        waterDeep,
      ],
      [
        ...repeat(ice, 2),
        ...repeat(waterDeep, 9),
        ...repeat(sand, 3),
        ...repeat(waterDeep, 3),
      ],
      [...repeat(ice, 6), ...repeat(waterDeep, 11)],
      [...repeat(ice, 9), ...repeat(waterDeep, 8)],
      [...repeat(ice, 13), ...repeat(waterDeep, 4)],
      repeat(ice, 17),
      repeat(ice, 17),
      repeat(ice, 17),
      overlay(
        [createText("█".repeat(frameWidth - 2), colors.teal)],
        [
          [
            ...repeat(swirl, 3),
            ...createText("coming soon", colors.grey),
            ...repeat(swirl, 3),
          ].map((char) =>
            recolorSprite(char, {
              [colors.grey]: colors.aqua,
              [colors.black]: colors.teal,
            })
          ),
        ]
      )[0],
      repeat(ice, 17),
      repeat(ice, 17),
      repeat(ice, 17),
    ];
    createPopup(world, portalEntity, {
      tabs: inMenu ? ["class", "style", "warp"] : ["warp"],
      lines: inMenu ? [[], [], mapText] : [mapText],
      verticalIndezes: inMenu ? [0, 0, 0] : [level.mapOffsetY - 2],
    });
    return { cell: portalEntity, all };
  } else if (
    cell === "settings_sound" ||
    cell === "settings_controls" ||
    cell === "lever"
  ) {
    const leverEntity = entities.createLever(world, {
      [CLICKABLE]: { clicked: false, player: true },
      [COLLIDABLE]: {},
      [FOG]: { visibility, type: "object" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: cell === "lever" ? leverOff : leverOn,
      [TOOLTIP]: {
        dialogs:
          cell === "settings_sound"
            ? [createDialog("Sound on")]
            : cell === "settings_controls"
            ? [createDialog("Left side")]
            : [],

        persistent: false,
        nextDialog: -1,
      },
    });
    all.push(leverEntity);
    if (cell !== "lever") {
      setIdentifier(world, leverEntity, cell);
    }
    return { cell: leverEntity, all };
  } else if (cell === "fountain") {
    const fountainEntity = entities.createFountain(world, {
      [COLLIDABLE]: {},
      [FOG]: { visibility, type: "object" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: fountain,
    });
    all.push(fountainEntity);
    createSequence<"fountain", FountainSequence>(
      world,
      fountainEntity,
      "fountain",
      "fountainSplash",
      {
        generation: 0,
      }
    );
    [-1, 0, 1].forEach((columnOffset) => {
      [-1, 0, 1].forEach((rowOffset) => {
        all.push(
          entities.createDecoration(world, {
            [FOG]: {
              visibility,
              type: "object",
            },
            [ORIENTABLE]: {
              facing: (
                [
                  "left",
                  "up",
                  "up",
                  "left",
                  undefined,
                  "right",
                  "down",
                  "down",
                  "right",
                ] as const
              )[columnOffset + 1 + (rowOffset + 1) * 3],
            },
            [POSITION]: { x: x + columnOffset, y: y + rowOffset },
            [RENDERABLE]: { generation: 0 },
            [SPRITE]:
              (columnOffset + rowOffset + 2) % 2 === 0
                ? fountainCorner
                : fountainSide,
          })
        );
      });
    });
    return { cell: fountainEntity, all };
  } else if (cell === "kettle" || cell === "kettle_passive") {
    const isPassive = cell === "kettle_passive";
    const kettleEntity = entities.createCrafting(world, {
      [BURNABLE]: {
        burning: !isPassive,
        eternal: !isPassive,
        simmer: !isPassive,
        decayed: false,
        combusted: false,
      },
      [COLLIDABLE]: {},
      [FOG]: { visibility: "hidden", type: "unit" },
      [LAYER]: {},
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: kettle,
      [TOOLTIP]: {
        dialogs: [],
        persistent: false,
        nextDialog: -1,
      },
    });
    all.push(kettleEntity);
    if (!isPassive) {
      createPopup(world, kettleEntity!, {
        recipes: craftingRecipes,
        tabs: ["craft"],
      });
    }
    return { cell: kettleEntity, all };
  } else if (cell === "anvil" || cell === "anvil_passive") {
    const anvilEntity = entities.createForging(world, {
      [COLLIDABLE]: {},
      [FOG]: { visibility: "hidden", type: "unit" },
      [LAYER]: {},
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: anvil,
      [TOOLTIP]: {
        dialogs: [],
        persistent: false,
        nextDialog: -1,
      },
    });
    all.push(anvilEntity);
    if (cell !== "anvil_passive") {
      createPopup(world, anvilEntity, {
        tabs: ["forge"],
      });
    }
    return { cell: anvilEntity, all };
  } else if (cell === "1") {
    const patterns = [
      [..."Tutorial  ", ".\x00:", ..."  ", ".\x00:"],
      [],
      [],
      [..."New Game  ", ".\x00:", ..."  ", ".\x00:"],
      [],
      [],
      [..."Continue  ", ".\x00:", ..."  ", ".\x00:", ..."  ", "\x08∩"],
      [],
      [],
      [..."Sound FX  ", ".\x00:", ..."  ", ".\x00:"],
      [],
      [],
      [..."Controls  ", ".\x00:", ..."  ", ".\x00:"],
    ];

    patterns.forEach((pattern, rowIndex) => {
      pattern.forEach((block, columnIndex) => {
        if (!block.trim()) return;

        const sprite = parseSprite(`\x08${block}`);
        if (!block[0].trim()) {
          all.push(
            entities.createGround(world, {
              [FOG]: {
                visibility,
                type: "terrain",
              },
              [POSITION]: add({ x, y }, { x: columnIndex, y: rowIndex }),
              [RENDERABLE]: { generation: 0 },
              [SPRITE]: sprite,
            })
          );
        } else {
          all.push(
            entities.createTerrain(world, {
              [COLLIDABLE]: {},
              [FOG]: {
                visibility,
                type: "object",
              },
              [POSITION]: add({ x, y }, { x: columnIndex, y: rowIndex }),
              [RENDERABLE]: { generation: 0 },
              [SPRITE]: sprite,
            })
          );
        }
      });
    });
    return { cell: all[0], all };
  } else if (cell !== "air") {
    console.error(`Invalid cell: "${cell}"!`);
  }
  return { cell: all[0], all };
};
