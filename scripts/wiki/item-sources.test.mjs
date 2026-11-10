import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  extractNpcItemSources,
  extractPatternItemSources,
} from "./item-sources.mjs";

test("NPC acquisition metadata reads rewards and choices, never request prices or description icons", () => {
  const result =
    extractNpcItemSources(`export const earthChiefNpc = () => createPopup(world,entity,{
    deals:[{item:{accessory:"compass",material:"iron",amount:1},prices:[{stackable:"wood",amount:9}]}],
    choices:[{tool:"axe",material:"wood",amount:1}],
    lines:[createItemName({stackable:"schema"})]
  });`);
  assert.deepEqual(
    result.items.map(({ npc, item }) => ({ npc, item })),
    [
      {
        npc: "earthChief",
        item: { accessory: "compass", material: "iron", amount: 1 },
      },
      { npc: "earthChief", item: { tool: "axe", material: "wood", amount: 1 } },
    ]
  );
});
test("unresolved reward rules are reported rather than guessed", () => {
  const result = extractNpcItemSources(
    `export const fireChiefNpc=()=>({choices:[{weapon:"sword",material:chooseMaterial()}]});`
  );
  assert.equal(result.items.length, 0);
  assert.equal(result.unresolved[0].expression, "chooseMaterial()");
});
test("all current literal NPC reward choices resolve", async () => {
  const result = extractNpcItemSources(
    await readFile(
      new URL("../../src/game/assets/npcs.ts", import.meta.url),
      "utf8"
    )
  );
  assert.equal(result.unresolved.length, 0);
  assert.ok(
    result.items.some(
      ({ npc, item }) => npc === "fireChief" && item.tool === "pickaxe"
    )
  );
  assert.ok(
    result.items.some(
      ({ npc, item }) => npc === "fireNomad" && item.stackable === "schema"
    )
  );
});

test("natural sources use the item's actual owning AI pattern", () => {
  const result = extractPatternItemSources(`if (pattern.name === "chick") {
    const eggData = {stackable:"egg", amount:1, bound:false} as Item;
  }`);
  assert.deepEqual(
    result.map(({ unit, item }) => ({ unit, item })),
    [{ unit: "chick", item: { stackable: "egg", amount: 1, bound: false } }]
  );
});

test("committed acquisition metadata matches native rewards and patterns", async () => {
  const expected = extractNpcItemSources(
    await readFile("src/game/assets/npcs.ts", "utf8")
  );
  expected.natural = extractPatternItemSources(
    await readFile("src/engine/systems/ai.ts", "utf8")
  );
  assert.deepEqual(
    JSON.parse(await readFile("src/wiki/item-sources.json", "utf8")),
    expected,
    "Run npm run wiki:sources after changing native rewards or item-producing patterns"
  );
});
