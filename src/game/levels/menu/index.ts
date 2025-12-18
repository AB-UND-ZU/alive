import { entities, World } from "../../../engine";
import { POSITION } from "../../../engine/components/position";
import { LEVEL, LevelName } from "../../../engine/components/level";
import { iterateMatrix, matrixFactory } from "../../math/matrix";
import { centerArea } from "./areas";
import { VIEWABLE } from "../../../engine/components/viewable";
import { createCell, insertArea } from "./../../../bindings/creation";
import { getItemSprite, npcSequence, questSequence } from "../../assets/utils";
import {
  disposeEntity,
  getCell,
  registerEntity,
} from "../../../engine/systems/map";
import { add } from "../../math/std";
import { RENDERABLE } from "../../../engine/components/renderable";
import { SEQUENCABLE } from "../../../engine/components/sequencable";
import { SPRITE } from "../../../engine/components/sprite";
import { createItemAsDrop } from "../../../engine/systems/drop";
import { Item, ITEM } from "../../../engine/components/item";
import { ORIENTABLE } from "../../../engine/components/orientable";
import { assertIdentifierAndComponents } from "../../../engine/utils";
import { FOG } from "../../../engine/components/fog";

export const menuSize = 40;
export const menuName: LevelName = "LEVEL_MENU";

export const generateMenu = async (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const worldMatrix = matrixFactory<string>(size, size, (x, y) => "air");

  insertArea(worldMatrix, centerArea, 0, 0);

  iterateMatrix(worldMatrix, (x, y, cell) => {
    createCell(world, worldMatrix, { x, y }, cell, "hidden");

    // track distribution of cell types
    world.metadata.gameEntity[LEVEL].cells[cell] = (
      world.metadata.gameEntity[LEVEL].cells[cell] || []
    ).concat([{ x, y }]);
  });

  const viewpointEntity = entities.createWorld(world, {
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [VIEWABLE]: { active: false, priority: 30 },
  });
  npcSequence(world, viewpointEntity, "menuNpc", {});

  // register all entities to allow post-processing
  const registerableEntites = world.getEntities([POSITION]);
  registerableEntites.forEach((registerableEntity) => {
    registerEntity(world, registerableEntity);
  });

  // give hero initial quest
  const heroEntity = assertIdentifierAndComponents(world, "hero", [
    POSITION,
    VIEWABLE,
  ]);
  questSequence(world, heroEntity, "menuQuest", {});

  // temporary test mode
  if (window.location.search.substring(1) === "test") {
    // clear title
    const titleWidth = 17;
    const titleHeight = 3;
    const titleCenter = { x: 0, y: -4 };
    matrixFactory(titleWidth, titleHeight, (x, y) => {
      Object.values(
        getCell(
          world,
          add(titleCenter, {
            x: x - (titleWidth - 1) / 2,
            y: y - (titleHeight - 1) / 2,
          })
        )
      ).forEach((entity) => {
        if (!entity[VIEWABLE] && entity[FOG]?.type !== "air") disposeEntity(world, entity);
      });
    });

    // add dummy and anvil
    createCell(
      world,
      worldMatrix,
      add(titleCenter, { x: 0, y: -4 }),
      "dummy",
      "hidden"
    );
    createCell(
      world,
      worldMatrix,
      add(titleCenter, { x: -4, y: -4 }),
      "kettle",
      "hidden"
    );
    createCell(
      world,
      worldMatrix,
      add(titleCenter, { x: 4, y: -4 }),
      "anvil",
      "hidden"
    );

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
          stackable: "coin",
          amount: Infinity,
        },
        {
          stackable: "ore",
          amount: Infinity,
        },
        {
          stackable: "stick",
          amount: Infinity,
        },
      ],
      [
        {
          consume: "potion",
          material: "wood",
          element: "fire",
          amount: 999,
        },
        {
          consume: "potion",
          material: "wood",
          element: "water",
          amount: 999,
        },
        {
          equipment: "torch",
          material: "wood",
          amount: 1,
        },
        {
          consume: "key",
          material: "iron",
          amount: 999,
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
          material: "iron",
          amount: 1,
        },
        {
          equipment: "sword",
          material: "gold",
          amount: 1,
        },
        {
          equipment: "sword",
          material: "diamond",
          amount: 99,
        },
      ],
      [
        {
          stat: "level",
          amount: Infinity,
        },
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
          stat: "haste",
          amount: Infinity,
        },
        {
          stat: "vision",
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
          equipment: "shield",
          material: "wood",
          amount: 1,
        },
        {
          equipment: "shield",
          material: "iron",
          amount: 1,
        },
        {
          equipment: "shield",
          material: "gold",
          amount: 1,
        },
        {
          equipment: "shield",
          material: "diamond",
          amount: 99,
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
      ],
      [
        {
          stackable: "arrow",
          amount: Infinity,
        },
        {
          stackable: "charge",
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
    ];

    const itemCorner = { x: -9, y: -5 };
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

  // queue all added entities to added listener
  world.cleanup();
};
