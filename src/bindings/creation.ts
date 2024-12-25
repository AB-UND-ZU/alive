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
import { add, copy, Point, signedDistance } from "../game/math/std";
import { LEVEL } from "../engine/components/level";
import { FRAGMENT } from "../engine/components/fragment";

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

export const assignBuilding = (world: World, position: Point) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  const buildingEntity = entities.createBuilding(world, {
    [FOG]: { visibility: "hidden", type: "terrain" },
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: none,
    [STRUCTURABLE]: {},
    [VIEWABLE]: { active: false },
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
    const position =
      signedDistance(upCursor.x, rightCursor.x, size) === 0
        ? { x: leftCursor.x, y: upCursor.y - 1 }
        : add(upCursor, { x: 1, y: 0 });
    const target = getEnterable(world, position);

    if (!target) break;

    upCursor = target[POSITION];
    fragmentEntities.push(target);
  }

  for (const fragmentEntity of fragmentEntities) {
    world.addComponentToEntity(fragmentEntity, FRAGMENT, {
      structure: buildingId,
    });
  }

  return buildingEntity;
};
