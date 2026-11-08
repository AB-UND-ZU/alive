import { Item } from "../engine/components/item";
import { Sprite } from "../engine/components/sprite";
import { createAreaWorld, assertHero } from "../testing/harness";
import { createItemInInventory } from "../engine/systems/drop";
import * as entities from "../engine/entities";
import { getItemSprite } from "../game/assets/utils";
import { getSegments } from "../components/Entity/utils";
import { getFacingLayers } from "../game/assets/ui";
import { classDefinitions } from "../game/balancing/classes";
import { Pixels } from "./visuals";

const portraits = new Map<string, Sprite | null>();
export function equippedPortrait(item: Partial<Item>): Sprite | null {
  if (item.weapon !== "sword" && !item.offhand) return null;
  const key = JSON.stringify(item);
  if (portraits.has(key)) return portraits.get(key)!;
  const world = createAreaWorld("|♀|");
  const hero = world.assertByIdAndComponents(
    world.getEntityId(assertHero(world)),
    ["POSITION", "INVENTORY", "SPRITE", "EQUIPPABLE"]
  );
  hero.SPRITE = classDefinitions.scout.sprite;
  if (hero.SPAWNABLE) hero.SPAWNABLE.classKey = "scout";
  hero.EQUIPPABLE = {};
  const segments = () =>
    getSegments(world, hero, {
      isTransparent: false,
      receiveShadow: false,
    });
  const before = segments().length;
  const data = { ...item, amount: 1 };
  if (item.weapon === "sword")
    createItemInInventory(world, hero, entities.createSword, {
      ITEM: data,
      SPRITE: getItemSprite(data),
      ORIENTABLE: { facing: "down" },
      SEQUENCABLE: { states: {} },
    });
  else
    createItemInInventory(world, hero, entities.createItem, {
      ITEM: data,
      SPRITE: getItemSprite(data),
    });
  const equipped = segments();
  const sprite =
    equipped.length > before
      ? {
          name: "Equipped Scout",
          layers: equipped.flatMap((segment) =>
            getFacingLayers(segment.sprite, segment.facing, segment.amount)
          ),
        }
      : null;
  portraits.set(key, sprite);
  return sprite;
}
export function EquippedPreview({ item }: { item: Partial<Item> }) {
  const sprite = equippedPortrait(item);
  return sprite ? <Pixels rows={[[sprite]]} label="Equipped Scout" /> : null;
}
