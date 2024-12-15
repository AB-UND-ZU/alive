import { getItemSprite } from "../components/Entity/utils";
import { entities, World } from "../engine";
import { ITEM, Item } from "../engine/components/item";
import { ORIENTABLE } from "../engine/components/orientable";
import { SEQUENCABLE } from "../engine/components/sequencable";
import { SPRITE } from "../engine/components/sprite";
import { TypedEntity } from "../engine/entities";
import { createItemInInventory } from "../engine/systems/drop";
import { getStatSprite } from "../game/assets/sprites";

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
