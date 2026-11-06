import { BEHAVIOUR, Pattern } from "../../engine/components/behaviour";
import { LOCKABLE } from "../../engine/components/lockable";
import { POSITION } from "../../engine/components/position";
import { TOOLTIP } from "../../engine/components/tooltip";
import { isDead } from "../../engine/systems/damage";
import { rage } from "../../game/assets/ui";
import {
  advanceUntil,
  findEntityAt,
  holdMove,
  trigger,
  walk,
} from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  getCreature,
  teleport,
  toughen,
} from "./helpers";

const gate = `
|   ♀   |
|       |
|±±±=±±±|
|   G   |
|       |
`;

const setup = (area = gate) => {
  const { world, hero } = createCreatureWorld(area, { G: "earthGuard" });
  toughen(hero);
  const guard = getCreature(world, "earthGuard");
  return { world, hero, guard };
};

const openGate = (world: ReturnType<typeof setup>["world"]) => {
  const door = findEntityAt(world, { x: 3, y: 2 }, [LOCKABLE])!;
  walk(world, "down");
  trigger(world, "interact");
  advanceUntil(world, () => door[LOCKABLE].locked === false, 2000);
};

describe("gate guard", () => {
  it("keeps standing behind a locked gate", () => {
    const { world, guard } = setup();
    walk(world, "down");

    advanceTicks(world, 6);

    expect(guard[POSITION]).toEqual({ x: 3, y: 3 });
  });

  it("steps aside once the hero opens the gate", () => {
    const { world, guard } = setup();

    openGate(world);
    advanceTicks(world, 4);

    expect(guard[POSITION].y).toBe(3);
    expect(Math.abs(guard[POSITION].x - 3)).toBe(2);
  });

  it("returns in front of the gate after the hero leaves", () => {
    const { world, hero, guard } = setup();
    openGate(world);
    advanceUntil(world, () => guard[POSITION].x !== 3, 3000);

    teleport(world, hero, { x: 3, y: 30 });
    advanceTicks(world, 4);

    expect(guard[POSITION]).toEqual({ x: 3, y: 3 });
  });

  it("makes way for a hero leaving the town from inside", () => {
    const { world, guard } = setup(`
|       |
|±±±=±±±|
| ♀ G   |
|       |
`);

    advanceTicks(world, 4);

    expect(guard[POSITION].y).toBe(2);
    expect(guard[POSITION].x).toBeGreaterThan(3);
  });

  it("stops guarding without a gate next to it", () => {
    const { world, guard } = setup(`
|   ♀   |
|       |
|   G   |
`);

    advanceTicks(world, 4);

    expect(
      guard[BEHAVIOUR].patterns.map((pattern: Pattern) => pattern.name)
    ).not.toContain("guard");
    expect(guard[POSITION]).toEqual({ x: 3, y: 2 });
  });

  it("attacks wild creatures entering its watched area", () => {
    const { world, guard } = setup(`
|♀         |
|          |
|  G    0  |
|          |
`);
    guard[BEHAVIOUR].patterns.unshift({
      name: "watch",
      memory: {
        origin: { ...guard[POSITION] },
        topLeft: { x: 0, y: 1 },
        bottomRight: { x: 9, y: 3 },
      },
    });
    const eye = getCreature(world, "eye");

    advanceUntil(world, () => guard[TOOLTIP].idle === rage, 3000);
    advanceUntil(world, () => isDead(world, eye), 15000);
  });

  it("calls off the chase and walks back once the intruder leaves", () => {
    const { world, guard } = setup(`
|♀         |
|          |
|  G    0  |
|          |
`);
    const origin = { ...guard[POSITION] };
    guard[BEHAVIOUR].patterns.unshift({
      name: "watch",
      memory: {
        origin,
        topLeft: { x: 0, y: 1 },
        bottomRight: { x: 9, y: 3 },
      },
    });
    const eye = getCreature(world, "eye");
    advanceUntil(world, () => guard[TOOLTIP].idle === rage, 3000);

    teleport(world, eye, { x: 20, y: 30 });
    advanceUntil(world, () => guard[TOOLTIP].idle !== rage, 2000);
    advanceUntil(
      world,
      () => guard[POSITION].x === origin.x && guard[POSITION].y === origin.y,
      5000
    );

    expect(
      guard[BEHAVIOUR].patterns.map((pattern: Pattern) => pattern.name)
    ).not.toContain("kill");
  });

  it("ignores the hero inside its watched area", () => {
    const { world, guard } = setup(`
|          |
| ♀G       |
|          |
`);
    guard[BEHAVIOUR].patterns.unshift({
      name: "watch",
      memory: {
        origin: { ...guard[POSITION] },
        topLeft: { x: 0, y: 0 },
        bottomRight: { x: 9, y: 2 },
      },
    });
    holdMove(world, []);

    advanceTicks(world, 4);

    expect(guard[TOOLTIP].idle).not.toBe(rage);
    expect(
      guard[BEHAVIOUR].patterns.map((pattern: Pattern) => pattern.name)
    ).not.toContain("kill");
  });

  describe("haven gate keeper", () => {
    const setupKeeper = (area: string) => {
      const { world, hero, guard } = setup(area);
      guard[BEHAVIOUR].patterns = [
        {
          name: "gate",
          memory: {
            origin: { x: 3, y: 3 },
            target: { x: 6, y: 4 },
            gate: { x: 3, y: 2 },
            inn: { x: 3, y: 7 },
            radius: 4,
          },
        },
      ];
      return { world, hero, guard };
    };

    it("walks to its waiting spot when the hero opens the gate", () => {
      const { world, guard } = setupKeeper(gate);

      openGate(world);
      advanceUntil(
        world,
        () => guard[POSITION].x === 6 && guard[POSITION].y === 4,
        5000
      );
    });

    it("walks back to block the gate after the hero leaves", () => {
      const { world, hero, guard } = setupKeeper(gate);
      openGate(world);
      advanceUntil(world, () => guard[POSITION].x === 6, 5000);

      teleport(world, hero, { x: 3, y: 30 });
      advanceUntil(
        world,
        () => guard[POSITION].x === 3 && guard[POSITION].y === 3,
        5000
      );
    });

    it("stays at the locked gate while the hero waits outside", () => {
      const { world, guard } = setupKeeper(gate);
      walk(world, "down");

      advanceTicks(world, 6);

      expect(guard[POSITION]).toEqual({ x: 3, y: 3 });
    });

    it("gives up a gate without all its places", () => {
      const { world, guard } = setup();
      guard[BEHAVIOUR].patterns = [
        { name: "gate", memory: { gate: { x: 3, y: 2 } } },
      ];

      advanceTicks(world, 2);

      expect(guard[BEHAVIOUR].patterns).toHaveLength(0);
    });
  });
});
