import { World } from "../../engine";
import { ATTACKABLE } from "../../engine/components/attackable";
import { BELONGABLE } from "../../engine/components/belongable";
import { BEHAVIOUR, Pattern } from "../../engine/components/behaviour";
import { POSITION } from "../../engine/components/position";
import { HOMING } from "../../engine/components/homing";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { TypedEntity } from "../../engine/entities";
import { getSequence } from "../../engine/systems/sequence";
import { getIdentifier } from "../../engine/utils";
import { sleep1, sleep2 } from "../../game/assets/ui";
import { advanceUntil, holdMove } from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  getCreatures,
  teleport,
  toughen,
} from "./helpers";

const arena = `
|                     |
|   ô ô         ô ô   |
|                     |
|          O          |
|                     |
|                     |
|   ô ô         ô ô   |
|                     |
|                     |
|          ♀          |
|                     |
`;

const getHomings = (world: World, type?: string) =>
  world
    .getEntities([HOMING])
    .filter((homing) => !type || homing[HOMING].type === type);

const setup = () => {
  const { world, hero } = createCreatureWorld(arena);
  toughen(hero);
  const oak = getIdentifier(world, "oak_boss") as TypedEntity<
    "BEHAVIOUR" | "STATS" | "TOOLTIP"
  >;
  const room = getIdentifier(world, "oakRoom") as TypedEntity<"POSITION">;
  teleport(world, room, { x: 10, y: 8 });
  const phases = () =>
    oak[BEHAVIOUR].patterns
      .filter((pattern: Pattern) => pattern.name === "oak_boss")
      .map((pattern: Pattern) => pattern.memory.phase);
  const step = () => getSequence(world, room, "npc")?.args.step;
  return { world, hero, oak, room, phases, step };
};

const awaken = (world: World) => {
  const oak = getIdentifier(world, "oak_boss") as TypedEntity<"BELONGABLE">;
  holdMove(world, ["up"]);
  advanceUntil(world, () => oak[BELONGABLE].faction === "wild", 3000);
  holdMove(world, []);
};

describe("oak boss", () => {
  it("sleeps until the hero touches it", () => {
    const { world, oak, phases } = setup();

    advanceTicks(world, 6);

    expect([sleep1, sleep2]).toContain(oak[TOOLTIP].idle);
    expect(phases()).toContain(0);
    expect(getCreatures(world, "oakTower")).toHaveLength(0);
  });

  it("wakes up, starts the fight and raises two towers", () => {
    const { world, step } = setup();

    awaken(world);
    advanceUntil(world, () => step() === "fight", 2000);

    advanceUntil(
      world,
      () => getCreatures(world, "oakTower").length === 2,
      20000
    );
  });

  it("hides behind invincibility while it hurls discs", () => {
    const { world, oak } = setup();
    awaken(world);

    advanceUntil(world, () => ATTACKABLE in oak, 20000);
    advanceUntil(world, () => !(ATTACKABLE in oak), 60000);
    advanceUntil(world, () => getHomings(world, "goldDisc").length > 0, 10000);
    advanceUntil(world, () => ATTACKABLE in oak, 10000);
  });

  it("calls lilies from its bushes as it loses health", () => {
    const { world, oak } = setup();
    awaken(world);
    advanceUntil(
      world,
      () => getCreatures(world, "oakTower").length === 2,
      20000
    );

    oak[STATS].hp = Math.floor(oak[STATS].maxHp * 0.6);
    advanceUntil(world, () => getCreatures(world, "oakLily").length > 0, 60000);
    const [lily] = getCreatures(world, "oakLily");
    const start = { ...lily[POSITION] };
    advanceUntil(
      world,
      () => lily[POSITION].x !== start.x || lily[POSITION].y !== start.y,
      5000
    );
  });

  it("pauses the fight while the hero is outside the room", () => {
    const { world, hero, phases, step } = setup();
    awaken(world);
    advanceUntil(world, () => step() === "fight", 2000);

    teleport(world, hero, { x: 10, y: 30 });
    advanceUntil(world, () => step() === "wait", 2000);
    const paused = phases();
    advanceTicks(world, 20);

    expect(phases()).toEqual(paused);
  });

  it("unleashes a final attack on the hero at low health", () => {
    const { world, hero, oak, phases } = setup();
    awaken(world);
    advanceUntil(
      world,
      () => getCreatures(world, "oakTower").length === 2,
      20000
    );
    const hp = hero[STATS].hp;

    oak[STATS].hp = Math.floor(oak[STATS].maxHp * 0.2);
    advanceUntil(world, () => phases().includes(41), 2000);
    advanceUntil(world, () => phases().includes(57), 30000);
    const before = Math.min(hp, hero[STATS].hp);
    advanceUntil(world, () => hero[STATS].hp < before, 10000);
  });
});
