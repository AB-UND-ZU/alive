import { Entity } from "ecs";
import { getItemSprite } from "../components/Entity/utils";
import { entities, World } from "../engine";
import { Fog, FOG } from "../engine/components/fog";
import { ITEM, Item } from "../engine/components/item";
import { ORIENTABLE } from "../engine/components/orientable";
import { Position, POSITION } from "../engine/components/position";
import { RENDERABLE } from "../engine/components/renderable";
import { SEQUENCABLE } from "../engine/components/sequencable";
import { SPRITE } from "../engine/components/sprite";
import { STRUCTURABLE } from "../engine/components/structurable";
import { VIEWABLE } from "../engine/components/viewable";
import { TypedEntity } from "../engine/entities";
import * as colors from "../game/assets/colors";
import {
  createItemAsDrop,
  createItemInInventory,
} from "../engine/systems/drop";
import { getEnterable } from "../engine/systems/enter";
import {
  block,
  blockDown,
  blockUp,
  bush,
  campfire,
  createDialog,
  createText,
  doorClosedIron,
  doorClosedWood,
  doorOpen,
  fog,
  getStatSprite,
  grass,
  ice,
  ironKey,
  ironMine,
  leaves,
  none,
  oakBurnt,
  palm1,
  palm2,
  palmBurnt1,
  palmBurnt2,
  path,
  portal,
  rock1,
  rock2,
  sand,
  stem,
  tree1,
  tree2,
  treeBurnt1,
  treeBurnt2,
  wall,
  water,
  xp,
} from "../game/assets/sprites";
import {
  add,
  choice,
  copy,
  distribution,
  normalize,
  Point,
  random,
  signedDistance,
} from "../game/math/std";
import { LEVEL } from "../engine/components/level";
import { FRAGMENT } from "../engine/components/fragment";
import { iterateMatrix, Matrix, matrixFactory } from "../game/math/matrix";
import { TRACKABLE } from "../engine/components/trackable";
import { setIdentifier } from "../engine/utils";
import { LIGHT } from "../engine/components/light";
import { COLLIDABLE } from "../engine/components/collidable";
import {
  generateNpcData,
  generateUnitData,
  generateNpcKey,
} from "../game/balancing/units";
import { ATTACKABLE } from "../engine/components/attackable";
import { BELONGABLE } from "../engine/components/belongable";
import { DROPPABLE } from "../engine/components/droppable";
import { INVENTORY } from "../engine/components/inventory";
import { emptyStats, STATS } from "../engine/components/stats";
import { ENVIRONMENT } from "../engine/components/environment";
import { TEMPO } from "../engine/components/tempo";
import { TOOLTIP } from "../engine/components/tooltip";
import { LOOTABLE } from "../engine/components/lootable";
import { FREEZABLE } from "../engine/components/freezable";
import { IMMERSIBLE } from "../engine/components/immersible";
import { BURNABLE } from "../engine/components/burnable";
import { AFFECTABLE } from "../engine/components/affectable";
import { BEHAVIOUR } from "../engine/components/behaviour";
import { MOVABLE } from "../engine/components/movable";
import { SPIKABLE } from "../engine/components/spikable";
import { ENTERABLE } from "../engine/components/enterable";
import { LOCKABLE } from "../engine/components/lockable";
import { LAYER } from "../engine/components/layer";
import {
  basementLeftInside,
  basementRightInside,
  fenceBurnt1,
  fenceBurnt2,
  fenceDoor,
  fenceDoorBurnt,
  house,
  houseAid,
  houseArmor,
  houseLeft,
  houseMage,
  houseRight,
  houseTrader,
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
  wallInside,
  window,
  windowInside,
} from "../game/assets/sprites/structures";
import { REFERENCE } from "../engine/components/reference";
import { getHasteInterval } from "../engine/systems/movement";
import { DISPLACABLE } from "../engine/components/displacable";
import { SWIMMABLE } from "../engine/components/swimmable";
import { hillsNpcDistribution } from "../game/levels/hills";
import { EQUIPPABLE } from "../engine/components/equippable";
import { MELEE } from "../engine/components/melee";
import { NPC } from "../engine/components/npc";
import { RECHARGABLE } from "../engine/components/rechargable";
import { ACTIONABLE } from "../engine/components/actionable";
import { npcSequence } from "../game/assets/utils";
import { getLockable } from "../engine/systems/action";
import { createPopup } from "../engine/systems/popup";

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
  items: Omit<Item, "carrier">[],
  equipments: Omit<Item, "carrier">[] = []
) => {
  populateItems(world, entity, items, false);
  populateItems(world, entity, equipments);
};

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

export const insertArea = (
  matrix: Matrix<string>,
  area: string,
  xOffset: number,
  yOffset: number
) => {
  const areaRows = area.split("\n");
  const width = matrix.length;
  const height = matrix[0].length;

  areaRows.forEach((row, rowIndex) => {
    row.split("").forEach((cell, columnIndex) => {
      if (cell === " ") return;

      const x = normalize(columnIndex - (row.length - 1) / 2 + xOffset, width);
      const y = normalize(
        rowIndex - (areaRows.length - 1) / 2 + yOffset,
        height
      );
      let entity = "air";
      if (cell === "█") entity = "mountain";
      else if (cell === "≈") entity = "water";
      else if (cell === "░") entity = "beach";
      else if (cell === "▒") entity = "path";
      else if (cell === "▓") entity = "block";
      else if (cell === "▄") entity = "block_down";
      else if (cell === "▀") entity = "block_up";
      else if (cell === "◙") entity = "gate";
      else if (cell === "◘") entity = "ore_one";
      else if (cell === "∙") entity = "coin_one";
      else if (cell === "o") entity = "intro_pot";
      else if (cell === "■") entity = "box";
      else if (cell === "#") entity = "tree";
      else if (cell === "⌠") entity = "palm";
      else if (cell === "=") entity = "wood_two";
      else if (cell === ".") entity = "fruit_one";
      else if (cell === "ß") entity = "hedge";
      else if (cell === "&") entity = "spawn_hedge";
      else if (cell === "τ") entity = "bush";
      else if (cell === "'") entity = "berry_one";
      else if (cell === ",") entity = "grass";
      else if (cell === "·") entity = "flower_one";
      else if (cell === "♀") entity = "player";
      else if (cell === "►") entity = "spawn_prism";
      else if (cell === "*") entity = "campfire";
      else if (cell === "!") entity = "spawn_key";
      else if (cell === "x") entity = "fireplace";
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
      else if (cell === "╔") entity = "roof_left_up";
      else if (cell === "╦") entity = "roof_up";
      else if (cell === "╗") entity = "roof_up_right";
      else if (cell === "╞") entity = "roof_down_left";
      else if (cell === "╪") entity = "roof_down";
      else if (cell === "╡") entity = "roof_right_down";
      else if (cell === "s") entity = "spawn_sign";
      else if (cell === "g") entity = "guide_door";
      else if (cell === "N") entity = "nomad_door";
      else if (cell === "Y") entity = "chest_tower";
      else if (cell === "y") entity = "chest_tower_statue";
      else if (cell === "C") entity = "chest_boss";
      else if (cell === "P") entity = "portal";
      else {
        console.error(`Unrecognized cell: ${cell}!`);
      }

      matrix[x][y] = entity;
    });
  });
};

export const createArea = (
  world: World,
  area: string,
  xOffset: number,
  yOffset: number
) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const matrix = matrixFactory(size, size, () => "");

  insertArea(matrix, area, xOffset, yOffset);

  iterateMatrix(matrix, (x, y, cell) => {
    createCell(world, matrix, { x, y }, cell, "hidden");
  });
};

export const createCell = (
  world: World,
  matrix: Matrix<string>,
  { x, y }: Position,
  cell: string,
  visibility: Fog["visibility"]
) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  if (cell !== "") {
    entities.createGround(world, {
      [FOG]: { visibility, type: "air" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: fog,
    });
  }

  if (!cell) {
    return;
  } else if (cell === "player") {
    // create spawn dummy to set needle target
    const spawnEntity = entities.createViewpoint(world, {
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [VIEWABLE]: { active: false, priority: 30 },
    });
    setIdentifier(world, spawnEntity, "spawn");
  } else if (cell === "mountain") {
    entities.createMountain(world, {
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [SPRITE]: wall,
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [RENDERABLE]: { generation: 0 },
      [COLLIDABLE]: {},
    });
  } else if (cell === "rock" || cell === "desert_rock") {
    const rock = (["rock1", "rock2"] as const)[random(0, 1)];
    const { items, sprite, stats, faction } = generateUnitData(rock);
    const sprites = {
      rock: { rock1, rock2 },
      desert_rock: { [rock]: sprite },
    };
    const rockEntity = entities.createDeposit(world, {
      [ATTACKABLE]: { shots: 0 },
      [BELONGABLE]: { faction },
      [DROPPABLE]: {
        decayed: false,
        remains: cell === "desert_rock" ? sand : undefined,
      },
      [FOG]: { visibility, type: "terrain" },
      [INVENTORY]: { items: [] },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: sprites[cell][rock],
      [STATS]: { ...emptyStats, ...stats },
    });
    populateInventory(world, rockEntity, items);
    if (cell === "desert_rock") {
      entities.createArea(world, {
        [ENVIRONMENT]: { biomes: ["desert"] },
        [POSITION]: { x, y },
        [TEMPO]: { amount: -1 },
      });
    }
  } else if (cell === "iron") {
    entities.createMine(world, {
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: ironMine,
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [COLLIDABLE]: {},
    });
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
  } else if (cell === "stone") {
    entities.createTile(world, {
      [ENVIRONMENT]: { biomes: ["desert"] },
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: sand,
      [TEMPO]: { amount: -1 },
    });
    createItemAsDrop(world, { x, y }, entities.createItem, {
      [ITEM]: {
        stackable: "ore",
        amount: 1,
        bound: false,
      },
      [SPRITE]: getItemSprite({ stackable: "ore" }),
    });
  } else if (cell === "block") {
    entities.createTerrain(world, {
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [SPRITE]: block,
      [RENDERABLE]: { generation: 0 },
      [COLLIDABLE]: {},
    });
  } else if (cell === "block_down") {
    entities.createTerrain(world, {
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [SPRITE]: blockDown,
      [RENDERABLE]: { generation: 0 },
      [COLLIDABLE]: {},
    });
  } else if (cell === "block_up") {
    entities.createTerrain(world, {
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [SPRITE]: blockUp,
      [RENDERABLE]: { generation: 0 },
      [COLLIDABLE]: {},
    });
  } else if (cell === "beach" || cell === "desert") {
    entities.createTile(world, {
      [ENVIRONMENT]: { biomes: [cell] },
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: sand,
      [TEMPO]: { amount: -1 },
    });
  } else if (cell === "path") {
    entities.createPath(world, {
      [ENVIRONMENT]: { biomes: ["path"] },
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: path,
      [TEMPO]: { amount: 2 },
    });
  } else if (cell === "water" || cell === "spring") {
    entities.createWater(world, {
      [FOG]: { visibility, type: "terrain" },
      [FREEZABLE]: { frozen: false, sprite: ice },
      [IMMERSIBLE]: {},
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: water,
      [TEMPO]: { amount: -2 },
    });
  } else if (cell === "wood" || cell === "wood_two") {
    const woodEntity = createItemAsDrop(world, { x, y }, entities.createItem, {
      [ITEM]: {
        stackable: "stick",
        amount: cell === "wood" ? distribution(80, 15, 5) + 1 : 2,
        bound: false,
      },
      [SPRITE]: getItemSprite({ stackable: "stick" }, "resource"),
    });
    if (cell === "wood_two")
      setIdentifier(world, world.assertById(woodEntity[ITEM].carrier), cell);
  } else if (cell === "fruit" || cell === "fruit_one") {
    if (random(0, 1) === 0 || cell === "fruit_one") {
      const fruitEntity = entities.createFruit(world, {
        [BURNABLE]: {
          burning: false,
          eternal: false,
          combusted: false,
          decayed: false,
          remains: [treeBurnt1, treeBurnt2][random(0, 1)],
        },
        [COLLIDABLE]: {},
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [] },
        [LOOTABLE]: { disposable: false },
        [POSITION]: { x, y },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: tree2,
        [RENDERABLE]: { generation: 0 },
      });
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
    } else {
      createItemAsDrop(
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
    }
  } else if (cell === "tree" || cell === "leaves") {
    if (
      cell === "leaves" ||
      (random(0, 29) === 0 && y < size - 1 && matrix[x][y + 1] === "tree")
    ) {
      const rootEntity = entities.createRoot(world, {
        [BURNABLE]: {
          burning: false,
          eternal: false,
          combusted: false,
          decayed: false,
          remains: oakBurnt,
        },
        [COLLIDABLE]: {},
        [FOG]: { visibility, type: "terrain" },
        [FRAGMENT]: { structure: -1 },
        [POSITION]: { x, y: y + 1 },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: stem,
        [STRUCTURABLE]: {},
      });
      const rootId = world.getEntityId(rootEntity);
      rootEntity[FRAGMENT].structure = rootId;

      entities.createPlant(world, {
        [BURNABLE]: {
          burning: false,
          eternal: false,
          combusted: false,
          decayed: false,
        },
        [FOG]: { visibility, type: "terrain" },
        [FRAGMENT]: { structure: rootId },
        [COLLIDABLE]: {},
        [POSITION]: { x, y },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: leaves,
        [RENDERABLE]: { generation: 0 },
      });

      matrix[x][y + 1] = "air";
    } else {
      entities.createOrganic(world, {
        [FOG]: { visibility, type: "terrain" },
        [BURNABLE]: {
          burning: false,
          eternal: false,
          combusted: false,
          decayed: false,
          remains: [treeBurnt1, treeBurnt2][random(0, 1)],
        },
        [COLLIDABLE]: {},
        [POSITION]: { x, y },
        [SPRITE]: [tree1, tree2][distribution(50, 50)],
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
      });
    }
  } else if (cell === "palm" || cell === "oasis") {
    const [stack, palm] = (
      [
        ["coconut", palm1],
        ["banana", palm2],
      ] as const
    )[random(0, 1)];

    if (random(0, 9) === 0) {
      const fruitEntity = entities.createFruit(world, {
        [BURNABLE]: {
          burning: false,
          eternal: false,
          combusted: false,
          decayed: false,
          remains: [palmBurnt1, palmBurnt2][random(0, 1)],
        },
        [COLLIDABLE]: {},
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [] },
        [LOOTABLE]: { disposable: false },
        [POSITION]: { x, y },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: palm,
        [RENDERABLE]: { generation: 0 },
      });
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
      if (cell === "oasis") {
        entities.createArea(world, {
          [ENVIRONMENT]: { biomes: ["desert"] },
          [POSITION]: { x, y },
          [TEMPO]: { amount: -1 },
        });
      }
    } else {
      entities.createOrganic(world, {
        [BURNABLE]: {
          burning: false,
          eternal: false,
          combusted: false,
          decayed: false,
          remains: [palmBurnt1, palmBurnt2][random(0, 1)],
        },
        [FOG]: { visibility, type: "terrain" },
        [COLLIDABLE]: {},
        [POSITION]: { x, y },
        [SPRITE]: palm,
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
      });
    }
  } else if (cell === "hedge" || cell === "spawn_hedge") {
    const { items, sprite, stats, faction } = generateUnitData(
      (["hedge1", "hedge2"] as const)[random(0, 1)]
    );
    const hedgeEntity = entities.createResource(world, {
      [ATTACKABLE]: { shots: 0 },
      [BELONGABLE]: { faction },
      [BURNABLE]: {
        burning: false,
        eternal: false,
        combusted: false,
        decayed: false,
      },
      [DROPPABLE]: { decayed: false },
      [FOG]: { visibility, type: "terrain" },
      [INVENTORY]: { items: [] },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: sprite,
      [STATS]: { ...emptyStats, ...stats },
    });
    populateInventory(world, hedgeEntity, items);
    if (cell === "spawn_hedge") {
      setIdentifier(world, hedgeEntity, "spawn_hedge");
    }
  } else if (cell === "tumbleweed") {
    const { items, sprite, stats, faction, patterns } =
      generateUnitData("tumbleweed");
    const tumbleweedEntity = entities.createTumbleweed(world, {
      [ATTACKABLE]: { shots: 0 },
      [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
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
      [SPRITE]: sprite,
      [STATS]: {
        ...emptyStats,
        ...stats,
      },
    });
    entities.createTile(world, {
      [ENVIRONMENT]: { biomes: ["desert"] },
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: sand,
      [TEMPO]: { amount: -1 },
    });
    populateInventory(world, tumbleweedEntity, items);
  } else if (cell === "bush" || cell === "berry" || cell === "berry_one") {
    entities.createWeeds(world, {
      [BURNABLE]: {
        burning: false,
        eternal: false,
        combusted: false,
        decayed: false,
      },
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [SPRITE]: bush,
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
    });

    if (cell === "berry" || cell === "berry_one") {
      createItemAsDrop(
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
    }
  } else if (cell === "grass" || cell === "flower" || cell === "flower_one") {
    entities.createWeeds(world, {
      [BURNABLE]: {
        burning: false,
        eternal: false,
        combusted: false,
        decayed: false,
      },
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [SPRITE]: grass,
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
    });
    if (cell === "flower" || cell === "flower_one") {
      createItemAsDrop(
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
    }
  } else if (cell === "leaf") {
    createItemAsDrop(world, { x, y }, entities.createItem, {
      [ITEM]: {
        stackable: "leaf",
        amount: distribution(80, 15, 5) + 1,
        bound: false,
      },
      [SPRITE]: getItemSprite({ stackable: "leaf" }, "resource"),
    });
  } else if (cell === "coin_one") {
    const coinItem = createItemAsDrop(world, { x, y }, entities.createItem, {
      [ITEM]: {
        stackable: "coin",
        amount: 1,
        bound: false,
      },
      [SPRITE]: getItemSprite({ stackable: "coin" }, "resource"),
    });
    setIdentifier(world, world.assertById(coinItem[ITEM].carrier), "coin");
  } else if (cell === "cactus") {
    const { sprite, stats, faction, items } = generateUnitData(
      (["cactus1", "cactus2"] as const)[random(0, 1)]
    );
    entities.createArea(world, {
      [ENVIRONMENT]: { biomes: ["desert"] },
      [POSITION]: { x, y },
      [TEMPO]: { amount: -1 },
    });
    const cactusEntity = entities.createCactus(world, {
      [ATTACKABLE]: { shots: 0 },
      [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
      [BELONGABLE]: { faction },
      [DROPPABLE]: { decayed: false, remains: sand },
      [FOG]: { visibility, type: "terrain" },
      [INVENTORY]: { items: [] },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPIKABLE]: { damage: stats.power },
      [SPRITE]: sprite,
      [STATS]: { ...emptyStats, ...stats },
    });
    populateInventory(world, cactusEntity, items);
  } else if (
    cell === "wood_door" ||
    cell === "guide_door" ||
    cell === "nomad_door" ||
    cell === "iron_door"
  ) {
    const doorEntity = entities.createDoor(world, {
      [ENTERABLE]: { sprite: doorOpen, orientation: "down" },
      [FOG]: { visibility, type: "float" },
      [LAYER]: {},
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [LOCKABLE]: {
        locked: true,
        material: cell === "iron_door" ? "iron" : undefined,
      },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: cell === "iron_door" ? doorClosedIron : doorClosedWood,
      [TOOLTIP]: {
        dialogs: [],
        persistent: false,
        nextDialog: 0,
      },
    });
    if (["guide_door", "nomad_door"].includes(cell)) {
      setIdentifier(world, doorEntity, cell);
    }
  } else if (cell === "spawn_key") {
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
        [SPRITE]: ironKey,
      }
    );
    setIdentifier(world, world.assertById(spawnKeyEntity[ITEM].carrier), cell);
  } else if (cell === "spawn_sign") {
    const spawnSignData = generateUnitData("sign");
    const spawnSign = entities.createSign(world, {
      [ATTACKABLE]: { shots: 0 },
      [BELONGABLE]: { faction: spawnSignData.faction },
      [BURNABLE]: {
        burning: false,
        eternal: false,
        decayed: false,
        combusted: false,
        remains: [fenceBurnt1, fenceBurnt2][random(0, 1)],
      },
      [DROPPABLE]: {
        decayed: false,
        remains: choice(fenceBurnt1, fenceBurnt2),
      },
      [FOG]: { visibility: "hidden", type: "terrain" },
      [INVENTORY]: { items: [] },
      [LAYER]: {},
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: spawnSignData.sprite,
      [STATS]: {
        ...emptyStats,
        ...spawnSignData.stats,
      },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
    });
    populateInventory(world, spawnSign, spawnSignData.items);
    createPopup(world, spawnSign, {
      deals: [],
      lines: [createText("Welcome to Alive!", colors.silver)],
      transaction: "info",
      targets: [],
    });
  } else if (cell === "gate") {
    const doorEntity = entities.createPassage(world, {
      [FOG]: { visibility, type: "float" },
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [LOCKABLE]: {
        locked: true,
        material: "iron",
      },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: doorClosedIron,
      [TOOLTIP]: {
        dialogs: [],
        persistent: false,
        nextDialog: 0,
      },
    });
    setIdentifier(world, doorEntity, "gate");
  } else if (cell === "campfire" || cell === "fireplace") {
    entities.createFire(world, {
      [BURNABLE]: {
        burning: cell === "campfire",
        eternal: true,
        combusted: false,
        decayed: false,
      },
      [FOG]: { visibility, type: "object" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: campfire,
    });
  } else if (cell === "pot" || cell === "intro_pot") {
    const { sprite, stats, faction, items, equipments } =
      generateUnitData("pot");
    const potEntity = entities.createChest(world, {
      [ATTACKABLE]: { shots: 0 },
      [BELONGABLE]: { faction },
      [DROPPABLE]: { decayed: false },
      [FOG]: { visibility, type: "terrain" },
      [INVENTORY]: { items: [] },
      [LAYER]: {},
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: sprite,
      [STATS]: {
        ...emptyStats,
        ...stats,
      },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
    });
    if (cell === "intro_pot") {
      createItemInInventory(world, potEntity, entities.createItem, {
        [ITEM]: {
          stackable: "coin",
          amount: 3,
        },
        [SPRITE]: getItemSprite({ stackable: "coin" }),
      });
      setIdentifier(world, potEntity, "pot");
    } else {
      populateInventory(world, potEntity, items, equipments);
    }
  } else if (cell === "fence") {
    const { sprite, stats, faction, items, equipments } =
      generateUnitData("fence");
    const remains = [fenceBurnt1, fenceBurnt2][random(0, 1)];
    const fenceEntity = entities.createObject(world, {
      [ATTACKABLE]: { shots: 0 },
      [BELONGABLE]: { faction },
      [BURNABLE]: {
        burning: false,
        eternal: false,
        decayed: false,
        combusted: false,
        remains,
      },
      [DROPPABLE]: { decayed: false, remains },
      [FOG]: { visibility, type: "terrain" },
      [INVENTORY]: { items: [] },
      [LAYER]: {},
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: sprite,
      [STATS]: {
        ...emptyStats,
        ...stats,
      },
    });
    populateInventory(world, fenceEntity, items, equipments);
  } else if (cell === "fence_door") {
    entities.createPath(world, {
      [ENVIRONMENT]: { biomes: ["path"] },
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: none,
      [TEMPO]: { amount: 2 },
    });
    entities.createGate(world, {
      [BURNABLE]: {
        burning: false,
        eternal: false,
        decayed: false,
        combusted: false,
        remains: fenceDoorBurnt,
      },
      [FOG]: { visibility, type: "terrain" },
      [LOCKABLE]: { locked: true },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: fenceDoor,
      [TOOLTIP]: {
        dialogs: [],
        persistent: false,
        nextDialog: 0,
      },
    });
  } else if (cell === "box") {
    const { items, equipments, sprite, stats, faction } =
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
    const boxEntity = entities.createBox(world, {
      [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
      [ATTACKABLE]: { shots: 0 },
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
      [SPRITE]: sprite,
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      [STATS]: { ...emptyStats, ...stats },
    });
    populateInventory(world, boxEntity, items, equipments);
  } else if (cell === "mob" || cell === "spawn_prism") {
    const mobUnit = generateNpcData(
      cell === "spawn_prism" ? "prism" : generateNpcKey(hillsNpcDistribution)
    );

    const mobEntity = entities.createMob(world, {
      [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
      [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
      [ATTACKABLE]: { shots: 0 },
      [BEHAVIOUR]: { patterns: mobUnit.patterns },
      [BELONGABLE]: { faction: mobUnit.faction },
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
        spring: mobUnit.spring || {
          duration: 200,
        },
        lastInteraction: 0,
        flying: false,
      },
      [NPC]: { type: mobUnit.type },
      [ORIENTABLE]: {},
      [POSITION]: { x, y },
      [RECHARGABLE]: { hit: false },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: mobUnit.sprite,
      [STATS]: {
        ...emptyStats,
        ...mobUnit.stats,
      },
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: { dialogs: [], persistent: true, nextDialog: -1 },
    });
    populateInventory(
      world,
      mobEntity,
      cell === "spawn_prism" ? [] : mobUnit.items,
      mobUnit.equipments
    );

    if (cell === "spawn_prism") {
      setIdentifier(world, mobEntity, "spawn_prism");

      // create key and XP
      createItemInInventory(world, mobEntity, entities.createItem, {
        [ITEM]: {
          stat: "xp",
          amount: 1,
        },
        [SPRITE]: xp,
      });
      const spawnKeyEntity = createItemInInventory(
        world,
        mobEntity,
        entities.createItem,
        {
          [ITEM]: {
            consume: "key",
            material: "iron",
            amount: 1,
          },
          [SPRITE]: ironKey,
        }
      );
      setIdentifier(world, spawnKeyEntity, "spawn_key");
    }
  } else if (
    ["house_left", "house_right", "basement_left", "basement_right"].includes(
      cell
    )
  ) {
    entities.createWall(world, {
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
  } else if (cell === "wall") {
    entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: wallInside, orientation: "down" },
      [FOG]: { visibility, type: "terrain" },
      [LAYER]: {},
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [POSITION]: { x, y },
      [SPRITE]: house,
      [RENDERABLE]: { generation: 0 },
    });
  } else if (cell === "wall_window") {
    entities.createWall(world, {
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
  } else if (cell === "house") {
    entities.createFloat(world, {
      [ENTERABLE]: { sprite: none },
      [FOG]: { visibility, type: "float" },
      [LAYER]: {},
      [POSITION]: { x, y },
      [SPRITE]: house,
      [RENDERABLE]: { generation: 0 },
    });
  } else if (cell === "roof") {
    entities.createFloat(world, {
      [ENTERABLE]: { sprite: none },
      [FOG]: { visibility, type: "float" },
      [LAYER]: {},
      [POSITION]: { x, y },
      [SPRITE]: roof,
      [RENDERABLE]: { generation: 0 },
    });
  } else if (cell === "roof_left") {
    entities.createWall(world, {
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
  } else if (cell === "roof_right") {
    entities.createWall(world, {
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
  } else if (cell === "roof_left_up") {
    entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: roofLeftUpInside },
      [FOG]: { visibility, type: "float" },
      [LAYER]: {},
      [LIGHT]: { brightness: 0, darkness: 0, visibility: 0 },
      [POSITION]: { x, y },
      [SPRITE]: roofLeftUp,
      [RENDERABLE]: { generation: 0 },
    });
  } else if (cell === "roof_up") {
    entities.createWall(world, {
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
  } else if (cell === "roof_up_right") {
    entities.createWall(world, {
      [COLLIDABLE]: {},
      [ENTERABLE]: { sprite: roofUpRightInside },
      [LAYER]: {},
      [LIGHT]: { brightness: 0, darkness: 0, visibility: 0 },
      [FOG]: { visibility, type: "float" },
      [POSITION]: { x, y },
      [SPRITE]: roofUpRight,
      [RENDERABLE]: { generation: 0 },
    });
  } else if (cell === "roof_down_left") {
    entities.createWall(world, {
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
  } else if (cell === "roof_down") {
    entities.createFloat(world, {
      [ENTERABLE]: { sprite: none },
      [FOG]: { visibility, type: "float" },
      [LAYER]: {},
      [POSITION]: { x, y },
      [SPRITE]: roofDown,
      [RENDERABLE]: { generation: 0 },
    });
  } else if (cell === "roof_right_down") {
    entities.createWall(world, {
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
  } else if (cell === "house_window") {
    entities.createFloat(world, {
      [ENTERABLE]: { sprite: none },
      [FOG]: { visibility, type: "float" },
      [LAYER]: {},
      [POSITION]: { x, y },
      [SPRITE]: window,
      [RENDERABLE]: { generation: 0 },
    });
  } else if (cell === "house_aid") {
    entities.createWall(world, {
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
      [SPRITE]: houseAid,
      [RENDERABLE]: { generation: 0 },
    });
  } else if (cell === "house_armor") {
    entities.createWall(world, {
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
      [SPRITE]: houseArmor,
      [RENDERABLE]: { generation: 0 },
    });
  } else if (cell === "house_mage") {
    entities.createWall(world, {
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
      [SPRITE]: houseMage,
      [RENDERABLE]: { generation: 0 },
    });
  } else if (cell === "house_trader") {
    entities.createWall(world, {
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
  } else if (cell === "chest_tower_statue") {
    const towerEntity = entities.createTerrain(world, {
      [COLLIDABLE]: {},
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [SPRITE]: [rock1, rock2][random(0, 1)],
      [RENDERABLE]: { generation: 0 },
    });
    setIdentifier(world, towerEntity, "chest_tower_statue");
  } else if (cell === "chest_tower") {
    const towerUnit = generateNpcData("waveTower");
    const towerEntity = entities.createMob(world, {
      [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
      [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
      [ATTACKABLE]: { shots: 0 },
      [BEHAVIOUR]: { patterns: towerUnit.patterns },
      [BELONGABLE]: { faction: towerUnit.faction },
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
      [SPRITE]: towerUnit.sprite,
      [STATS]: { ...emptyStats, ...towerUnit.stats },
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: {
        dialogs: [],
        persistent: false,
        nextDialog: -1,
      },
    });
    populateInventory(
      world,
      towerEntity,
      towerUnit.items,
      towerUnit.equipments
    );
    setIdentifier(world, towerEntity, "chest_tower");
  } else if (cell === "chest_boss") {
    const bossUnit = generateNpcData("chestBoss");

    const bossEntity = entities.createMob(world, {
      [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
      [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
      [ATTACKABLE]: { shots: 0 },
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
      [SPRITE]: bossUnit.sprite,
      [STATS]: {
        ...emptyStats,
        ...bossUnit.stats,
      },
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
    });
    populateInventory(world, bossEntity, bossUnit.items, bossUnit.equipments);

    npcSequence(world, bossEntity, "chestNpc", {});
    setIdentifier(world, bossEntity, "chest_boss");
  } else if (cell === "chest_mob") {
    const mobUnit = generateNpcData(
      (["goldPrism", "goldOrb", "goldEye"] as const)[distribution(33, 33, 33)]
    );
    const mobEntity = entities.createMob(world, {
      [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
      [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
      [ATTACKABLE]: { shots: 0 },
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
      [SPRITE]: mobUnit.sprite,
      [STATS]: { ...emptyStats, ...mobUnit.stats },
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: {
        dialogs: [],
        persistent: true,
        nextDialog: -1,
      },
    });
    populateInventory(
      world,
      mobEntity,
      [
        {
          stat: (["hp", "mp"] as const)[distribution(70, 30)],
          amount: 1,
          bound: false,
        },
      ],
      mobUnit.equipments
    );
    setIdentifier(world, mobEntity, "chest_mob");
  } else if (cell === "portal") {
    entities.createPortal(world, {
      [FOG]: { visibility, type: "terrain" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: portal,
      [TOOLTIP]: {
        dialogs: [
          createDialog("You made it!"),
          createDialog("Boss is defeated"),
          createDialog("Step into portal"),
          createDialog("Enter next world"),
        ],
        persistent: false,
        nextDialog: -1,
      },
    });
  }
};
