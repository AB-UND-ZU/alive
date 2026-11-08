import { useContext, useState } from "react";
import { Resource } from "../engine/components/harvestable";
import { Item } from "../engine/components/item";
import { unitDefinitions, UnitKey } from "../game/balancing/units";
import { getUnitSprite } from "../game/assets/utils";
import { displayName } from "./catalog";
import { plot } from "../game/assets/ui";
import { colors } from "../game/assets/colors";
import { cellSnapshot } from "./WorldPlants";
import { MentionStyle, ReferenceContext, ReferenceLink } from "./references";
import { ItemView, Pixels, Text } from "./visuals";

const cells: Record<string, { name: string; page: string; anchor?: string }> = {
  tree: { name: "Tree", page: "plants", anchor: "world-tree" },
  apple: { name: "Apple Tree", page: "plants", anchor: "world-tree" },
  palm: { name: "Palm", page: "plants", anchor: "world-palm" },
  banana: { name: "Banana Palm", page: "plants", anchor: "world-palm" },
  coconut: { name: "Coconut Palm", page: "plants", anchor: "world-palm" },
  leaves: { name: "Oak", page: "plants", anchor: "world-oak" },
  bush: { name: "Bush", page: "plants", anchor: "world-bush" },
  berry_one: { name: "Berry", page: "plants", anchor: "world-bush" },
  grass: { name: "Grass", page: "plants", anchor: "world-grass" },
  flower_one: { name: "Flower", page: "plants", anchor: "world-grass" },
  rotten_stem_right: { name: "Rotten Tree", page: "plants", anchor: "rotten" },
  stump: { name: "Tree Stump", page: "harvesting" },
  husk: { name: "Palm Husk", page: "harvesting" },
  desert_husk: { name: "Desert Palm Husk", page: "harvesting" },
  root: { name: "Oak Root", page: "harvesting" },
  post: { name: "Fence Post", page: "harvesting" },
  footing: { name: "Broken Palisade", page: "harvesting" },
  fence_hinge: { name: "Burnt Fence Door", page: "harvesting" },
  palisade_hinge: { name: "Broken Palisade Door", page: "harvesting" },
  plot: { name: plot.name, page: "building" },
  air: { name: "Air", page: "terrain" },
  snow: { name: "Snow", page: "terrain" },
  soil: { name: "Dry Soil", page: "farming" },
  soil_wet: { name: "Wet Soil", page: "farming" },
  boat: { name: "Boat", page: "building", anchor: "plan-boat" },
  water: { name: "Water", page: "terrain" },
  water_shallow: { name: "Shallow Water", page: "terrain" },
  water_deep: { name: "Deep Water", page: "terrain" },
  ice: { name: "Ice", page: "terrain" },
  sand: { name: "Sand", page: "terrain" },
  beach: { name: "Beach", page: "terrain" },
  path: { name: "Path", page: "terrain" },
  rubble: { name: "Rubble", page: "terrain" },
  mountain: { name: "Mountain", page: "terrain" },
  iron: { name: "Iron", page: "harvesting" },
  gold: { name: "Gold", page: "harvesting" },
};

export function CellReference({ cell }: { cell: string }) {
  const { link, features } = useContext(ReferenceContext);
  const [snapshot] = useState(() =>
    cell === "plot" ? { sprites: [plot] } : cellSnapshot(cell)
  );
  const data = cells[cell];
  const content = (
    <MentionStyle preserveColor>
      <span className="Item" style={{ gap: 0 }}>
        <Text
          color={colors.grey}
          prefix={
            <Pixels
              rows={snapshot.sprites.map((sprite) => [sprite])}
              label={data.name}
            />
          }
        >
          {data.name}
        </Text>
      </span>
    </MentionStyle>
  );
  const reference = features?.[data.page];
  return (
    <>
      {reference
        ? link(
            reference.href + (data.anchor ? `#${data.anchor}` : ""),
            content,
            true
          )
        : content}
    </>
  );
}

export function HarvestTarget({ resource }: { resource: Resource }) {
  const units = (Object.keys(unitDefinitions) as UnitKey[]).filter(
    (key) => unitDefinitions[key].harvestable === resource && key !== "rotten"
  );
  if (units.length)
    return (
      <div className="CatalogLines">
        {units.map((unit) => {
          const name = displayName(
            (unitDefinitions[unit].sprite.name || unit).replace(/_/g, " ")
          );
          return (
            <div key={unit}>
              <ReferenceLink name={"unit:" + unit} sprite>
                <span className="Item" style={{ gap: 0 }}>
                  <Text
                    color={colors.grey}
                    prefix={
                      <Pixels rows={[[getUnitSprite(unit)]]} label={name} />
                    }
                  >
                    {name}
                  </Text>
                </span>
              </ReferenceLink>
            </div>
          );
        })}
      </div>
    );
  if (
    [
      "flower",
      "berry",
      "spore",
      "leaf",
      "sapling",
      "thorn",
      "banana",
      "coconut",
    ].includes(resource)
  )
    return <ItemView item={{ stackable: resource as Item["stackable"] }} />;
  if (resource === "hinge")
    return (
      <div className="CatalogLines">
        <div>
          <CellReference cell="fence_hinge" />
        </div>
        <div>
          <CellReference cell="palisade_hinge" />
        </div>
      </div>
    );
  return (
    <CellReference
      cell={
        resource === "oak"
          ? "leaves"
          : resource === "rotten"
          ? "rotten_stem_right"
          : resource
      }
    />
  );
}
