import { colors } from "../game/assets/colors";
import { preloadLevel } from "../engine/ecs";
import { assignBuilding, CellType, createCell } from "../bindings/creation";
import { createAreaWorld } from "../testing/harness";
import { WaveFunctionCollapse } from "../engine/wfc/wfc";
import { getDefinition } from "../engine/wfc/utils";
import { townTiles } from "../engine/wfc/town";
import { havenTiles } from "../engine/wfc/haven";
import { worldRows, WorldDiagram } from "./WorldDiagram";
import { PlainTable, Text, ItemView, Pixels } from "./visuals";
import { LargePreview } from "./LargePreview";
import { ReferenceText } from "./references";

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
            ...buildings.map(({ door }) => (
              <ItemView
                item={{ consume: "key", material: door!.LOCKABLE!.material }}
              />
            )),
          ],
        ]}
      />
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
