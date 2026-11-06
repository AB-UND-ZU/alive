import { BEHAVIOUR, Pattern } from "../../engine/components/behaviour";
import { HOMING } from "../../engine/components/homing";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import { World } from "../../engine";
import { getIdentifier } from "../../engine/utils";
import { advanceUntil, holdMove } from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  getCreatures,
  teleport,
  toughen,
} from "./helpers";

const arena = `
|           |
|           |
|     I     |
|           |
|           |
|           |
|           |
|     ♀     |
`;

const getHomings = (world: World, type: string) =>
  world.getEntities([HOMING]).filter((homing) => homing[HOMING].type === type);

const setup = () => {
  const { world, hero } = createCreatureWorld(arena);
  toughen(hero);
  const ilex = getIdentifier(world, "ilex_elite") as TypedEntity<
    "BEHAVIOUR" | "STATS"
  >;
  const names = () =>
    ilex[BEHAVIOUR].patterns.map((pattern: Pattern) => pattern.name);
  return { world, hero, ilex, names };
};

const awaken = (world: World, names: () => string[]) => {
  holdMove(world, ["up"]);
  advanceUntil(world, () => !names().includes("passive"), 3000);
  holdMove(world, []);
  advanceUntil(world, () => !names().includes("vulnerable"), 5000);
};

describe("ilex elite", () => {
  it("rests as a harmless plant until the hero touches it", () => {
    const { world, hero, names } = setup();

    advanceTicks(world, 10);

    expect(names()).toContain("passive");
    expect(world.getEntities([HOMING])).toHaveLength(0);
    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
  });

  it("throws iron discs from its limbs that hurt the hero", () => {
    const { world, hero, names } = setup();
    awaken(world, names);

    advanceUntil(world, () => getHomings(world, "ironDisc").length > 0, 5000);
    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp, 10000);
  });

  it("follows up with gold discs flying outwards", () => {
    const { world, names } = setup();
    awaken(world, names);

    advanceUntil(world, () => getHomings(world, "goldDisc").length > 0, 15000);
  });

  it("does not sprout tulips while it is unhurt", () => {
    const { world, names } = setup();
    awaken(world, names);

    advanceTicks(world, 12);

    expect(getHomings(world, "ilexTulip")).toHaveLength(0);
    expect(getCreatures(world, "ilexTulip")).toHaveLength(0);
  });

  it("sprouts more tulips the more health it loses", () => {
    const { world, ilex, names } = setup();
    awaken(world, names);

    ilex[STATS].hp = Math.floor(ilex[STATS].maxHp * 0.8);
    advanceUntil(
      world,
      () => getCreatures(world, "ilexTulip").length > 0,
      5000
    );
    advanceTicks(world, 6);
    const few = getCreatures(world, "ilexTulip").length;

    ilex[STATS].hp = Math.floor(ilex[STATS].maxHp * 0.3);
    advanceUntil(
      world,
      () => getCreatures(world, "ilexTulip").length > few,
      5000
    );
  });

  it("lets its tulips send iron orbits around it", () => {
    const { world, ilex, names } = setup();
    awaken(world, names);

    ilex[STATS].hp = Math.floor(ilex[STATS].maxHp * 0.8);
    advanceUntil(
      world,
      () => getCreatures(world, "ilexTulip").length > 0,
      5000
    );
    advanceUntil(world, () => getHomings(world, "ironOrbit").length > 0, 5000);
  });

  it("holds its attacks while the hero is far away", () => {
    const { world, hero, names } = setup();
    awaken(world, names);
    teleport(world, hero, { x: 5, y: 25 });
    advanceTicks(world, 30);

    expect(world.getEntities([HOMING])).toHaveLength(0);
  });
});
