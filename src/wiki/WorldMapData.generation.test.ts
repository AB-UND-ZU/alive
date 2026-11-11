import { prepareIslandMaps } from "./WorldMapData";
import { islandPreviewSeed } from "./presets";

jest.setTimeout(120000);

test("the seeded Island reference contains the full native map and revealed settlement interiors", () => {
  const sample = prepareIslandMaps();
  expect(sample.seed).toBe(islandPreviewSeed);
  expect(sample.overview).toHaveLength(15);
  expect(sample.overview.every((row) => row.length === 15)).toBe(true);
  for (const town of [sample.earth, sample.fire]) {
    expect(town.rows).toHaveLength(town.bounds.height);
    expect(town.rows.every((row) => row.length === town.bounds.width)).toBe(
      true
    );
    expect(town.legend.some((entry) => entry.unit)).toBe(true);
    expect(town.legend.some((entry) => entry.tabs.length)).toBe(true);
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
