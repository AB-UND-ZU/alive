import { Item } from "../engine/components/item";
import { Sprite } from "../engine/components/sprite";
import { getClassSprite, getItemSprite } from "../game/assets/utils";
import { getFacingLayers } from "../game/assets/ui";
import { Pixels } from "./visuals";

export function equippedPortrait(item: Partial<Item>): Sprite | null {
  if (item.weapon !== "sword" && !item.offhand) return null;
  const scout = getClassSprite("scout").layers;
  const equipment = getFacingLayers(
    getItemSprite(item),
    item.weapon ? "down" : undefined
  );
  return {
    name: "Equipped Scout",
    layers: item.offhand ? [...equipment, ...scout] : [...scout, ...equipment],
  };
}
export function EquippedPreview({ item }: { item: Partial<Item> }) {
  const sprite = equippedPortrait(item);
  return sprite ? <Pixels rows={[[sprite]]} label="Equipped Scout" /> : null;
}
