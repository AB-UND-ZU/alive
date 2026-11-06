import {
  advanceUntil,
  createAreaWorld,
  findInArea,
  step,
} from "../../testing/harness";
import { assertUnit } from "./helpers";
import { getClassData } from "../../game/balancing/classes";
import { getIdentifier } from "../../engine/utils";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { LIGHT } from "../../engine/components/light";
import { NPC } from "../../engine/components/npc";
import { POSITION } from "../../engine/components/position";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { STATS } from "../../engine/components/stats";
import { LevelName } from "../../engine/components/level";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import {
  defaultLight,
  roomLight,
  spawnLight,
} from "../../engine/systems/consume";
import { setIdentifier } from "../../engine/utils";
import { World } from "../../engine";
import { TypedEntity } from "../../engine/entities";

// ♀ hero, ÷ spawner
const area = `
|         |
|         |
|   ♀  ÷  |
|         |
|         |
`;

const spawn = findInArea(area, "♀");
const spawner = findInArea(area, "÷");

const getMobs = (world: World) =>
  world
    .getEntities([IDENTIFIABLE, NPC, POSITION, STATS])
    .filter((mob) => mob[IDENTIFIABLE].name === "room:mob");

// mirror how dungeon rooms activate their spawners
const activateSpawner = (world: World, types: string[]) => {
  const spawnerEntity = world
    .getEntities([BEHAVIOUR, POSITION])
    .find(
      (entity) =>
        entity[POSITION].x === spawner.x && entity[POSITION].y === spawner.y
    ) as TypedEntity<"BEHAVIOUR" | "POSITION">;
  spawnerEntity[BEHAVIOUR].patterns = [
    { name: "spawner", memory: { types: [...types], name: "room" } },
  ];
  setIdentifier(world, spawnerEntity, "room:spawner");
  return spawnerEntity;
};

describe("hero spawning", () => {
  it("creates the hero on the spawn cell with scout stats", () => {
    const world = createAreaWorld(area);
    const hero = assertUnit(world);
    const { stats } = getClassData("scout");

    expect(hero[POSITION]).toEqual(spawn);
    expect(hero[SPAWNABLE].classKey).toBe("scout");
    expect(hero[STATS]).toMatchObject({ ...stats, hp: stats.maxHp, mp: 0 });
  });

  it("marks the spawn point for respawning and the compass", () => {
    const world = createAreaWorld(area);
    const hero = assertUnit(world);
    const spawnEntity = getIdentifier(world, "spawn");

    expect(spawnEntity?.[POSITION]).toEqual(spawn);
    expect(hero[SPAWNABLE].position).toEqual(spawn);
  });

  it.each([
    ["LEVEL_MENU", spawnLight],
    ["LEVEL_TUTORIAL", roomLight],
    ["LEVEL_ISLAND", defaultLight],
  ] as [LevelName, typeof defaultLight][])(
    "opens the vision of a %s hero to the level light",
    (level, light) => {
      const world = createAreaWorld(area, { level });
      const hero = assertUnit(world);

      expect(hero[LIGHT].visibility).toBeLessThan(light.visibility);

      advanceUntil(
        world,
        () => hero[LIGHT].visibility === light.visibility,
        3000
      );

      expect(hero[LIGHT]).toEqual(light);
      expect(hero[SPAWNABLE].light).toEqual(light);
    }
  );

  it("keeps an inactive spawner from spawning mobs", () => {
    const world = createAreaWorld(area);

    step(world, 100);

    expect(getMobs(world)).toHaveLength(0);
  });

  it("spawns one mob after another from an activated spawner", () => {
    const world = createAreaWorld(area);
    activateSpawner(world, ["prism", "prism"]);

    advanceUntil(world, () => getMobs(world).length === 1);
    const [first] = getMobs(world);
    expect(first[POSITION]).toEqual(spawner);
    expect(first[NPC].type).toBe("prism");

    // next wave waits until the previous mob is gone
    step(world, 100);
    expect(getMobs(world)).toEqual([first]);

    first[STATS].hp = 0;
    advanceUntil(
      world,
      () => getMobs(world).length === 1 && getMobs(world)[0] !== first
    );
    getMobs(world)[0][STATS].hp = 0;

    // spawner disappears after its last wave
    advanceUntil(world, () => !getIdentifier(world, "room:spawner"));
    expect(getMobs(world)).toHaveLength(0);
  });
});
