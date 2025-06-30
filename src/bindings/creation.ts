import { Entity } from "ecs";
import { getItemSprite } from "../components/Entity/utils";
import { entities, World } from "../engine";
import { FOG } from "../engine/components/fog";
import { ITEM, Item } from "../engine/components/item";
import { ORIENTABLE } from "../engine/components/orientable";
import { POSITION } from "../engine/components/position";
import { RENDERABLE } from "../engine/components/renderable";
import { SEQUENCABLE } from "../engine/components/sequencable";
import { SPRITE } from "../engine/components/sprite";
import { STRUCTURABLE } from "../engine/components/structurable";
import { VIEWABLE } from "../engine/components/viewable";
import { TypedEntity } from "../engine/entities";
import { createItemInInventory } from "../engine/systems/drop";
import { getEnterable } from "../engine/systems/enter";
import { getStatSprite, none } from "../game/assets/sprites";
import { add, copy, normalize, Point, signedDistance } from "../game/math/std";
import { LEVEL } from "../engine/components/level";
import { FRAGMENT } from "../engine/components/fragment";
import { Matrix } from "../game/math/matrix";

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
    [SPRITE]: none,
    [STRUCTURABLE]: {},
    [VIEWABLE]: { active: false, priority },
  });
  const buildingId = world.getEntityId(buildingEntity);

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

  return buildingEntity;
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
      else if (cell === "i") entity = "alive";
      else if (cell === "◙") entity = "gate";
      else if (cell === "◘") entity = "ore_one";
      else if (cell === "∙") entity = "coin_one";
      else if (cell === "o") entity = "intro_pot";
      else if (cell === "■") entity = "box";
      else if (cell === "¢") entity = "compass";
      else if (cell === "#") entity = "tree";
      else if (cell === "=") entity = "wood_two";
      else if (cell === ".") entity = "fruit_one";
      else if (cell === "ß") entity = "hedge";
      else if (cell === "τ") entity = "bush";
      else if (cell === "'") entity = "berry_one";
      else if (cell === ",") entity = "grass";
      else if (cell === "·") entity = "flower_one";
      else if (cell === "♀") entity = "guide";
      else if (cell === "►") entity = "prism";
      else if (cell === "*") entity = "campfire";
      else if (cell === "├") entity = "house_left";
      else if (cell === "└") entity = "basement_left";
      else if (cell === "┤") entity = "house_right";
      else if (cell === "┘") entity = "basement_right";
      else if (cell === "┴") entity = "wall";
      else if (cell === "─") entity = "wall_window";
      else if (cell === "G") entity = "guide_door";
      else if (cell === "N") entity = "nomad_door";
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
      else {
        console.error(`Unrecognized cell: ${cell}!`);
      }

      matrix[x][y] = entity;
    });
  });
};
