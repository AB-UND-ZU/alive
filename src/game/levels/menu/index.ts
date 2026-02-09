import { entities, World } from "../../../engine";
import { POSITION } from "../../../engine/components/position";
import { LEVEL, LevelName } from "../../../engine/components/level";
import { createMatrix, matrixFactory, setMatrix } from "../../math/matrix";
import { centerArea, menuSpawn } from "./areas";
import { VIEWABLE } from "../../../engine/components/viewable";
import { CellType, insertArea } from "./../../../bindings/creation";
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
import { add } from "../../math/std";
import { createSequence } from "../../../engine/systems/sequence";
import { none } from "../../assets/sprites";
import { STICKY } from "../../../engine/components/sticky";

export const menuSize = 40;
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
    setMatrix(worldMatrix, titleCenter.x, titleCenter.y - 4, "dummy");
    setMatrix(worldMatrix, titleCenter.x - 4, titleCenter.y - 4, "kettle");
    setMatrix(worldMatrix, titleCenter.x + 4, titleCenter.y - 4, "anvil");

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
      ],
      [
        {
          stackable: "leaf",
          amount: Infinity,
        },
        {
          stackable: "seed",
          amount: Infinity,
        },
        {
          stackable: "stick",
          amount: Infinity,
        },
        {
          stackable: "resource",
          material: "wood",
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
          material: "gold",
          amount: Infinity,
        },
        {
          stackable: "resource",
          material: "diamond",
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
          stackable: "ingot",
          amount: Infinity,
        },
      ],
      [
        {
          stackable: "fruit",
          amount: Infinity,
        },
        {
          stackable: "herb",
          amount: Infinity,
        },
        {
          consume: "potion",
          material: "wood",
          element: "fire",
          amount: Infinity,
        },
        {
          consume: "potion",
          material: "wood",
          element: "water",
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
      ],
      [
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
          equipment: "sword",
          material: "wood",
          amount: 1,
        },
        {
          equipment: "sword",
          element: "earth",
          amount: 1,
        },
        {
          equipment: "shield",
          material: "wood",
          amount: 1,
        },
      ],
      [
        {
          equipment: "primary",
          primary: "wave",
          material: "wood",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "beam",
          material: "wood",
          amount: 1,
        },
      ],
      [
        {
          equipment: "secondary",
          secondary: "bow",
          material: "wood",
          amount: 1,
        },
        {
          equipment: "secondary",
          secondary: "slash",
          material: "wood",
          amount: 1,
        },
        {
          equipment: "secondary",
          secondary: "raise",
          material: "wood",
          amount: 1,
        },
        {
          equipment: "secondary",
          secondary: "block",
          material: "wood",
          amount: 1,
        },
      ],
      [
        { equipment: "boots", material: "wood", amount: 1 },
        {
          equipment: "secondary",
          secondary: "axe",
          material: "wood",
          amount: 1,
        },
        {
          equipment: "map",
          material: "iron",
          amount: 1,
        },
        {
          equipment: "torch",
          material: "wood",
          amount: 1,
        },
      ],
      [
        {
          equipment: "ring",
          material: "wood",
          amount: 1,
        },
        {
          equipment: "amulet",
          material: "wood",
          amount: 1,
        },
      ],
      [
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
      ],
    ];

    const itemCorner = { x: 1 - itemColumns.length, y: -5 };
    itemColumns.forEach((items, columnIndex) => {
      items.forEach((item, rowIndex) => {
        createItemAsDrop(
          world,
          add(itemCorner, {
            x: columnIndex * 2,
            y: rowIndex,
          }),
          // @ts-ignore
          item.equipment === "sword"
            ? entities.createSword
            : entities.createItem,
          {
            [ITEM]: { ...item, bound: false },
            [SPRITE]: getItemSprite(item),
            ...(item.equipment === "sword"
              ? {
                  [SEQUENCABLE]: { states: [] },
                  [ORIENTABLE]: {},
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
