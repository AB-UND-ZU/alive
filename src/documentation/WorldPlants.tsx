import { useState } from "react";
import { worldRows } from "./WorldDiagram";
import { createCell } from "../bindings/creation";
import { createAreaWorld } from "../testing/harness";
import { disposeEntity, getCellEntities } from "../engine/systems/map";
import { Item } from "../engine/components/item";
import { getHarvestConfig, harvestTools } from "../game/balancing/harvesting";
import { Parts } from "./CatalogEntry";
import { LargePreview, previewBounds } from "./LargePreview";
import { ItemView, PlainTable } from "./visuals";

import { Sprite } from "../engine/components/sprite";
import {
  tree1,
  tree2,
  palm1,
  palm2,
  treeBurnt1,
  treeBurnt2,
  palmBurnt1,
  palmBurnt2,
  desertPalmBurnt1,
  desertPalmBurnt2,
  none,
} from "../game/assets/sprites";
import { mergeSprites, slotShadow } from "../game/assets/ui";

const families = [
  {
    name: "Tree",
    cells: ["tree", "tree", "apple", "stump", "stump"],
    variants: [
      tree1,
      tree2,
      undefined,
      mergeSprites(slotShadow, treeBurnt1),
      mergeSprites(slotShadow, treeBurnt2),
    ],
    titles: ["Tree 1", "Tree 2", "Apple", "Stump 1", "Stump 2"],
  },
  {
    name: "Palm",
    cells: [
      "palm",
      "palm",
      "banana",
      "coconut",
      "husk",
      "husk",
      "desert_husk",
      "desert_husk",
    ],
    variants: [
      palm1,
      palm2,
      undefined,
      undefined,
      mergeSprites(slotShadow, palmBurnt1),
      mergeSprites(slotShadow, palmBurnt2),
      mergeSprites(slotShadow, desertPalmBurnt1),
      mergeSprites(slotShadow, desertPalmBurnt2),
    ],
    titles: [
      "Palm 1",
      "Palm 2",
      "Banana",
      "Coconut",
      "Husk 1",
      "Husk 2",
      "Desert Husk 1",
      "Desert Husk 2",
    ],
  },
  { name: "Oak", cells: ["leaves", "root"], titles: ["Oak", "Root"] },
  { name: "Bush", cells: ["bush", "berry_one"] },
  { name: "Grass", cells: ["grass", "flower_one"] },
];

export function cellSnapshot(cell: string, variant?: Sprite) {
  const world = createAreaWorld("|♀|", { size: 16 });
  for (const entity of getCellEntities(world, { x: 6, y: 6 }))
    disposeEntity(world, entity);
  const created = createCell(world, { x: 6, y: 6 }, cell, "visible", false);
  if (variant)
    for (const entity of created.all)
      if (entity.HARVESTABLE && entity.SPRITE) entity.SPRITE = variant;
  const positions: number[] = [];
  const crops = new Map<number, Item>();
  const harvest = created.all.find((entity) => entity.HARVESTABLE)?.HARVESTABLE;
  for (const entity of created.all) {
    const position =
      entity.POSITION ||
      (entity.ITEM &&
        world.getEntityByIdAndComponents(entity.ITEM.carrier, ["POSITION"])
          ?.POSITION);
    if (!entity.SPRITE || !position) continue;
    positions.push(position.y);
    if (entity.ITEM) crops.set(world.getEntityId(entity), entity.ITEM);
    for (const itemId of entity.INVENTORY?.items || []) {
      const item = world.getEntityByIdAndComponents(itemId, ["SPRITE", "ITEM"]);
      if (item) crops.set(itemId, item.ITEM);
    }
  }
  return {
    sprites: worldRows(world, {
      x: 6,
      y: positions.length ? Math.min(...positions) : 6,
      width: 1,
      height: positions.length
        ? Math.max(...positions) - Math.min(...positions) + 1
        : 1,
    }).map((row) => row[0]),
    harvest,
    crops: [...crops.values()],
  };
}

let snapshots:
  | {
      name: string;
      cells: string[];
      titles?: string[];
      plants: ReturnType<typeof cellSnapshot>[];
    }[]
  | undefined;
export const worldPlantGroups = () =>
  (snapshots ||= families.map((family) => ({
    ...family,
    plants: family.cells.map((cell, index) => {
      const plant = cellSnapshot(cell, family.variants?.[index]);
      return cell === "root"
        ? { ...plant, sprites: [none, ...plant.sprites] }
        : plant;
    }),
  })));

export function WorldPlants() {
  const [groups] = useState(worldPlantGroups);
  return (
    <>
      {groups.map(({ name, cells, plants, titles }) => (
        <section
          className="CatalogEntry"
          key={name}
          id={"world-" + name.toLowerCase()}
        >
          <PlainTable
            headers={[
              name,
              ...cells.map(
                (cell, index) =>
                  titles?.[index] ||
                  (cell === "berry_one"
                    ? "Berry"
                    : cell === "flower_one"
                    ? "Flower"
                    : cell === "leaves"
                    ? "Oak"
                    : cell.charAt(0).toUpperCase() + cell.slice(1))
              ),
            ]}
            rows={[
              [
                "Sprite",
                ...plants.map((plant) => (
                  <LargePreview
                    sprites={plant.sprites}
                    bounds={previewBounds(plants.map((plant) => plant.sprites))}
                  />
                )),
              ],
              [
                "Tool",
                ...plants.map(({ harvest }) =>
                  harvest ? (
                    <ItemView
                      item={{
                        tool: harvestTools[harvest.resource],
                        material: "wood",
                      }}
                    />
                  ) : null
                ),
              ],
              ["Work", ...plants.map(({ harvest }) => harvest?.maximum)],
              [
                "Pickups",
                ...plants.map(({ crops }) =>
                  crops.length ? <Parts items={crops} /> : null
                ),
              ],
              [
                "Yields",
                ...plants.map(({ harvest }) =>
                  harvest ? (
                    <Parts items={getHarvestConfig(harvest.resource).yields} />
                  ) : null
                ),
              ],
            ]}
          />
        </section>
      ))}
    </>
  );
}

let rottenRows: ReturnType<typeof worldRows> | undefined;
export function RottenPreview() {
  if (!rottenRows) {
    const world = createAreaWorld("|♀|", { size: 16 });
    for (let x = 6; x <= 8; x++)
      for (const entity of getCellEntities(world, { x, y: 6 }))
        disposeEntity(world, entity);
    createCell(world, { x: 6, y: 6 }, "rotten_stem_right", "visible", false);
    rottenRows = worldRows(world, { x: 6, y: 6, width: 3, height: 1 });
  }
  return (
    <LargePreview
      grid={rottenRows}
      unit={{ sprite: { name: "Rotten Tree", layers: [] } }}
    />
  );
}
