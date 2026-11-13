import { World } from "../../engine";
import { TypedEntity } from "../../engine/entities";
import { ITEM, Item, rechargables } from "../../engine/components/item";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { INVENTORY } from "../../engine/components/inventory";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { SPRITE } from "../../engine/components/sprite";
import { STATS } from "../../engine/components/stats";
import { getItemSprite } from "../../game/assets/utils";
import { harvestConditions } from "../../game/balancing/harvesting";
import { createText } from "../../game/assets/ui";
import { colors } from "../../game/assets/colors";
import { repeat } from "../../game/math/std";
import { centerSprites } from "../../game/assets/pixels";
import {
  mana,
  ninePlusAmmo,
  ninePlusMana,
  none,
} from "../../game/assets/sprites";

export const getActionActivations = (
  world: World,
  hero: TypedEntity,
  item: Item,
  alignRight: boolean
) => {
  const itemSprite = getItemSprite(item, "display");
  const hookCondition = hero[CONDITIONABLE]?.hook;

  if (
    item.skill === "bow" ||
    rechargables.includes(item.skill as (typeof rechargables)[number]) ||
    (item.tool === "hook" && !hookCondition)
  ) {
    const ammo =
      item.skill === "bow" ? "arrow" : item.tool === "hook" ? "worm" : "charge";
    const stackableItem = hero[INVENTORY]?.items
      .map((itemId) => world.assertByIdAndComponents(itemId, [ITEM]))
      .find((item) => item[ITEM].stackable === ammo);
    const stackableSprite = getItemSprite({ stackable: ammo });
    const supply = stackableItem ? stackableItem[ITEM].amount : 0;
    const supplySegment =
      supply > 99
        ? [...createText("9", colors.silver), ninePlusAmmo]
        : createText(supply.toString(), colors.silver);

    return [
      ...repeat(none, alignRight ? 2 : 0),
      itemSprite,
      ...createText("1", colors.silver),
      ...createText("/", colors.grey),
      ...supplySegment,
      stackableSprite,
      ...repeat(none, alignRight ? 0 : 2),
    ].slice(alignRight ? -6 : 0, alignRight ? undefined : 6);
  } else if (
    item.tool === "axe" ||
    item.tool === "pickaxe" ||
    item.tool === "shovel"
  ) {
    if (!hero[CONDITIONABLE]?.[harvestConditions[item.tool]]) {
      return centerSprites([itemSprite], 6);
    }
    const weaponEntity = world.getEntityByIdAndComponents(
      hero[EQUIPPABLE]?.weapon,
      [SPRITE]
    );
    return centerSprites([weaponEntity?.[SPRITE] || none], 6);
  } else if (
    item.tool === "hook" &&
    hookCondition &&
    !hookCondition.orientation
  ) {
    const weaponEntity = world.getEntityByIdAndComponents(
      hero[EQUIPPABLE]?.weapon,
      [SPRITE]
    );
    return centerSprites([weaponEntity?.[SPRITE] || none], 6);
  } else if (item.spell) {
    const mp = hero[STATS]?.mp || 0;
    const mpSegment =
      mp > 99
        ? [...createText("9", colors.blue), ninePlusMana]
        : createText(mp.toString(), colors.blue);
    return [
      ...repeat(none, alignRight ? 2 : 0),
      itemSprite,
      ...createText("1", colors.blue),
      ...createText("/", colors.navy),
      ...mpSegment,
      mana,
      ...repeat(none, alignRight ? 0 : 2),
    ].slice(alignRight ? -6 : 0, alignRight ? undefined : 6);
  } else if (item.weapon) {
    const weaponEntity = world.getEntityByIdAndComponents(
      hero[EQUIPPABLE]?.weapon,
      [SPRITE]
    );
    return centerSprites([weaponEntity?.[SPRITE] || none], 6);
  }

  return repeat(none, 6);
};
