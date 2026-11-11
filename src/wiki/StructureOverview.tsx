import {
  mapHouse,
  mapFortress,
  boat,
  jetty,
  table,
  campfire,
  bedItem,
  bench,
} from "../game/assets/sprites";
import { displayName } from "./catalog";
import { cellSnapshot } from "./WorldPlants";
import { Item } from "../engine/components/item";
import { colors } from "../game/assets/colors";
import { preloadLevel } from "../engine/ecs";
import { assignBuilding, CellType, createCell } from "../bindings/creation";
import { createAreaWorld } from "../testing/harness";
import { WaveFunctionCollapse } from "../engine/wfc/wfc";
import { getDefinition } from "../engine/wfc/utils";
import { townTiles } from "../engine/wfc/town";
import { havenTiles } from "../engine/wfc/haven";
import { worldRows, WorldDiagram } from "./WorldDiagram";
import { PlainTable, Text, ItemView, Pixels, Frame, Heading } from "./visuals";
import { LargePreview } from "./LargePreview";
import { ReferenceText, ReferenceLink } from "./references";

export function createStructureSpecimen(fort: boolean) {
  const width = 11,
    height = 9;
  const wfc = new WaveFunctionCollapse(getDefinition("air"));
  const forced: [number, number, string][] = [[5, 6, "doorCenter"]];
  for (let x = 0; x < width; x++)
    forced.push([x, 0, "air"], [x, height - 1, "air"]);
  for (let y = 1; y < height - 1; y++)
    forced.push([0, y, "air"], [width - 1, y, "air"]);
  const wave = wfc.generate(width, height, forced);
  if (!wave) throw Error("Native house generation failed");
  const world = createAreaWorld("|♀|", { size: 32 });
  const tiles = fort ? havenTiles : townTiles;
  for (let x = 0; x < width; x++)
    for (let y = 0; y < height; y++) {
      const cell = tiles[wfc.tileNames[wave.chosen[x][y]]];
      if (cell)
        createCell(world, { x: x + 2, y: y + 2 }, cell as CellType, "visible");
    }
  preloadLevel(world);
  const building = assignBuilding(world, { x: 7, y: 7 });
  const positions = building.fragments.map((entity) => entity.POSITION!);
  if (!positions.length) throw Error("Native house has no fragments");
  const bounds = {
    x: Math.min(...positions.map((p) => p.x)),
    y: Math.min(...positions.map((p) => p.y)),
    width:
      Math.max(...positions.map((p) => p.x)) -
      Math.min(...positions.map((p) => p.x)) +
      1,
    height:
      Math.max(...positions.map((p) => p.y)) -
      Math.min(...positions.map((p) => p.y)) +
      1,
  };
  return {
    world,
    ...building,
    bounds,
    outside: worldRows(world, bounds),
    inside: worldRows(world, { ...bounds, inside: true }),
  };
}
export function createStructureDevices() {
  const world = createAreaWorld("|♀|", { size: 32 });
  const portal = createCell(world, { x: 3, y: 2 }, "portal", "visible").cell;
  const lever = createCell(world, { x: 5, y: 2 }, "lever", "visible").cell;
  return { world, portal, lever };
}
let devices: ReturnType<typeof createStructureDevices> | undefined;
let buildings: ReturnType<typeof createStructureSpecimen>[] | undefined;
export function StructureOverview() {
  buildings ||= [createStructureSpecimen(false), createStructureSpecimen(true)];
  const { portal, lever } = (devices ||= createStructureDevices());
  return (
    <>
      <Frame
        title="Contents"
        label="Structures contents"
        color={colors.green}
        titleBackground={colors.green}
        compact
      >
        {Object.entries({
          "Wood House": mapHouse,
          "Desert Fort": mapFortress,
          Doors: buildings[0].door!.SPRITE!,
          Boat: boat,
          Jetty: jetty,
          Furniture: table,
          Fireplace: campfire,
          Workstations: bench,
          Portal: portal.SPRITE!,
          Lever: lever.SPRITE!,
        }).map(([name, sprite]) => (
          <div key={name}>
            <ReferenceLink name={name} sprite>
              <Text prefix={<Pixels rows={[[sprite]]} />}>{name}</Text>
            </ReferenceLink>
          </div>
        ))}
      </Frame>
      <PlainTable
        headers={["View", "Wood House", "Desert Fort"]}
        rows={[
          [
            "Outside",
            ...buildings.map((building, i) => (
              <span id={i ? "desert-fort" : "wood-house"}>
                <WorldDiagram
                  rows={building.outside}
                  label={(i ? "Desert Fort" : "Wood House") + " exterior"}
                />
              </span>
            )),
          ],
          [
            "Inside",
            ...buildings.map((building, i) => (
              <WorldDiagram
                rows={building.inside}
                label={(i ? "Desert Fort" : "Wood House") + " interior"}
              />
            )),
          ],
          [
            "Where",
            <>
              <ReferenceText text="Earth Town" />
              <br />
              <ReferenceText text="Nomad" />
            </>,
            <ReferenceText text="Fire Haven" />,
          ],
          [
            "Access",
            ...buildings.map(({ door }) => (
              <Text
                color={colors.grey}
                prefix={
                  <Pixels rows={[[door!.SPRITE!]]} label={door!.SPRITE!.name} />
                }
              >
                {door!.SPRITE!.name}
              </Text>
            )),
          ],
          [
            "Key",
            ...buildings.map(({ door }) =>
              door!.LOCKABLE!.material === "wood" ? (
                <Text>Not needed</Text>
              ) : (
                <ItemView
                  item={{ consume: "key", material: door!.LOCKABLE!.material }}
                />
              )
            ),
          ],
        ]}
      />
      <StructureDetails />
      <PlainTable
        headers={["Structure", "Sprite", "Interaction"]}
        rows={[
          [
            <span id="portal">
              <Text
                color={colors.grey}
                prefix={<Pixels rows={[[portal.SPRITE!]]} label="Portal" />}
              >
                Portal
              </Text>
            </span>,
            <LargePreview unit={{ sprite: portal.SPRITE! }} />,
            <ReferenceText text="Open the world Map and select a connected Level. Portals cannot be attacked." />,
          ],
          [
            <span id="lever">
              <Text
                color={colors.grey}
                prefix={<Pixels rows={[[lever.SPRITE!]]} label="Lever" />}
              >
                Lever
              </Text>
            </span>,
            <LargePreview unit={{ sprite: lever.SPRITE! }} />,
            <Text>
              Move into it to activate its switch. Levers cannot be attacked.
            </Text>,
          ],
        ]}
      />
    </>
  );
}

const doorTypes = [
  "wood_door",
  "iron_door",
  "gold_door",
  "earth_door",
] as const;
const structureGroups = [
  {
    title: "Boat",
    id: "boat",
    cells: ["boat"],
    description: "Build and board a boat to cross water.",
  },
  {
    title: "Jetty",
    id: "jetty",
    cells: ["jetty_vertical"],
    description: "Walk along the jetty above water.",
  },
  {
    title: "Furniture",
    id: "furniture",
    cells: ["bed_left", "chair_left", "chair_right", "table"],
    description: "Furniture decorates the inside of buildings.",
  },
  {
    title: "Fireplace",
    id: "fireplace",
    cells: ["fireplace"],
    description: "Fire lights its surroundings and can burn nearby units.",
  },
  {
    title: "Workstations",
    id: "workstations",
    cells: ["bench", "anvil", "kettle"],
    description:
      "Interact when the prompt appears. Some workshops unlock through Quests.",
  },
];
let details:
  | {
      doors: ReturnType<typeof createCell>["cell"][];
      groups: {
        title: string;
        id: string;
        description: string;
        specimens: { cell: string; sample: ReturnType<typeof cellSnapshot> }[];
      }[];
    }
  | undefined;
function StructureDetails() {
  details ||= {
    doors: doorTypes.map(
      (cell) =>
        createCell(
          createAreaWorld("|♀|", { size: 16 }),
          { x: 6, y: 6 },
          cell,
          "visible"
        ).cell
    ),
    groups: structureGroups.map((group) => ({
      ...group,
      specimens: group.cells.map((cell) => ({
        cell,
        sample: cellSnapshot(cell),
      })),
    })),
  };
  return (
    <>
      <Heading level={2} text="Doors" id="doors" />
      <PlainTable
        headers={[
          "Name",
          ...details.doors.map((door) => (
            <ReferenceLink name="doors" sprite>
              <Text prefix={<Pixels rows={[[door.SPRITE!]]} />}>
                {`${door.LOCKABLE!.element || door.LOCKABLE!.material} door`
                  .split(" ")
                  .map(displayName)
                  .join(" ")}
              </Text>
            </ReferenceLink>
          )),
        ]}
        rows={[
          [
            "Preview",
            ...details.doors.map((door) => (
              <LargePreview unit={{ sprite: door.SPRITE! }} />
            )),
          ],
          [
            "Key",
            ...details.doors.map((door) =>
              door.LOCKABLE!.material === "wood" ? (
                <Text>Not needed</Text>
              ) : (
                <ItemView
                  item={
                    {
                      consume: "key",
                      material: door.LOCKABLE!.material,
                      element: door.LOCKABLE!.element,
                    } as Partial<Item>
                  }
                />
              )
            ),
          ],
        ]}
      />
      {details.groups.map((group) => (
        <section key={group.id}>
          <Heading level={2} text={group.title} id={group.id} />
          <PlainTable
            headers={["Structure", "Preview", "Interaction"]}
            rows={group.specimens.map(({ cell, sample }) => {
              const title =
                cell === "jetty_vertical"
                  ? "Jetty"
                  : cell === "bed_left"
                  ? "Bed"
                  : displayName(cell.replace(/_/g, " "));
              const icon = (
                <Text
                  prefix={
                    <Pixels
                      rows={
                        cell === "bed_left"
                          ? [[bedItem]]
                          : [[sample.sprites[0]]]
                      }
                    />
                  }
                >
                  {title}
                </Text>
              );
              return [
                <ReferenceLink
                  name={
                    cell === "bench"
                      ? "crafting"
                      : cell === "anvil"
                      ? "forging"
                      : cell === "kettle"
                      ? "brewing"
                      : group.title
                  }
                  sprite
                >
                  {icon}
                </ReferenceLink>,
                <LargePreview grid={sample.grid} />,
                <ReferenceText
                  text={
                    cell === "bench"
                      ? "Crafting"
                      : cell === "anvil"
                      ? "Forging"
                      : cell === "kettle"
                      ? "Brewing"
                      : group.description
                  }
                />,
              ];
            })}
          />
        </section>
      ))}
    </>
  );
}
