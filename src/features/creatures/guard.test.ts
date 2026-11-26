import { EQUIPPABLE } from "../../engine/components/equippable";
import { saveAndLoad } from "../../testing/saves";
import { BELONGABLE } from "../../engine/components/belongable";
import { ITEM } from "../../engine/components/item";
import { STATS } from "../../engine/components/stats";
import { BEHAVIOUR, Pattern } from "../../engine/components/behaviour";
import { LOCKABLE } from "../../engine/components/lockable";
import { ORIENTABLE } from "../../engine/components/orientable";
import { shootArrow } from "../../engine/systems/ballistics";
import { castAs } from "../spells/helpers";
import { POSITION } from "../../engine/components/position";
import { TOOLTIP } from "../../engine/components/tooltip";
import { isDead } from "../../engine/systems/damage";
import { rage } from "../../game/assets/ui";
import {
  advanceUntil,
  countItems,
  findEntityAt,
  giveItems,
  holdMove,
  trigger,
  walk,
} from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  getCreature,
  giveSword,
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

it("arms the Water Guard to defend the igloo and replenish HP", () => {
  const { world } = createCreatureWorld(
    `|♀          |
|██████████ |
|█ G   P  █ |
|██████████ |`,
    { G: "waterGuard", P: "diamondPrism" }
  );
  const guard = getCreature(world, "waterGuard");
  const prism = getCreature(world, "diamondPrism");
  const equipment = world.assertComponents(guard, [EQUIPPABLE])[EQUIPPABLE];
  expect(
    world.assertByIdAndComponents(equipment.weapon!, [ITEM])[ITEM]
  ).toMatchObject({ weapon: "sword", material: "gold" });
  expect(
    world.assertByIdAndComponents(equipment.offhand!, [ITEM])[ITEM]
  ).toMatchObject({ offhand: "shield", material: "diamond" });
  const potion = { consume: "potion", stat: "hp", material: "gold" } as const;
  teleport(world, prism, { x: 20, y: 20 });
  guard[STATS].hp = 10;
  advanceUntil(world, () => guard[STATS].hp > 10, 30000);
  expect(countItems(world, guard, potion)).toBe(Infinity);
  guard[BEHAVIOUR].patterns.unshift({
    name: "watch",
    memory: {
      origin: { ...guard[POSITION] },
      center: { x: 6, y: 2 },
      radius: 9,
      ratio: 1,
    },
  });
  teleport(world, prism, { x: guard[POSITION].x + 1, y: guard[POSITION].y });
  advanceUntil(world, () => prism[STATS].hp < prism[STATS].maxHp, 5000);
});

describe("village defenders", () => {
  it.each(["earthChief", "fireChief", "waterChief", "fireGateGuard"] as const)(
    "%s chases its attacker, kills it and returns to the cell where it was hit",
    (type) => {
      const { world, hero } = createCreatureWorld("|  ♀G          |", {
        G: type,
      });
      const defender = getCreature(world, type);
      const origin = { ...defender[POSITION] };
      world.assertComponents(hero, [BELONGABLE])[BELONGABLE].faction =
        "hostile";
      giveSword(world, hero);
      holdMove(world, ["right"]);
      advanceUntil(world, () => defender[STATS].hp < defender[STATS].maxHp);
      holdMove(world, []);
      teleport(world, hero, { x: origin.x + 4, y: origin.y });
      hero[STATS].hp = 1;

      advanceUntil(world, () => defender[POSITION].x === origin.x + 3);
      advanceUntil(world, () => isDead(world, hero));
      advanceUntil(world, () => defender[POSITION].x === origin.x);
      expect(defender[POSITION]).toEqual(origin);
    }
  );

  it.each(["arrow", "wave"])(
    "pursues the %s shooter before resuming gate duty",
    (attack) => {
      const { world, hero } = createCreatureWorld(
        `
|   ♀        |
|            |
|±±±=±±±±±±±±|
|   G   B    |
|            |
`,
        { G: "earthGuard", B: "banditRogue" }
      );
      const guard = getCreature(world, "earthGuard");
      const archer = getCreature(world, "banditRogue");
      toughen(hero);
      archer[BEHAVIOUR].patterns = [];
      advanceTicks(world, 2);
      const origin = { ...guard[POSITION] };
      if (attack === "arrow") {
        giveItems(world, archer, [{ stackable: "arrow", amount: 1 }]);
        archer[ORIENTABLE].facing = "left";
        const bow = world.assertByIdAndComponents(archer[EQUIPPABLE]!.skill, [
          ITEM,
        ]);
        shootArrow(world, archer, bow);
      } else {
        castAs(world, archer, { spell: "wave", material: "wood" }, "left");
      }
      advanceUntil(world, () => guard[STATS].hp < guard[STATS].maxHp);
      advanceUntil(world, () => guard[POSITION].x > origin.x);
      advanceUntil(world, () => isDead(world, archer));
      advanceUntil(world, () => guard[POSITION].x === origin.x);
      expect(guard[POSITION]).toEqual(origin);
      openGate(world);
      advanceUntil(world, () => Math.abs(guard[POSITION].x - origin.x) === 2);
    }
  );

  it("selects the first nearby hostile after damage, even when a different unit shoots", () => {
    const { world } = createCreatureWorld("|♀ E    G  B |", {
      E: "eye",
      G: "waterGuard",
      B: "banditRogue",
    });
    const first = getCreature(world, "eye");
    const guard = getCreature(world, "waterGuard");
    const shooter = getCreature(world, "banditRogue");
    first[BEHAVIOUR].patterns = [];
    shooter[BEHAVIOUR].patterns = [];
    advanceTicks(world, 3);
    const origin = { ...guard[POSITION] };
    expect(origin.x).toBe(7);
    expect(first[STATS].hp).toBe(first[STATS].maxHp);
    giveItems(world, shooter, [{ stackable: "arrow", amount: 1 }]);
    shooter[ORIENTABLE].facing = "left";
    shootArrow(
      world,
      shooter,
      world.assertByIdAndComponents(shooter[EQUIPPABLE]!.skill, [ITEM])
    );
    advanceUntil(world, () => guard[STATS].hp < guard[STATS].maxHp);
    advanceUntil(world, () => first[STATS].hp < first[STATS].maxHp);
    expect(shooter[STATS].hp).toBe(shooter[STATS].maxHp);
    advanceUntil(world, () => isDead(world, first));
    advanceUntil(world, () => guard[POSITION].x === origin.x);
    advanceTicks(world, 3);
    expect(guard[POSITION]).toEqual(origin);
  });

  it("detects at five blocks after damage, chases to ten and returns at eleven", () => {
    const { world, hero } = createCreatureWorld("|♀     G             |", {
      G: "waterGuard",
    });
    const guard = getCreature(world, "waterGuard");
    const origin = { ...guard[POSITION] };
    world.assertComponents(hero, [BELONGABLE])[BELONGABLE].faction = "hostile";
    toughen(hero);
    guard[STATS].hp -= 1;
    advanceTicks(world, 3);
    expect(guard[POSITION]).toEqual(origin);
    teleport(world, hero, { x: origin.x + 5, y: origin.y });
    advanceTicks(world, 3);
    expect(guard[POSITION]).toEqual(origin);
    guard[STATS].hp -= 1;
    advanceUntil(world, () => guard[POSITION].x === origin.x + 1);
    teleport(world, hero, { x: origin.x + 10, y: origin.y });
    advanceUntil(world, () => guard[POSITION].x === origin.x + 9);
    teleport(world, hero, { x: origin.x + 11, y: origin.y });
    advanceUntil(world, () => guard[POSITION].x === origin.x);
    teleport(world, hero, { x: origin.x + 3, y: origin.y });
    advanceTicks(world, 3);
    expect(guard[POSITION]).toEqual(origin);
    guard[STATS].hp -= 1;
    advanceUntil(world, () => guard[POSITION].x === origin.x + 2);
  });

  it("resumes an older save without treating a previous wound as a fresh hit", () => {
    const { world, hero } = createCreatureWorld("|♀   G|", { G: "fireChief" });
    const chief = getCreature(world, "fireChief");
    const origin = { ...chief[POSITION] };
    chief[BEHAVIOUR].patterns = [];
    chief[STATS].hp -= 1;
    world.assertComponents(hero, [BELONGABLE])[BELONGABLE].faction = "hostile";
    const loaded = saveAndLoad(world);
    const restored = getCreature(loaded, "fireChief");
    advanceTicks(loaded, 3);
    expect(restored[POSITION]).toEqual(origin);
    restored[STATS].hp -= 1;
    advanceUntil(loaded, () => restored[POSITION].x < origin.x);
  });
});
