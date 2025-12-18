import { entities, World } from "../../../engine";
import { POSITION } from "../../../engine/components/position";
import { LEVEL, LevelName } from "../../../engine/components/level";
import { iterateMatrix, matrixFactory } from "../../math/matrix";
import { leverPosition, roomSize, tutorialRooms } from "./areas";
import { VIEWABLE } from "../../../engine/components/viewable";
import {
  assignBuilding,
  createCell,
  createNpc,
  insertArea,
} from "../../../bindings/creation";
import {
  assertIdentifierAndComponents,
  setIdentifier,
} from "../../../engine/utils";
import { npcSequence } from "../../assets/utils";
import { registerEntity } from "../../../engine/systems/map";
import { add, copy } from "../../math/std";
import { getItemBuyPrice } from "../../balancing/trading";
import { createPopup } from "../../../engine/systems/popup";
import { RENDERABLE } from "../../../engine/components/renderable";
import { SEQUENCABLE } from "../../../engine/components/sequencable";
import { FOG } from "../../../engine/components/fog";
import { SPRITE } from "../../../engine/components/sprite";
import { Item } from "../../../engine/components/item";
import { TOOLTIP } from "../../../engine/components/tooltip";
import { chairLeft, createDialog, table } from "../../assets/sprites";
import { isTouch } from "../../../components/Dimensions";
import { LAYER } from "../../../engine/components/layer";
import { COLLIDABLE } from "../../../engine/components/collidable";
import { TypedEntity } from "../../../engine/entities";
import { applyWaterMap } from "../../../engine/systems/water";

export const tutorialSize = 72;
export const tutorialName: LevelName = "LEVEL_TUTORIAL";

export const generateTutorial = async (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const worldMatrix = matrixFactory<string>(size, size, () => "mountain");

  // insert rooms
  tutorialRooms.forEach((room, roomIndex) => {
    insertArea(worldMatrix, room.area, room.offsetX, room.offsetY, true);

    // create door to previous room
    const isLast = roomIndex === tutorialRooms.length - 1;
    const vertical = room.offsetX === 0;
    const doorPosition = vertical
      ? { x: room.offsetX, y: room.offsetY - roomSize.y / 2 }
      : { x: room.offsetX - roomSize.x / 2, y: room.offsetY };

    const doorEntity = createCell(
      world,
      worldMatrix,
      doorPosition,
      isLast ? "entry" : vertical ? "iron_entry" : "gold_entry",
      "fog"
    );
    setIdentifier(world, doorEntity!, `${room.name}:door`);

    if (roomIndex === 0) return;

    // cover room until it is revealed
    for (let x = 1 - roomSize.x / 2; x < roomSize.x / 2; x += 1) {
      for (let y = 1 - roomSize.y / 2; y < roomSize.y / 2; y += 1) {
        const floatEntity = createCell(
          world,
          worldMatrix,
          { x: x + room.offsetX, y: y + room.offsetY },
          "float",
          "fog"
        );
        setIdentifier(world, floatEntity!, `${room.name}:float`);
      }
    }
  });

  iterateMatrix(worldMatrix, (x, y, cell) => {
    createCell(
      world,
      worldMatrix,
      { x, y },
      cell,
      cell === "mountain" ? "fog" : "hidden",
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
    [VIEWABLE]: { active: true, priority: 30, spring: { duration: 0 } },
  });
  npcSequence(world, viewpointEntity, "tutorialNpc", {});

  // register all entities to allow post-processing
  const registerableEntites = world.getEntities([POSITION]);
  registerableEntites.forEach((registerableEntity) => {
    registerEntity(world, registerableEntity);
  });

  // post process buildings
  const guideDoor = assertIdentifierAndComponents(world, "guide_door", [
    POSITION,
  ]);
  const guideHouse = add(guideDoor[POSITION], { x: 1, y: -2 });
  assignBuilding(world, guideHouse);
  entities.createFurniture(world, {
    [FOG]: { visibility: "hidden", type: "terrain" },
    [LAYER]: {},
    [POSITION]: copy(guideHouse),
    [SPRITE]: table,
    [RENDERABLE]: { generation: 0 },
    [COLLIDABLE]: {},
  });
  entities.createFloor(world, {
    [FOG]: { visibility: "hidden", type: "terrain" },
    [LAYER]: {},
    [POSITION]: add(guideHouse, { x: -1, y: 0 }),
    [SPRITE]: chairLeft,
    [RENDERABLE]: { generation: 0 },
  });

  // create guide with chest
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
    {
      stackable: "banana",
      amount: 1,
    },
  ];

  const guidePosition = add(guideHouse, { x: 2, y: 0 });
  const guideEntity = createNpc(world, "guide", guidePosition);
  guideEntity[TOOLTIP].dialogs = [
    createDialog("Hi stranger"),
    createDialog("How are you?"),
    createDialog("I'm the Guide"),
    createDialog("And I have a key"),
    createDialog(isTouch ? "Tap on [SHOP]" : "[SPACE] to shop"),
  ];
  createPopup(world, guideEntity, {
    deals: guideItems.map((item) => ({
      item,
      stock: item.consume ? 1 : Infinity,
      prices: item.consume
        ? [{ stackable: "coin", amount: 1 }]
        : getItemBuyPrice(item),
    })),
    tabs: ["buy", "sell"],
  });

  // add lever to cycle back to fountain room
  const unlockLever = createCell(
    world,
    worldMatrix,
    leverPosition,
    "lever",
    "hidden"
  ) as TypedEntity<"TOOLTIP">;
  setIdentifier(world, unlockLever, "unlock_lever");

  // render deep water
  applyWaterMap(world);

  // queue all added entities to added listener
  world.cleanup();
};
