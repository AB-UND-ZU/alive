import { useState } from "react";
import { createCell, populateInventory } from "../bindings/creation";
import { Sprite } from "../engine/components/sprite";
import setupHarvest, { plantSeed } from "../engine/systems/harvest";
import setupMap from "../engine/systems/map";
import { assertHero, createAreaWorld } from "../testing/harness";
import { worldRows } from "./WorldDiagram";
import { ItemView, Pixels, PlainTable } from "./visuals";

export function farmingProgression() {
  const world = createAreaWorld("|♀|", { size: 16 });
  const hero = world.assertComponents(assertHero(world), [
    "INVENTORY",
    "POSITION",
  ]);
  const position = { x: 6, y: 6 };
  Object.assign(hero.POSITION, position);
  const soil = world.assertComponents(
    createCell(world, position, "soil", "visible").cell,
    ["FARMABLE", "SPRITE"]
  );
  const harvest = setupHarvest(world);
  const map = setupMap(world);
  const stages: { name: string; rows: Sprite[][] }[] = [];
  const capture = (name: string) => {
    map.onUpdate(0);
    hero.POSITION.x = position.x + 2;
    const rows = worldRows(world, {
      x: position.x,
      y: position.y - 1,
      width: 1,
      height: 2,
    });
    Object.assign(hero.POSITION, position);
    stages.push({ name, rows });
  };
  capture("Dry Soil");
  populateInventory(world, hero, [
    { consume: "bucket", material: "iron", element: "water", amount: 1 },
    { stackable: "grain", amount: 1 },
  ]);
  harvest.onUpdate(0);
  if (!soil.FARMABLE.watered)
    throw Error("The native water bucket did not water the soil");
  capture("Watered Soil");
  const grain = hero.INVENTORY.items
    .map((id) => world.assertByIdAndComponents(id, ["ITEM"]))
    .find((item) => item.ITEM.stackable === "grain");
  if (!grain) throw Error("The planting fixture has no grain");
  plantSeed(world, hero, grain);
  capture("Planted");
  let previousProgress = soil.FARMABLE.progress;
  let advances = 0;
  while (soil.FARMABLE.planted) {
    if (advances++ > 10) throw Error("The native crop did not finish growing");
    world.metadata.gameEntity.RENDERABLE.generation = Math.max(
      world.metadata.gameEntity.RENDERABLE.generation + 1,
      soil.FARMABLE.nextGeneration || 0
    );
    harvest.onUpdate(0);
    if (soil.FARMABLE.progress === previousProgress) continue;
    previousProgress = soil.FARMABLE.progress;
    capture(
      soil.FARMABLE.planted ? `Stage ${soil.FARMABLE.progress! + 1}` : "Wheat"
    );
  }
  return { stages, world, soil };
}

export function FarmingProgression() {
  const [{ stages }] = useState(farmingProgression);
  return (
    <div data-widget="farming-progression">
      <PlainTable
        headers={[
          "Growth",
          ...stages.map((stage) =>
            stage.name === "Wheat" ? (
              <ItemView item={{ stackable: "wheat" }} />
            ) : (
              stage.name
            )
          ),
        ]}
        rows={[
          [
            "Sprite",
            ...stages.map((stage) => (
              <Pixels rows={stage.rows} label={stage.name} />
            )),
          ],
        ]}
      />
    </div>
  );
}
