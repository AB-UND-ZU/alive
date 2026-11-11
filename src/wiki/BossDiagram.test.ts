import { getIdentifierAndComponents } from "../engine/utils";
import { wormSide } from "../game/assets/sprites";
import { getParticles } from "../engine/systems/sequence";
import { bossDiagrams, createBossWorld } from "./BossDiagram";
import { getLimbs } from "../engine/systems/damage";
import { golem, golemBody, golemArm, rock2 } from "../game/assets/sprites";

test("Oak room includes its factory-created canopy fragments", () => {
  const rows = bossDiagrams("oakBoss");
  expect(rows).toHaveLength(13);
  expect(rows[0]).toHaveLength(21);
  const occupied = rows
    .flat()
    .filter((sprite) =>
      sprite.layers.some((layer) => layer.color !== "#000000")
    );
  expect(occupied.length).toBeGreaterThan(30);
});
test("Golem diagram includes all four native orbiting segments", () => {
  const rows = bossDiagrams("golem");
  expect(rows).toHaveLength(3);
  expect(rows[0]).toHaveLength(3);
  for (const [x, y] of [
    [1, 0],
    [1, 2],
    [0, 1],
    [2, 1],
  ])
    expect(
      rows[y][x].layers.some(
        (layer) => layer.color !== "#000000" && layer.char.trim()
      )
    ).toBe(true);
});
test("Worm diagram uses its generated cave with the mouth centered over the lake", () => {
  const { world, bounds, hasRoom } = createBossWorld("wormBoss");
  expect(hasRoom).toBe(true);
  expect(bounds.width).toBeGreaterThan(15);
  expect(bounds.height).toBeGreaterThan(10);
  const boss = world
    .getEntities(["NPC", "POSITION"])
    .find((entity) => entity.NPC.type === "wormBoss")!;
  const center = world
    .getEntities(["IDENTIFIABLE", "POSITION"])
    .find((entity) => entity.IDENTIFIABLE.name === "wormRoom")!;
  expect(boss.POSITION).toEqual(center.POSITION);
  expect(boss.TOOLTIP?.dialogs).toEqual([]);
  expect(
    getIdentifierAndComponents(world, "worm_bait", ["POSITION"])
  ).toBeUndefined();
  expect(
    world
      .getEntities(["SPRITE", "POSITION"])
      .some(
        (entity) =>
          entity.SPRITE === wormSide &&
          entity.POSITION.x === center.POSITION.x &&
          entity.POSITION.y === center.POSITION.y + 1
      )
  ).toBe(true);
  expect(
    world
      .getEntities(["TOOLTIP", "SEQUENCABLE"])
      .every((entity) => !entity.SEQUENCABLE.states.dialog)
  ).toBe(true);
  expect(getParticles(world, boss).length).toBeGreaterThan(1);
  const sign = getIdentifierAndComponents(world, "worm_sign", ["SEQUENCABLE"])!;
  expect(getParticles(world, sign)).toEqual([]);
});

test("Golem unfolds its factory stones into native body and arm fragments after damage", () => {
  const dormant = createBossWorld("golem").world;
  const root = dormant
    .getEntities(["NPC", "STATS", "SPRITE"])
    .find((entity) => entity.NPC.type === "golem")!;
  expect(root.STATS.hp).toBe(root.STATS.maxHp);
  expect(root.SPRITE).toEqual(rock2);
  expect(getLimbs(dormant, root)).toHaveLength(5);
  expect(
    getLimbs(dormant, root).every((limb) => limb.BELONGABLE.faction === "unit")
  ).toBe(true);

  const active = createBossWorld("golem", true).world;
  const unfolded = active
    .getEntities(["NPC", "STATS", "SPRITE", "POSITION"])
    .find((entity) => entity.NPC.type === "golem")!;
  expect(unfolded.STATS.hp).toBe(unfolded.STATS.maxHp - 1);
  expect(unfolded.SPRITE).toEqual({ ...golem, name: "" });
  const limbs = getLimbs(active, unfolded).filter((limb) => limb !== unfolded);
  expect(limbs).toHaveLength(4);
  for (const limb of limbs) {
    const vertical = ["up", "down"].includes(limb.ORIENTABLE.facing);
    expect(limb.SPRITE).toEqual(vertical ? golemBody : golemArm);
    expect(limb.BELONGABLE.faction).toBe("wild");
    expect(
      Math.abs(limb.POSITION.x - unfolded.POSITION.x) +
        Math.abs(limb.POSITION.y - unfolded.POSITION.y)
    ).toBe(1);
  }
  expect(active.getEntities(["CASTABLE"])).toEqual([unfolded]);
  expect(bossDiagrams("golem", true)).toHaveLength(3);
});
