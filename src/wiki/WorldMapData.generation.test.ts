import { prepareIslandMaps } from "./WorldMapData";
import { islandPreviewSeed } from "./presets";
import { getUnitSprite } from "../game/assets/utils";
import { UnitKey } from "../game/balancing/units";

jest.setTimeout(120000);

test("the seeded town references reveal interiors and complete NPC portraits with meaningful interactions", () => {
  const sample = prepareIslandMaps();
  expect(sample.seed).toBe(islandPreviewSeed);
  for (const town of [sample.earth, sample.fire]) {
    expect(town.rows).toHaveLength(town.bounds.height);
    expect(town.rows.every((row) => row.length === town.bounds.width)).toBe(
      true
    );
    expect(town.legend.some((entry) => entry.unit)).toBe(true);
    expect(
      town.legend.some((entry) =>
        ["Bench", "Anvil", "Kettle"].includes(entry.name)
      )
    ).toBe(true);
    for (const entry of town.legend.filter((entry) => entry.unit))
      expect(sample.sprites[entry.sprite].layers).toEqual(
        getUnitSprite(entry.unit as UnitKey).layers
      );
    for (const entry of town.legend.filter((entry) => !entry.unit))
      expect(["Bench", "Anvil", "Kettle"]).toContain(entry.name);
  }
  expect(sample.earth.legend.map((entry) => entry.unit)).toContain(
    "earthChief"
  );
  expect(sample.fire.legend.map((entry) => entry.unit)).toContain("fireChief");
  expect(sample.fire.legend.map((entry) => entry.unit)).toContain(
    "fireJettyGuard"
  );
  if (process.env.WIKI_WORLD_SNAPSHOT === "true")
    require("node:fs").writeFileSync(
      "src/wiki/island.json",
      JSON.stringify(sample) + "\n"
    );
  expect(sample).toEqual(
    JSON.parse(require("node:fs").readFileSync("src/wiki/island.json", "utf8"))
  );
});
