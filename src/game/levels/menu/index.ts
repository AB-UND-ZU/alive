import { entities, World } from "../../../engine";
import { POSITION } from "../../../engine/components/position";
import { LEVEL, LevelName } from "../../../engine/components/level";
import { createMatrix, matrixFactory, setMatrix } from "../../math/matrix";
import { centerArea, menuSpawn } from "./areas";
import { VIEWABLE } from "../../../engine/components/viewable";
import { CellType, createNpc, insertArea } from "./../../../bindings/creation";
import { getItemSprite, npcSequence, questSequence } from "../../assets/utils";
import { RENDERABLE } from "../../../engine/components/renderable";
import {
  SEQUENCABLE,
  WeatherSequence,
} from "../../../engine/components/sequencable";
import { SPRITE } from "../../../engine/components/sprite";
import { createItemAsDrop } from "../../../engine/systems/drop";
import { Item, ITEM } from "../../../engine/components/item";
import { ORIENTABLE } from "../../../engine/components/orientable";
import {
  assertIdentifierAndComponents,
  TEST_MODE,
} from "../../../engine/utils";
import {
  initializeArea,
  initializeCell,
} from "../../../engine/systems/initialize";
import { add, combine } from "../../math/std";
import { createSequence } from "../../../engine/systems/sequence";
import { none } from "../../assets/sprites";
import { STICKY } from "../../../engine/components/sticky";
import { createPopup } from "../../../engine/systems/popup";
import { getItemBuyPrice, purchasableItems } from "../../balancing/trading";
import { TRACKABLE } from "../../../engine/components/trackable";

export const menuSize = 42;
export const menuName: LevelName = "LEVEL_MENU";

export const generateMenu = async (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const worldMatrix = createMatrix<CellType>(size, size, "air");

  world.metadata.gameEntity[LEVEL].cells = worldMatrix;
  world.metadata.gameEntity[LEVEL].objects = createMatrix(
    size,
    size,
    undefined
  );
  world.metadata.gameEntity[LEVEL].initialized = createMatrix(
    size,
    size,
    false
  );

  // create menu layout and insert player
  insertArea(world, centerArea, 0, 0);
  setMatrix(worldMatrix, menuSpawn.x, menuSpawn.y, "player");
  initializeCell(world, menuSpawn.x, menuSpawn.y);

  // start world NPC
  const viewpointEntity = entities.createWorld(world, {
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [VIEWABLE]: { active: false, priority: 30 },
  });
  npcSequence(world, viewpointEntity, "menuNpc", {});

  // give hero initial quest
  const heroEntity = assertIdentifierAndComponents(world, "hero", [
    POSITION,
    VIEWABLE,
  ]);
  questSequence(world, heroEntity, "menuQuest", {});

  // set weather
  const weatherEntity = entities.createAnchor(world, {
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [STICKY]: {},
    [SPRITE]: none,
  });
  createSequence<"weather", WeatherSequence>(
    world,
    weatherEntity,
    "weather",
    "weatherStorm",
    {
      position: { x: 0, y: 0 },
      generation: 0,
      intensity: 0,
      drops: [],
      start: 0,
      end: Infinity,
      type: "snow",
      viewable: { x: 0, y: 0 },
    }
  );

  // temporary test mode
  if (TEST_MODE) {
    // clear title
    const titleWidth = 17;
    const titleHeight = 3;
    const titleCenter = { x: 0, y: -4 };
    matrixFactory(titleWidth, titleHeight, (x, y) => {
      setMatrix(
        worldMatrix,
        titleCenter.x + x - (titleWidth - 1) / 2,
        titleCenter.y + y - (titleHeight - 1) / 2,
        "air"
      );
    });

    // add dummy and anvil
    setMatrix(worldMatrix, titleCenter.x, titleCenter.y - 10, "campfire");
    setMatrix(worldMatrix, titleCenter.x + 4, titleCenter.y - 10, "dummy");
    setMatrix(worldMatrix, titleCenter.x - 4, titleCenter.y - 6, "bench");
    setMatrix(worldMatrix, titleCenter.x, titleCenter.y - 6, "kettle");
    setMatrix(worldMatrix, titleCenter.x + 4, titleCenter.y - 6, "anvil");

    // add trader
    const traderEntity = createNpc(
      world,
      "guide",
      combine(size, titleCenter, { x: -4, y: -10 })
    );

    createPopup(world, traderEntity, {
      deals: purchasableItems.map((item) => ({
        item: {
          ...item,
          amount: 1,
        },
        stock: Infinity,
        prices: getItemBuyPrice(item),
      })),

      tabs: ["buy", "sell"],
    });

    const itemColumns: Omit<Item, "bound" | "carrier">[][] = [
      [
        {
          stat: "hp",
          amount: Infinity,
        },
        {
          stat: "maxHp",
          amount: Infinity,
        },
        {
          stat: "mp",
          amount: Infinity,
        },
        {
          stat: "maxMp",
          amount: Infinity,
        },
      ],
      [
        {
          consume: "potion",
          material: "wood",
          stat: "hp",
          amount: Infinity,
        },
        {
          consume: "potion",
          material: "iron",
          stat: "hp",
          amount: Infinity,
        },
        {
          consume: "potion",
          material: "gold",
          stat: "hp",
          amount: Infinity,
        },
        {
          consume: "potion",
          material: "wood",
          stat: "mp",
          amount: Infinity,
        },
        {
          consume: "potion",
          material: "iron",
          stat: "mp",
          amount: Infinity,
        },
        {
          consume: "potion",
          material: "gold",
          stat: "mp",
          amount: Infinity,
        },
      ],
      [
        {
          stackable: "berry",
          amount: Infinity,
        },
        {
          stackable: "fruit",
          amount: Infinity,
        },
        {
          stackable: "flower",
          amount: Infinity,
        },
        {
          stackable: "herb",
          amount: Infinity,
        },
        {
          stackable: "leaf",
          amount: Infinity,
        },
        {
          stackable: "seed",
          amount: Infinity,
        },
      ],
      [
        {
          stackable: "apple",
          amount: Infinity,
        },
        {
          stackable: "banana",
          amount: Infinity,
        },
        {
          stackable: "shroom",
          amount: Infinity,
        },
        {
          stackable: "coconut",
          amount: Infinity,
        },
        {
          stackable: "grain",
          amount: Infinity,
        },
        {
          stackable: "wheat",
          amount: Infinity,
        },
      ],
      [
        {
          stackable: "salmon",
          amount: Infinity,
        },
        {
          stackable: "pike",
          amount: Infinity,
        },
        {
          stackable: "tuna",
          amount: Infinity,
        },
        {
          stackable: "cod",
          amount: Infinity,
        },
        {
          stackable: "bread",
          amount: Infinity,
        },
      ],
      [
        {
          stackable: "algae",
          amount: Infinity,
        },
        {
          stackable: "eel",
          amount: Infinity,
        },
        {
          stackable: "seastar",
          amount: Infinity,
        },
        {
          stackable: "pearl",
          amount: Infinity,
        },
      ],
      [
        {
          stackable: "granola",
          amount: Infinity,
        },
        {
          stackable: "juice",
          amount: Infinity,
        },
        {
          stackable: "toast",
          amount: Infinity,
        },
        {
          stackable: "tea",
          amount: Infinity,
        },
        {
          stackable: "soup",
          amount: Infinity,
        },
        {
          stackable: "stew",
          amount: Infinity,
        },
      ],
      [
        {
          stackable: "stick",
          amount: Infinity,
        },
        {
          stackable: "resource",
          material: "wood",
          amount: Infinity,
        },
        {
          stackable: "plank",
          amount: Infinity,
        },
        {
          stackable: "sand",
          amount: Infinity,
        },
      ],
      [
        {
          stackable: "ore",
          amount: Infinity,
        },
        {
          stackable: "resource",
          material: "iron",
          amount: Infinity,
        },
        {
          stackable: "resource",
          material: "diamond",
          amount: Infinity,
        },
        {
          stackable: "resource",
          material: "ruby",
          amount: Infinity,
        },
      ],
      [
        {
          stackable: "coin",
          amount: Infinity,
        },
        {
          stackable: "nugget",
          amount: Infinity,
        },
        {
          stackable: "resource",
          material: "gold",
          amount: Infinity,
        },
        {
          stackable: "ingot",
          amount: Infinity,
        },
      ],
      [
        {
          stackable: "resource",
          material: "wood",
          element: "air",
          amount: Infinity,
        },
        {
          stackable: "resource",
          material: "wood",
          element: "fire",
          amount: Infinity,
        },
        {
          stackable: "resource",
          material: "wood",
          element: "water",
          amount: Infinity,
        },
        {
          stackable: "resource",
          material: "wood",
          element: "earth",
          amount: Infinity,
        },
      ],
      [
        {
          stat: "level",
          amount: Infinity,
        },
        {
          stat: "damp",
          amount: Infinity,
        },
        {
          stat: "thaw",
          amount: Infinity,
        },
        {
          stat: "spike",
          amount: Infinity,
        },
      ],
      [
        {
          stat: "power",
          amount: Infinity,
        },
        {
          stat: "armor",
          amount: Infinity,
        },
        {
          stat: "wisdom",
          amount: Infinity,
        },
        {
          stat: "resist",
          amount: Infinity,
        },
        {
          stat: "vision",
          amount: Infinity,
        },
        {
          stat: "haste",
          amount: Infinity,
        },
      ],
      [
        {
          weapon: "sword",
          material: "wood",
          amount: 1,
        },
        {
          weapon: "spear",
          skill: "spear",
          material: "wood",
          amount: 1,
        },
        {
          weapon: "wand",
          skill: "wand",
          material: "wood",
          amount: 1,
        },
      ],
      [
        {
          offhand: "shield",
          material: "wood",
          amount: 1,
        },
      ],
      [
        {
          spell: "wave",
          material: "wood",
          amount: 1,
        },
        {
          spell: "beam",
          material: "wood",
          amount: 1,
        },
        {
          spell: "trap",
          material: "wood",
          amount: 1,
        },
        {
          spell: "dash",
          material: "wood",
          amount: 1,
        },
      ],
      [
        {
          skill: "bow",
          material: "wood",
          amount: 1,
        },
        {
          skill: "slash",
          material: "wood",
          amount: 1,
        },
        {
          skill: "zap",
          material: "wood",
          amount: 1,
        },
        {
          skill: "block",
          material: "wood",
          amount: 1,
        },
        {
          skill: "totem",
          material: "wood",
          amount: 1,
        },
      ],
      [
        {
          tool: "shovel",
          material: "wood",
          amount: 1,
        },
        {
          tool: "axe",
          material: "wood",
          amount: 1,
        },
        {
          tool: "hook",
          material: "wood",
          amount: 1,
        },
        {
          tool: "pickaxe",
          material: "wood",
          amount: 1,
        },
      ],
      [
        {
          accessory: "torch",
          material: "wood",
          amount: 1,
        },
        { accessory: "boots", material: "wood", amount: 1 },
        {
          accessory: "ring",
          material: "wood",
          amount: 1,
        },
        {
          accessory: "amulet",
          material: "wood",
          amount: 1,
        },
        {
          accessory: "compass",
          material: "iron",
          amount: 1,
        },
        {
          accessory: "map",
          material: "gold",
          amount: 1,
        },
      ],
      [
        {
          consume: "bucket",
          material: "iron",
          amount: Infinity,
        },
        {
          consume: "key",
          material: "iron",
          amount: Infinity,
        },
        {
          stackable: "arrow",
          amount: Infinity,
        },
        {
          stackable: "charge",
          amount: Infinity,
        },
        {
          stackable: "worm",
          amount: Infinity,
        },
      ],
      [
        {
          stackable: "letter",
          amount: Infinity,
        },
        {
          stackable: "golem",
          amount: Infinity,
        },
        {
          stackable: "schema",
          amount: Infinity,
        },
      ],
    ];

    const itemCorner = { x: 1 - itemColumns.length, y: -7 };
    itemColumns.forEach((items, columnIndex) => {
      items.forEach((item, rowIndex) => {
        createItemAsDrop(
          world,
          add(itemCorner, {
            x: columnIndex * 2,
            y: rowIndex,
          }),
          // @ts-ignore
          item.weapon
            ? entities.createSword
            : item.accessory === "compass"
            ? entities.createCompass
            : entities.createItem,
          {
            [ITEM]: { ...item, bound: false },
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
      });
    });
  }

  // initialize menu for NPC to attach to
  const centerRows = centerArea.split("\n");
  const menuWidth = centerRows[0].length;
  const menuHeight = centerRows.length;
  const menuCorner = { x: (menuWidth - 1) / -2, y: (menuHeight - 1) / -2 };
  initializeArea(
    world,
    menuCorner,
    add(menuCorner, { x: menuWidth, y: menuHeight })
  );
};
