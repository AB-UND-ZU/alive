import { entities, World } from "../../../engine";
import { POSITION } from "../../../engine/components/position";
import { LEVEL, LevelName } from "../../../engine/components/level";
import { iterateMatrix, matrixFactory } from "../../math/matrix";
import { centerArea, roomSize, up1Area, up2Area, up3Area } from "./areas";
import { VIEWABLE } from "../../../engine/components/viewable";
import {
  assignBuilding,
  createCell,
  createChest,
  createNpc,
  insertArea,
} from "./../../../bindings/creation";
import {
  assertIdentifierAndComponents,
  setIdentifier,
} from "../../../engine/utils";
import { getItemSprite, npcSequence, questSequence } from "../../assets/utils";
import {
  disposeEntity,
  getCell,
  registerEntity,
} from "../../../engine/systems/map";
import { add } from "../../math/std";
import { getItemPrice } from "../../balancing/trading";
import { createPopup } from "../../../engine/systems/popup";
import { RENDERABLE } from "../../../engine/components/renderable";
import { SEQUENCABLE } from "../../../engine/components/sequencable";
import { FOG } from "../../../engine/components/fog";
import { SPRITE } from "../../../engine/components/sprite";
import { createItemAsDrop } from "../../../engine/systems/drop";
import { Item, ITEM } from "../../../engine/components/item";
import { getGearStat } from "../../balancing/equipment";
import { ORIENTABLE } from "../../../engine/components/orientable";
import { TOOLTIP } from "../../../engine/components/tooltip";
import { createDialog } from "../../assets/sprites";
import { isTouch } from "../../../components/Dimensions";

export const overworldSize = 160;
export const overworldName: LevelName = "LEVEL_OVERWORLD";

export const generateOverworld = async (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const worldMatrix = matrixFactory<string>(size, size, (x, y) => "");

  // insert rooms
  insertArea(worldMatrix, centerArea, 0, 0);
  insertArea(worldMatrix, up1Area, 0, -roomSize.y);
  insertArea(worldMatrix, up2Area, 0, -roomSize.y * 2);
  insertArea(worldMatrix, up3Area, 0, -roomSize.y * 3);

  iterateMatrix(worldMatrix, (x, y, cell) => {
    createCell(
      world,
      worldMatrix,
      { x, y },
      cell,
      cell === "granite" ? "fog" : "hidden",
      false
    );

    // track distribution of cell types
    world.metadata.gameEntity[LEVEL].cells[cell] = (
      world.metadata.gameEntity[LEVEL].cells[cell] || []
    ).concat([{ x, y }]);
  });

  const viewpointEntity = entities.createWorld(world, {
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [VIEWABLE]: { active: true, priority: 30 },
  });
  npcSequence(world, viewpointEntity, "overworldNpc", {});

  // register all entities to allow post-processing
  const registerableEntites = world.getEntities([POSITION]);
  registerableEntites.forEach((registerableEntity) => {
    registerEntity(world, registerableEntity);
  });

  // post process doors
  const centerUpDoorPosition = { x: 0, y: roomSize.y / -2 };
  const centerUpDoor = createCell(
    world,
    worldMatrix,
    centerUpDoorPosition,
    "iron_entry",
    "hidden"
  );
  setIdentifier(world, centerUpDoor!, "center_up_door");
  const north1UpDoor = createCell(
    world,
    worldMatrix,
    add(centerUpDoorPosition, { x: 0, y: -roomSize.y }),
    "iron_entry",
    "hidden"
  );
  setIdentifier(world, north1UpDoor!, "north1_up_door");
  createCell(
    world,
    worldMatrix,
    add(centerUpDoorPosition, { x: 0, y: -roomSize.y * 2 }),
    "iron_entry",
    "hidden"
  );
  createCell(
    world,
    worldMatrix,
    add(centerUpDoorPosition, { x: 0, y: -roomSize.y * 3 }),
    "iron_entry",
    "hidden"
  );

  // post process buildings
  const guideDoor = assertIdentifierAndComponents(world, "guide_door", [
    POSITION,
  ]);
  const guideHouse = add(guideDoor[POSITION], { x: 1, y: -2 });
  assignBuilding(world, guideHouse);

  // create guide with chest
  const keyPosition = add(guideHouse, { x: -1, y: 0 });
  const guideItems: Omit<Item, "carrier" | "bound">[] = [
    {
      consume: "key",
      material: "iron",
      amount: 1,
    },
    {
      stackable: "apple",
      amount: 1,
    },
  ];
  const guideChestEntity = createChest(
    world,
    "commonChest",
    keyPosition,
    guideItems
  );
  const guideChestId = world.getEntityId(guideChestEntity);
  setIdentifier(world, guideChestEntity, "guide_chest");

  const guidePosition = add(guideHouse, { x: 2, y: 0 });
  const guideEntity = createNpc(world, "guide", guidePosition);
  guideEntity[TOOLTIP].dialogs = [
    createDialog("Hi stranger"),
    createDialog("How are you?"),
    createDialog("I'm the Guide"),
    createDialog("And I have a key"),
    createDialog(isTouch ? "Tap on [SHOP]" : "SPACE to shop"),
  ];
  createPopup(world, guideEntity, {
    deals: guideItems.map((item) => ({
      item,
      stock: 1,
      price: getItemPrice(item),
      carrier: guideChestId,
    })),
    transaction: "buy",
  });
  npcSequence(world, guideEntity, "guideNpc", {});

  // give hero initial quest
  const heroEntity = assertIdentifierAndComponents(world, "hero", [
    POSITION,
    VIEWABLE,
  ]);
  questSequence(world, heroEntity, "centerQuest", {});

  // temporary test mode
  if (window.location.search.substring(1) === "test") {
    // clear title
    const titleWidth = 17;
    const titleHeight = 3;
    const titleCenter = { x: 0, y: -3 };
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
        if (entity[FOG]?.type === "float") disposeEntity(world, entity);
      });
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
          stat: "xp",
          amount: Infinity,
        },
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
          consume: "potion1",
          material: "fire",
          amount: Infinity,
        },
        {
          consume: "potion1",
          material: "water",
          amount: Infinity,
        },
        {
          equipment: "torch",
          amount: Infinity,
        },
        {
          consume: "key",
          material: "iron",
          amount: Infinity,
        },
      ],
      [
        {
          equipment: "sword",
          material: "wood",
          amount: getGearStat("sword", "wood"),
        },
        {
          equipment: "sword",
          material: "iron",
          amount: getGearStat("sword", "iron"),
        },
        {
          equipment: "sword",
          material: "gold",
          amount: getGearStat("sword", "gold"),
        },
        {
          equipment: "sword",
          material: "aether",
          amount: 99,
        },
      ],
      [
        {
          equipment: "shield",
          material: "wood",
          amount: getGearStat("shield", "wood"),
        },
        {
          equipment: "shield",
          material: "iron",
          amount: getGearStat("shield", "iron"),
        },
        {
          equipment: "shield",
          material: "gold",
          amount: getGearStat("shield", "gold"),
        },
        {
          equipment: "shield",
          material: "aether",
          amount: 99,
        },
      ],
      [
        {
          equipment: "primary",
          primary: "wave1",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "wave1",
          material: "fire",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "wave1",
          material: "water",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "wave1",
          material: "earth",
          amount: 1,
        },
      ],
      [
        {
          equipment: "primary",
          primary: "beam1",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "beam1",
          material: "fire",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "beam1",
          material: "water",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "beam1",
          material: "earth",
          amount: 1,
        },
      ],
      [
        {
          equipment: "secondary",
          secondary: "bow",
          amount: 1,
        },
        {
          stackable: "arrow",
          amount: Infinity,
        },
        {
          equipment: "secondary",
          secondary: "slash",
          amount: 1,
        },
        {
          stackable: "charge",
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
            x: columnIndex * 2 + (columnIndex >= 4 ? 4 : 0),
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
