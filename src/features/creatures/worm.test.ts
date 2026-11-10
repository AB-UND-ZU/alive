import {
  createAreaWorld,
  assertHero,
  advanceUntil,
  advance,
  step,
  holdMove,
} from "../../testing/harness";
import {
  createCell,
  createNpc,
  populateInventory,
} from "../../bindings/creation";
import { wormArea, wormRadius, wormSize } from "../../game/levels/island/areas";
import {
  frameWidth,
  npcSequence,
  questSequence,
} from "../../game/assets/utils";
import {
  getIdentifier,
  getIdentifiersAndComponents,
  setIdentifier,
} from "../../engine/utils";
import { POSITION } from "../../engine/components/position";
import { LEVEL } from "../../engine/components/level";
import { FOCUSABLE } from "../../engine/components/focusable";
import { STATS } from "../../engine/components/stats";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { HARVESTABLE } from "../../engine/components/harvestable";
import { getCellEntities } from "../../engine/systems/map";
import { CASTABLE } from "../../engine/components/castable";
import { NPC } from "../../engine/components/npc";
import { FRAGMENT } from "../../engine/components/fragment";
import { BELONGABLE } from "../../engine/components/belongable";
import { HOMING } from "../../engine/components/homing";
import { EXERTABLE } from "../../engine/components/exertable";
import { MOVABLE } from "../../engine/components/movable";
import { LIGHT } from "../../engine/components/light";
import { FOG } from "../../engine/components/fog";
import { TOOLTIP } from "../../engine/components/tooltip";
import { PARTICLE } from "../../engine/components/particle";
import { isImmersible } from "../../engine/systems/immersion";
import { isWalkable } from "../../engine/systems/movement";
import { getDistance, signedDistance } from "../../game/math/std";
import { none, shadow } from "../../game/assets/sprites";
import { getFacingLayers, rage, rage2 } from "../../game/assets/ui";
import { VIEWABLE } from "../../engine/components/viewable";
import { POPUP } from "../../engine/components/popup";
import { SPRITE } from "../../engine/components/sprite";
import { ATTACKABLE } from "../../engine/components/attackable";
import { AFFECTABLE } from "../../engine/components/affectable";
import { initializeArea } from "../../engine/systems/initialize";
import { getSequence } from "../../engine/systems/sequence";
import {
  registerEntity,
  moveEntity,
  disposeEntity,
} from "../../engine/systems/map";
import {
  getAttackable,
  getLimbs,
  knockEntity,
} from "../../engine/systems/damage";
import { getAbilityStats } from "../../game/balancing/abilities";
import { PLAYER } from "../../engine/components/player";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { isQuestCompleted, removePopup } from "../../engine/systems/popup";
import { castSpell, completeQuest } from "../../engine/systems/trigger";
import { ORIENTABLE } from "../../engine/components/orientable";
import { BURNABLE } from "../../engine/components/burnable";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { extinguishEntity } from "../../engine/systems/burn";
import { getItemSprite } from "../../game/assets/utils";
import { pixelCircle } from "../../game/math/tracing";
import { getSegments, fixedHeight } from "../../components/Entity/utils";
import { getAffectable } from "../../engine/systems/magic";
import { shootHoming } from "../../engine/systems/homing";
import { colors } from "../../game/assets/colors";
import { RENDERABLE } from "../../engine/components/renderable";

import { TypedEntity } from "../../engine/entities";

const sound = jest.requireMock(
  "../../game/sound"
) as typeof import("../../game/sound");

const setup = () => {
  const rows = Array.from({ length: 25 }, () =>
    Array.from({ length: 35 }, () => "░")
  );
  for (const point of pixelCircle(
    { x: 17, y: 12 },
    wormRadius,
    undefined,
    true
  ))
    rows[point.y][point.x] = "█";
  for (const point of pixelCircle(
    { x: 17, y: 12 },
    wormRadius - 2,
    undefined,
    true
  ))
    rows[point.y][point.x] = "░";
  const caveRows = wormArea.split("\n");
  caveRows.forEach((row, y) =>
    row.split("").forEach((cell, x) => {
      rows[y + 12 - Math.floor(caveRows.length / 2)][x + 11] = cell;
    })
  );
  rows[18][17] = "♀";
  const world = createAreaWorld(
    rows.map((row) => `|${row.join("")}|`).join("\n"),
    { size: 40 }
  );
  initializeArea(world, { x: 0, y: 0 }, { x: 34, y: 24 });
  const hero = world.assertComponents(assertHero(world), [STATS, AFFECTABLE]);
  hero[STATS].maxHpCap = 10000;
  hero[STATS].hp = 10000;
  hero[STATS].maxHp = 10000;
  step(world);
  const room = world.assertComponents(getIdentifier(world, "wormRoom")!, [
    POSITION,
    VIEWABLE,
  ]);
  const bait = world.assertComponents(getIdentifier(world, "worm_bait")!, [
    STATS,
  ]);
  return { world, hero, room, bait };
};
const startFight = () => {
  const setupWorld = setup();
  const { world, bait } = setupWorld;
  bait[STATS].hp = 0;
  advanceUntil(world, () => !!getIdentifier(world, "worm_boss"));
  const boss = world.assertComponents(getIdentifier(world, "worm_boss")!, [
    STATS,
    BEHAVIOUR,
    POSITION,
  ]);
  const memory = boss[BEHAVIOUR].patterns.find(
    (pattern) => pattern.name === "worm_boss"
  )!.memory;
  return { ...setupWorld, boss, memory };
};

describe("worm cave encounter", () => {
  it("waits for the one-hit worm to die, closes the cave, and shakes before revealing the boss", () => {
    const { world, hero, bait, room } = setup();
    advance(world, 2000);
    expect(
      world.assertComponents(hero, [LIGHT])[LIGHT].brightness
    ).toBeGreaterThan(0);
    expect(world.assertComponents(room, [LIGHT])[LIGHT]).toMatchObject({
      brightness: 0,
      visibility: 0,
    });
    expect(room[VIEWABLE].active).toBe(false);
    expect(bait[STATS].hp).toBe(1);
    expect(getIdentifier(world, "worm_boss")).toBeUndefined();
    bait[STATS].hp = 0;
    advanceUntil(
      world,
      () => getSequence(world, room, "npc")?.args.step === "quake"
    );
    expect(
      world.assertComponents(hero, [VIEWABLE])[VIEWABLE].quake
    ).toBeGreaterThan(0);
    expect(room[VIEWABLE].active).toBe(false);
    expect(
      getIdentifiersAndComponents(world, "worm:barrier", [POSITION]).length
    ).toBeGreaterThan(50);
    expect(getIdentifier(world, "worm_boss")).toBeUndefined();
    advanceUntil(world, () => !!getIdentifier(world, "worm_boss"));
    expect(getSequence(world, room, "npc")?.args.step).toBe("fight");
    expect(
      world.assertComponents(hero, [LIGHT])[LIGHT].brightness
    ).toBeGreaterThan(0);
    expect(world.assertComponents(room, [LIGHT])[LIGHT]).toMatchObject({
      brightness: 0,
      visibility: 0,
    });
    expect(room[VIEWABLE].active).toBe(false);
  });

  it("keeps the bait looking and roaming like a loose worm until it is hit", () => {
    const { world, hero, bait } = setup();
    const mob = world.assertComponents(bait, [
      POSITION,
      ORIENTABLE,
      SPRITE,
      BEHAVIOUR,
    ]);
    const origin = { ...mob[POSITION] };
    expect(mob[SPRITE].facing).toEqual(
      getItemSprite({ stackable: "worm" }).facing
    );
    expect(bait[STATS].scale).toBe(0);
    advanceUntil(
      world,
      () => mob[POSITION].x !== origin.x || mob[POSITION].y !== origin.y
    );
    expect(mob[ORIENTABLE].facing).toBeDefined();
    mob[BEHAVIOUR].patterns = [];
    populateInventory(
      world,
      world.assertComponents(hero, [INVENTORY, POSITION]),
      [],
      [{ weapon: "sword", material: "gold", amount: 1, bound: false }]
    );
    moveEntity(world, hero, { x: mob[POSITION].x - 1, y: mob[POSITION].y });
    holdMove(world, ["right"]);
    advanceUntil(world, () => bait[STATS].hp === 0);
    holdMove(world, []);
    expect(
      world
        .getEntities([ITEM])
        .filter((item) => item[ITEM].stackable === "worm")
    ).toHaveLength(0);
  });

  it("encloses the cave wall's outer edge with a closed circular blocker", () => {
    const { world, room } = startFight();
    const barriers = getIdentifiersAndComponents(world, "worm:barrier", [
      POSITION,
    ]);
    const boundary = new Set(
      barriers.map((barrier) => `${barrier[POSITION].x},${barrier[POSITION].y}`)
    );
    const cave = pixelCircle(room[POSITION], wormRadius, undefined, true);
    expect(cave.every(({ x, y }) => !boundary.has(`${x},${y}`))).toBe(true);
    const interior = new Set<string>();
    const pending = [{ ...room[POSITION] }];
    while (pending.length) {
      const point = pending.pop()!;
      const key = `${point.x},${point.y}`;
      if (interior.has(key) || boundary.has(key)) continue;
      expect(Math.abs(point.x - room[POSITION].x)).toBeLessThanOrEqual(
        wormSize.x
      );
      expect(Math.abs(point.y - room[POSITION].y)).toBeLessThanOrEqual(
        wormSize.y
      );
      interior.add(key);
      pending.push(
        { x: point.x + 1, y: point.y },
        { x: point.x - 1, y: point.y },
        { x: point.x, y: point.y + 1 },
        { x: point.x, y: point.y - 1 }
      );
    }
    expect(cave.every(({ x, y }) => interior.has(`${x},${y}`))).toBe(true);
    expect(
      interior.has(`${room[POSITION].x + 14},${room[POSITION].y + 8}`)
    ).toBe(false);
  });

  it("keeps intro and artillery fires smokeless while ordinary campfires still smoke", () => {
    const { world } = startFight();
    advanceUntil(world, () => !!getIdentifier(world, "worm:fire"), 20000);
    advance(world, 500);
    const fires = getIdentifiersAndComponents(world, "worm:fire", [
      BURNABLE,
      SEQUENCABLE,
    ]);
    expect(fires.length).toBeGreaterThan(0);
    for (const fire of fires) {
      expect(fire[SPRITE]).toEqual(none);
      expect(fire[BURNABLE].smokeless).toBe(true);
      expect(getSequence(world, fire, "burn")).toBeDefined();
      expect(getSequence(world, fire, "smoke")).toBeUndefined();
    }
    const normal = createCell(
      world,
      { x: 0, y: 0 },
      "campfire",
      "visible"
    ).cell;
    registerEntity(world, normal);
    advance(world, 500);
    expect(getSequence(world, normal, "smoke")).toBeDefined();
    const smokeCount = () =>
      world
        .getEntities([SEQUENCABLE])
        .filter((entity) => getSequence(world, entity, "smoke")).length;
    const count = smokeCount();
    extinguishEntity(world, fires[0]);
    expect(smokeCount()).toBe(count);
  });

  it("uses a moderately extended sound envelope for the huge shock wave", () => {
    const play = jest.spyOn(sound, "play");
    try {
      const { world } = startFight();
      advanceUntil(world, () =>
        play.mock.calls.some(([name]) => name === "wave")
      );
      expect(
        play.mock.calls.find(([name]) => name === "wave")?.[1]?.intensity
      ).toBe(1.25);
    } finally {
      play.mockRestore();
    }
  });

  it("uses a burn-only opening wave and water extinguishes that burn", () => {
    const stats = getAbilityStats(
      { spell: "wave", material: "gold", element: "fire" },
      "wormBoss"
    );
    expect(stats).toMatchObject({
      magic: 0,
      true: 0,
      burn: 5,
      knock: 0,
      range: 16,
    });
    const { world, hero } = startFight();
    advanceUntil(world, () =>
      world
        .getEntities([CASTABLE])
        .some(
          (entity) => entity[CASTABLE].burn === 5 && entity[CASTABLE].true === 0
        )
    );
    hero[AFFECTABLE].burn = 3;
    moveEntity(world, hero, { x: 15, y: 12 });
    advanceUntil(world, () => hero[AFFECTABLE].burn === 0);
  });

  it("collapses cave walls into rubble without dropping mining resources", () => {
    const { world, room, memory } = startFight();
    const position = { x: room[POSITION].x + 8, y: room[POSITION].y + 3 };
    const wall = createCell(world, position, "mountain", "visible");
    wall.all.forEach((entity) => {
      if (entity[POSITION]) registerEntity(world, entity);
    });
    const oresBefore = new Set(
      world
        .getEntities([ITEM])
        .filter((entity) => entity[ITEM].stackable === "ore")
        .map((entity) => world.getEntityId(entity))
    );
    advanceUntil(world, () => memory.phase === "flight", 20000);
    expect(
      getCellEntities(world, position).some(
        (entity) => entity[HARVESTABLE]?.resource === "mountain"
      )
    ).toBe(false);
    expect(
      getCellEntities(world, position).some(
        (entity) => entity[HARVESTABLE]?.resource === "rubble"
      )
    ).toBe(true);
    expect(
      world
        .getEntities([ITEM])
        .filter(
          (entity) =>
            entity[ITEM].stackable === "ore" &&
            !oresBefore.has(world.getEntityId(entity))
        )
    ).toHaveLength(0);
  });

  it("keeps jumps inside the arena, turns in flight, and fires pairs of burning discs", () => {
    const { world, boss, memory, room } = startFight();
    advanceUntil(world, () => memory.phase === "flight", 20000);
    let fired = false;
    let turned = false;
    const head = world.assertComponents(boss, ["ORIENTABLE"]);
    const facings = new Set();
    for (let index = 0; index < 900; index += 1) {
      step(world);
      for (const limb of getLimbs(world, boss)) {
        expect(Math.abs(limb[POSITION]!.x - room[POSITION].x)).toBeLessThan(
          wormSize.x
        );
        expect(Math.abs(limb[POSITION]!.y - room[POSITION].y)).toBeLessThan(
          wormSize.y
        );
      }
      facings.add(head.ORIENTABLE.facing);
      fired ||=
        world
          .getEntities([HOMING, CASTABLE])
          .filter(
            (disc) =>
              disc[HOMING].type === "fireDisc" &&
              disc[CASTABLE].magic === 1 &&
              disc[CASTABLE].burn === 2
          ).length >= 2;
      turned ||= facings.size >= 3;
      if (fired && turned) break;
    }
    expect(fired).toBe(true);
    expect(turned).toBe(true);
  });

  it("keeps firing artillery until damaged, then changes phase", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(world, () => memory.phase === "artillery", 120000);
    const perimeterFires = getIdentifiersAndComponents(world, "worm:fire", [
      POSITION,
    ]).length;
    advance(world, 12000);
    expect(memory.phase).toBe("artillery");
    for (const fire of getIdentifiersAndComponents(world, "worm:fire", [
      BURNABLE,
      SEQUENCABLE,
    ])) {
      expect(fire[SPRITE]).toEqual(none);
      expect(fire[BURNABLE].smokeless).toBe(true);
      expect(getSequence(world, fire, "smoke")).toBeUndefined();
    }
    expect(
      getIdentifiersAndComponents(world, "worm:fire", [POSITION]).length
    ).toBeGreaterThan(perimeterFires);
    advanceUntil(world, () =>
      world
        .getEntities([CASTABLE])
        .some(
          (entity) =>
            entity[CASTABLE].magic === 3 && entity[CASTABLE].burn === 2
        )
    );
    boss[STATS].hp -= 35;
    advanceUntil(world, () => memory.phase !== "artillery");
  });

  it("spawns towers from lost segments and they heal the boss during its long low-health charge", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(world, () => memory.phase === "choose", 30000);
    boss[STATS].hp = 60;
    advanceUntil(world, () => memory.phase === "rage", 10000);
    expect(memory.length).toBeLessThan(15);
    advanceUntil(
      world,
      () => getIdentifiersAndComponents(world, "worm:tower", [STATS]).length > 0
    );
    const hp = boss[STATS].hp;
    advanceUntil(world, () => boss[STATS].hp > hp, 10000);
    expect(memory.phase).toBe("rage");
    expect(
      getLimbs(world, boss).some((limb) => limb !== boss && limb[EXERTABLE])
    ).toBe(true);
    expect(
      world
        .getEntities([HOMING])
        .some((disc) => disc[HOMING].type === "healDisc")
    ).toBe(true);
  });

  it("shows a reachable body segment and aims artillery at varied land cells with visible trails", () => {
    const { world, boss, memory, room } = startFight();
    advanceUntil(
      world,
      () => memory.phase === "artillery" && memory.ticks === 2,
      120000
    );
    const body = getLimbs(world, boss).find(
      (limb) => limb !== boss && limb[EXERTABLE]
    );
    expect(body).toBeDefined();
    expect(getAttackable(world, body![POSITION]!)).toBe(boss);
    expect(body![SPRITE]).not.toEqual(none);
    const arena = new Set(
      pixelCircle(room[POSITION], wormRadius, undefined, true).map(
        ({ x, y }) => `${x},${y}`
      )
    );
    const targets = new Set();
    for (let shot = 0; shot < 12; shot += 1) {
      advanceUntil(world, () => memory.ticks % 7 === 4);
      expect(isImmersible(world, memory.target)).toBe(false);
      expect(
        world.metadata.gameEntity[LEVEL].cells[memory.target.x][memory.target.y]
      ).not.toMatch(/^jetty/);
      expect(
        getDistance(
          memory.target,
          boss[POSITION],
          world.metadata.gameEntity[LEVEL].size
        )
      ).toBeGreaterThanOrEqual(3);
      expect(arena.has(`${memory.target.x},${memory.target.y}`)).toBe(true);
      targets.add(`${memory.target.x},${memory.target.y}`);
      const marker = world.assertByIdAndComponents(memory.marker, [FOG]);
      expect(marker[FOG].type).toBe("object");
      const sequence = getSequence(world, room, "npc")!;
      const trails = Object.entries(sequence.particles).filter(([name]) =>
        name.startsWith("artillery")
      );
      expect(trails).toHaveLength(3);
      for (const [, id] of trails) {
        const trail = world.assertByIdAndComponents(id, [PARTICLE, SPRITE]);
        expect(trail[SPRITE].layers[0].char).toBe("│");
        expect(trail[PARTICLE].animatedOrigin).toBeDefined();
      }
      advanceUntil(world, () => memory.ticks % 7 === 5);
    }
    expect(targets.size).toBeGreaterThanOrEqual(3);
  });

  it("detaches only the last moving segment and leaves the rest moving", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(
      world,
      () => memory.phase === "flight" && memory.emerged === memory.segments,
      30000
    );
    const lastId = memory.limbs.at(-1).id;
    const movingIds = memory.limbs
      .slice(0, -1)
      .map((limb: { id: number }) => limb.id);
    boss[STATS].hp -= 70;
    advanceUntil(world, () => memory.detached.length === 1);
    expect(memory.detached[0].id).toBe(lastId);
    expect(
      movingIds.some(
        (id: number) => world.getEntityById(id)?.[MOVABLE]?.orientations.length
      )
    ).toBe(true);
    const tails: { id: number; position: { x: number; y: number } }[] =
      memory.detached.map(
        (entry: { id: number; position: { x: number; y: number } }) => ({
          ...entry,
          position: { ...entry.position },
        })
      );
    for (const { id, position } of tails) {
      const tail = world.assertByIdAndComponents(id, [POSITION, MOVABLE]);
      expect(tail[MOVABLE].orientations).toEqual([]);
      expect(tail[EXERTABLE]).toBeUndefined();
      expect(tail.FRAGMENT).toBeUndefined();
      expect(getSequence(world, tail, "decay")).toBeDefined();
      advance(world, 100);
      expect(tail[POSITION]).toEqual(position);
    }
    advanceUntil(
      world,
      () =>
        getIdentifiersAndComponents(world, "worm:tower", [POSITION]).length >= 1
    );
    const towers = getIdentifiersAndComponents(world, "worm:tower", [
      POSITION,
      INVENTORY,
    ]);
    for (const { id } of tails) expect(world.getEntityById(id)).toBeUndefined();
    const center = getIdentifier(world, "wormRoom")![POSITION]!;
    const ring = new Set(
      pixelCircle(center, wormRadius - 3).map(({ x, y }) => `${x},${y}`)
    );
    for (const tower of towers) {
      expect(ring.has(`${tower[POSITION].x},${tower[POSITION].y}`)).toBe(true);
      expect(isImmersible(world, tower[POSITION])).toBe(false);
    }

    for (const tower of towers) {
      const drops = tower[INVENTORY].items.map(
        (id) => world.assertByIdAndComponents(id, [ITEM])[ITEM]
      );
      expect(drops).toHaveLength(1);
      expect(drops[0].consume).toBeUndefined();
      expect(drops).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            stat: "hp",
            amount: 1,
          }),
        ])
      );
    }
  });

  it.each([
    { x: 9, y: 0, oppositeX: -12, oppositeY: 0, outerX: 12, outerY: 0 },
    { x: -9, y: 0, oppositeX: 12, oppositeY: 0, outerX: -12, outerY: 0 },
    { x: 0, y: 5, oppositeX: 0, oppositeY: -7, outerX: 0, outerY: 7 },
    { x: 0, y: -5, oppositeX: 0, oppositeY: 7, outerX: 0, outerY: -7 },
  ])(
    "fires fixed opposing tower pairs across the cave from $x,$y",
    ({ x, y, oppositeX, oppositeY, outerX, outerY }) => {
      const { world, room, memory: bossMemory } = startFight();
      advanceUntil(world, () => bossMemory.phase === "flight", 30000);
      moveEntity(world, assertHero(world), {
        x: room[POSITION].x + 4,
        y: room[POSITION].y + 4,
      });
      const origin = { x: room[POSITION].x + x, y: room[POSITION].y + y };
      const target = {
        x: room[POSITION].x + oppositeX,
        y: room[POSITION].y + oppositeY,
      };
      const outer = {
        x: room[POSITION].x + outerX,
        y: room[POSITION].y + outerY,
      };
      const tower = createNpc(world, "wormTower", origin);
      registerEntity(world, tower);
      const memory = tower[BEHAVIOUR].patterns[0].memory;
      const shots: {
        tick: number;
        target: { x: number; y: number };
        ttl: number | undefined;
      }[] = [];
      const seen = new Set<number>();
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.99);
      let reached = false;
      let reachedOuter = false;
      try {
        for (
          let frame = 0;
          frame < 450 && (memory.ticks || 0) < 32;
          frame += 1
        ) {
          step(world);
          for (const disc of world.getEntities([HOMING, CASTABLE, POSITION])) {
            if (disc[CASTABLE].caster !== world.getEntityId(tower)) continue;
            const id = world.getEntityId(disc);
            if (!seen.has(id)) {
              seen.add(id);
              shots.push({
                tick: memory.ticks,
                target: { ...disc[HOMING].positions.at(-1)! },
                ttl: disc[HOMING].ttl,
              });
            }
            expect(x ? disc[POSITION].y : disc[POSITION].x).toBe(
              x ? origin.y : origin.x
            );
            reached ||=
              disc[POSITION].x === target.x && disc[POSITION].y === target.y;
            reachedOuter ||=
              disc[POSITION].x === outer.x && disc[POSITION].y === outer.y;
          }
        }
      } finally {
        randomSpy.mockRestore();
      }

      const ttl = Math.abs(oppositeX - x) + Math.abs(oppositeY - y) + 2;
      const outerTtl = Math.abs(outerX - x) + Math.abs(outerY - y) + 2;
      expect(shots).toEqual(
        [4, 5, 6, 17, 18, 19, 30, 31, 32].flatMap((tick) => [
          { tick, target, ttl },
          { tick, target: outer, ttl: outerTtl },
        ])
      );
      expect(reached).toBe(true);
      expect(reachedOuter).toBe(true);
    }
  );

  it("shows warning particles next to the player and enters rage promptly at low health", () => {
    const { world, hero, boss, memory } = startFight();
    memory.next = "burrow";
    advanceUntil(
      world,
      () =>
        memory.phase === "surface" &&
        memory.surfacePhase === "flight" &&
        memory.ticks === 1,
      30000
    );
    moveEntity(world, hero, { x: boss[POSITION].x, y: boss[POSITION].y + 1 });
    advanceUntil(
      world,
      () =>
        memory.phase === "surface" &&
        memory.surfacePhase === "flight" &&
        memory.ticks === 3
    );
    const warning = getSequence(world, boss, "dialog")!;
    expect(world.assertComponents(boss, [TOOLTIP])[TOOLTIP].idle).toBe(rage);
    expect(
      Object.values(warning.particles).some(
        (id) => world.getEntityById(id)?.[SPRITE] === rage
      )
    ).toBe(true);
    advanceUntil(world, () => memory.phase === "artillery", 120000);
    boss[STATS].hp = 187;
    advanceUntil(world, () => memory.phase === "rage", 15000);
    memory.rageAttack = "wave";
    memory.ticks = 0;
    advanceUntil(
      world,
      () => memory.phase === "rage" && memory.rageStarted && memory.ticks === 14
    );
    expect(world.assertComponents(boss, [TOOLTIP])[TOOLTIP].idle).toBe(rage);
    const center = getIdentifier(world, "wormRoom")![POSITION]!;
    expect(boss[POSITION]).toEqual({ x: center.x, y: center.y });
    advance(world, 2000);
    expect(memory.phase).toBe("rage");
  });

  it("emerges from the lake center, waits for the intro wave to finish, then jumps into sand", () => {
    const { world, boss, room, memory } = startFight();
    const center = { ...room[POSITION] };
    advanceUntil(world, () => memory.phase === "surface" && memory.ticks === 2);
    expect(boss[POSITION]).toEqual({ x: center.x, y: center.y + 1 });
    expect(boss[SPRITE]).toEqual(none);
    expect(getIdentifier(world, "worm:hole")![SPRITE]).toEqual(shadow);
    expect(getAttackable(world, center)).toBeUndefined();
    advanceUntil(world, () => memory.phase === "surface" && memory.ticks === 4);
    expect(boss[ORIENTABLE]?.facing).toBe("up");
    advanceUntil(world, () => memory.phase === "intro");
    expect(boss[POSITION]).toEqual({ x: center.x, y: center.y });
    expect(
      world.assertByIdAndComponents(memory.limbs[1].id, [POSITION])[POSITION]
    ).toEqual({ x: center.x, y: center.y + 1 });
    advanceUntil(world, () => memory.phase === "flight", 30000);
    expect(memory.introJump).toBe(true);
    expect(isImmersible(world, memory.waypoints[0])).toBe(true);
    expect(isImmersible(world, memory.waypoints.at(-1))).toBe(false);
    expect(
      world
        .getEntities([CASTABLE, SEQUENCABLE])
        .filter(
          (spell) => getSequence(world, spell, "spell")?.args.memory?.double
        )
    ).toHaveLength(0);
  });

  it("retreats head-up after the artillery body and becomes untargetable underground", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(world, () => memory.phase === "artillery", 120000);
    const bodyId = memory.limbs[1].id;
    boss[STATS].hp -= 35;
    advanceUntil(world, () => memory.phase === "retreat" && memory.ticks === 1);
    expect(boss[ORIENTABLE]?.facing).toBe("up");
    expect(boss[POSITION]).toEqual(memory.hole);
    expect(world.getEntityById(bodyId)).toBeDefined();
    advanceUntil(world, () => memory.phase === "retreat" && memory.ticks === 2);
    expect(world.getEntityById(bodyId)).toBeUndefined();
    advanceUntil(world, () => memory.phase === "hidden");
    expect(boss[SPRITE]).toEqual(none);
    expect(boss[ORIENTABLE]?.facing).toBeUndefined();
    expect(boss[ATTACKABLE]).toBeUndefined();
    expect(boss[AFFECTABLE]).toBeUndefined();
    expect(boss[EXERTABLE]).toBeUndefined();
  });

  it("launches a red summon from the exposed neck without breaking its body, and creates a tower only on arrival", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(
      world,
      () => memory.phase === "artillery" && memory.ticks === 2,
      120000
    );
    const bodyId = memory.limbs[1].id;
    const body = world.assertByIdAndComponents(bodyId, [POSITION]);
    const position = { ...body[POSITION] };
    boss[STATS].hp -= 70;
    advanceUntil(world, () =>
      world
        .getEntities([HOMING])
        .some((disc) => disc[HOMING].type === "wormTower")
    );
    const disc = world
      .getEntities([HOMING, POSITION])
      .find((disc) => disc[HOMING].type === "wormTower")!;
    expect(disc[POSITION]).toEqual(position);
    expect(body[POSITION]).toEqual(position);
    expect(getSequence(world, body, "decay")).toBeUndefined();
    expect(memory.detached).toHaveLength(0);
    expect(
      getIdentifiersAndComponents(world, "worm:tower", [POSITION])
    ).toHaveLength(0);
    const target = { ...disc[HOMING].positions[0] };
    advanceUntil(
      world,
      () =>
        getIdentifiersAndComponents(world, "worm:tower", [POSITION]).length ===
        1,
      20000
    );
    expect(getIdentifier(world, "worm:tower")![POSITION]).toEqual(target);
  });

  it("starts rage at 25 percent and stays there despite healing and repeated waves", () => {
    const { world, boss, room, memory } = startFight();
    advanceUntil(world, () => memory.phase === "artillery", 120000);
    boss[STATS].hp = 188;
    advance(world, 1000);
    expect(memory.enraged).not.toBe(true);
    boss[STATS].hp = 187;
    advanceUntil(world, () => memory.phase === "rage", 15000);
    expect(boss[POSITION]).toEqual({
      x: room[POSITION].x,
      y: room[POSITION].y,
    });
    expect(
      world.assertByIdAndComponents(memory.limbs[1].id, [POSITION])[POSITION]
    ).toEqual({ x: room[POSITION].x, y: room[POSITION].y + 1 });
    boss[STATS].hp = 250;
    const positions = [];
    for (let frame = 0; frame < 650; frame += 1) {
      step(world);
      expect(memory.phase).toBe("rage");
      positions.push({ ...boss[POSITION] });
    }
    expect(
      positions.every(
        ({ x, y }) => x === room[POSITION].x && y === room[POSITION].y
      )
    ).toBe(true);
  });

  it("places the sign one cell farther south of the cave", () => {
    const { world, room } = setup();
    expect(getIdentifier(world, "worm_sign")![POSITION]).toEqual({
      x: room[POSITION].x,
      y: room[POSITION].y + 5,
    });
  });

  it("keeps the huge wave inside the fire circle while destroying the whole cave wall ring", () => {
    const { world, boss, room, memory } = startFight();
    advanceUntil(world, () => memory.phase === "collapse", 20000);
    const wave = world
      .getEntities([CASTABLE, SEQUENCABLE, POSITION])
      .find(
        (entity) =>
          entity[CASTABLE].caster === world.getEntityId(boss) &&
          getSequence(world, entity, "spell")?.args.memory.double
      )!;
    expect(wave[POSITION]).toEqual(room[POSITION]);
    const arena = new Set(
      pixelCircle(room[POSITION], wormRadius, undefined, true).map(
        ({ x, y }) => `${x},${y}`
      )
    );
    let visible = 0;
    let farDiagonal = false;
    const reached = new Set<string>();
    for (let frame = 0; frame < 400; frame += 1) {
      const sequence = getSequence(world, wave, "spell");
      if (!sequence) break;
      for (const id of Object.values(sequence.particles)) {
        const particle = world.assertByIdAndComponents(id, [PARTICLE, SPRITE]);
        if (
          !getFacingLayers(particle[SPRITE], particle[ORIENTABLE]?.facing)
            .length
        )
          continue;
        const x = wave[POSITION].x + particle[PARTICLE].offsetX;
        const y = wave[POSITION].y + particle[PARTICLE].offsetY;
        expect(arena.has(`${x},${y}`)).toBe(true);
        farDiagonal ||=
          Math.abs(x - room[POSITION].x) >= 6 &&
          Math.abs(y - room[POSITION].y) >= 6;
        visible += 1;
      }
      for (const id of sequence.args.areas) {
        const area = world.assertByIdAndComponents(id, [POSITION]);
        reached.add(`${area[POSITION].x},${area[POSITION].y}`);
        expect(arena.has(`${area[POSITION].x},${area[POSITION].y}`)).toBe(true);
      }
      step(world);
    }
    expect(visible).toBeGreaterThan(0);
    expect(farDiagonal).toBe(true);
    // A few dry cells just inside the fire rim remain outside the wave.
    expect(
      reached.has(`${room[POSITION].x + 13},${room[POSITION].y + 3}`)
    ).toBe(false);
    expect(
      isImmersible(world, { x: room[POSITION].x + 13, y: room[POSITION].y + 3 })
    ).toBe(false);
    const inner = pixelCircle(room[POSITION], wormRadius - 1, undefined, true);
    expect(
      inner.filter(({ x, y }) => reached.has(`${x},${y}`)).length / inner.length
    ).toBeGreaterThan(0.95);
    expect(
      world
        .getEntities([POSITION, HARVESTABLE])
        .filter(
          (entity) =>
            entity[HARVESTABLE].resource === "mountain" &&
            arena.has(`${entity[POSITION].x},${entity[POSITION].y}`)
        )
    ).toHaveLength(0);
  });

  it("jumps farther across the cave and shoots pairs from the current mouth cell", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(world, () => memory.phase === "flight", 30000);
    expect(
      Math.abs(memory.waypoints.at(-1).x - memory.waypoints[0].x)
    ).toBeGreaterThanOrEqual(8);
    const seen = new Set<number>();
    let pairs = 0;
    for (let frame = 0; frame < 180; frame += 1) {
      step(world);
      const discs = world
        .getEntities([HOMING, CASTABLE, POSITION])
        .filter(
          (disc) =>
            disc[HOMING].type === "fireDisc" &&
            disc[CASTABLE].caster === world.getEntityId(boss) &&
            !seen.has(world.getEntityId(disc))
        );
      if (!discs.length) continue;
      expect(discs).toHaveLength(2);
      const facing = world.assertComponents(boss, [ORIENTABLE])[ORIENTABLE]
        .facing!;
      const delta = {
        up: { x: 0, y: -1 },
        right: { x: 1, y: 0 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
      }[facing];
      for (const disc of discs) {
        expect(disc[POSITION]).toEqual({
          x: boss[POSITION].x + delta.x,
          y: boss[POSITION].y + delta.y,
        });
        seen.add(world.getEntityId(disc));
      }
      pairs += 1;
      if (pairs >= 3) break;
    }
    expect(pairs).toBeGreaterThanOrEqual(3);
  });

  it("preserves a tower's dropped heart through boss death cleanup and lets the hero collect it", () => {
    const { world, boss, hero, memory } = startFight();
    advanceUntil(world, () => memory.phase === "choose", 60000);
    const created = createCell(
      world,
      { x: memory.center.x + 6, y: memory.center.y + 2 },
      "wormTower",
      "visible"
    );
    for (const entity of created.all)
      if (entity[POSITION]) registerEntity(world, entity);
    const tower = world.assertComponents(created.cell, [STATS]);
    setIdentifier(world, tower, "worm:tower");
    tower[STATS].hp = 0;
    advanceUntil(world, () =>
      world
        .getEntities([ITEM, "IDENTIFIABLE"])
        .some((item) => item.IDENTIFIABLE.name === "worm:tower:drop")
    );
    const heart = world
      .getEntities([ITEM, "IDENTIFIABLE"])
      .find((item) => item.IDENTIFIABLE.name === "worm:tower:drop")!;
    const heartId = world.getEntityId(heart);
    advanceUntil(
      world,
      () =>
        !!world
          .getEntityByIdAndComponents(heart[ITEM].carrier, [INVENTORY])
          ?.[INVENTORY].items.includes(heartId)
    );
    boss[STATS].hp = 0;
    advance(world, 1600);
    const carrier = world.assertByIdAndComponents(heart[ITEM].carrier, [
      POSITION,
    ]);
    hero[STATS].hp = hero[STATS].maxHp - 10;
    const hp = hero[STATS].hp;
    moveEntity(world, hero, {
      x: carrier[POSITION].x - 1,
      y: carrier[POSITION].y,
    });
    holdMove(world, ["right"]);
    advanceUntil(world, () => hero[STATS].hp > hp);
    holdMove(world, []);
    advance(world, 18000);
    expect(getIdentifier(world, "worm_boss")).toBeUndefined();
    expect(getIdentifier(world, "worm_chest")).toBeDefined();
  });

  it("clears barriers, fires and towers after victory and permits leaving without restarting", () => {
    const { world, boss, room, memory } = startFight();
    advanceUntil(world, () => memory.phase === "flight", 20000);
    advance(world, 2000);
    boss[STATS].hp = 0;
    advanceUntil(
      world,
      () => getSequence(world, room, "npc")?.args.step === "cleared",
      20000
    );
    expect(
      getIdentifiersAndComponents(world, "worm:fire", [POSITION])
    ).toHaveLength(0);
    expect(getSequence(world, room, "npc")?.args.step).toBe("cleared");
    advance(world, 4000);
    expect(getIdentifier(world, "worm_boss")).toBeUndefined();
  });

  it("pauses after the bait dies and shows blockers before starting the earthquake", () => {
    const { world, hero, room, bait } = setup();
    bait[STATS].hp = 0;
    advanceUntil(
      world,
      () => getSequence(world, room, "npc")?.args.step === "pause"
    );
    const start = world.metadata.gameEntity[RENDERABLE].generation;
    expect(getIdentifier(world, "worm:barrier")).toBeUndefined();
    expect(hero[VIEWABLE]?.quake).toBeUndefined();
    advanceUntil(
      world,
      () => getSequence(world, room, "npc")?.args.step === "block"
    );
    expect(
      world.metadata.gameEntity[RENDERABLE].generation - start
    ).toBeGreaterThanOrEqual(3);
    expect(getIdentifier(world, "worm:barrier")).toBeDefined();
    expect(hero[VIEWABLE]?.quake).toBeUndefined();
    advanceUntil(
      world,
      () => getSequence(world, room, "npc")?.args.step === "quake"
    );
    expect(hero[VIEWABLE]?.quake).toBeGreaterThan(
      world.metadata.gameEntity[RENDERABLE].generation
    );
  });

  it.each([4, 8, 13])(
    "keeps a connected body across jumps when a tail dies after %i flight ticks",
    (ticks) => {
      const { world, boss, memory } = startFight();
      advanceUntil(
        world,
        () => memory.phase === "flight" && memory.ticks === ticks,
        30000
      );
      boss[STATS].hp -= 110;
      let flights = 1;
      let previous = memory.phase;
      for (let frame = 0; frame < 2200 && flights < 4; frame += 1) {
        memory.next = "burrow";
        step(world);
        if (memory.phase === "flight" && previous !== "flight") flights += 1;
        const limbs = memory.limbs.map(({ id }: { id: number }) =>
          world.assertByIdAndComponents(id, [POSITION, FOG])
        );
        for (let index = 1; index < limbs.length; index += 1) {
          expect(
            getDistance(limbs[index - 1][POSITION], limbs[index][POSITION], 40)
          ).toBeLessThanOrEqual(1);
          expect(limbs[index][FOG]).toMatchObject({
            visibility: "visible",
            fixed: true,
          });
        }
        previous = memory.phase;
      }
      expect(flights).toBe(4);
    }
  );

  it("keeps the body connected while the head is frozen and when flight resumes", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(
      world,
      () => memory.phase === "flight" && memory.limbs.length >= 6,
      30000
    );
    boss[AFFECTABLE]!.freeze = 10;
    for (let frame = 0; frame < 150; frame += 1) {
      step(world);
      const limbs = memory.limbs.map(({ id }: { id: number }) =>
        world.assertByIdAndComponents(id, [POSITION])
      );
      for (let index = 1; index < limbs.length; index += 1)
        expect(
          getDistance(limbs[index - 1][POSITION], limbs[index][POSITION], 40)
        ).toBeLessThanOrEqual(1);
    }
    boss[AFFECTABLE]!.freeze = 0;
    advanceUntil(world, () => memory.phase !== "flight", 20000);
  });

  it("launches a detached tail summon as soon as decay completes while its red vanish plays", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(
      world,
      () => memory.phase === "flight" && memory.emerged === memory.segments,
      30000
    );
    const id = memory.limbs.at(-1).id;
    const origin = {
      ...world.assertByIdAndComponents(id, [POSITION])[POSITION],
    };
    boss[STATS].hp -= 70;
    advanceUntil(world, () => memory.detached.length === 1);
    advanceUntil(
      world,
      () => !!getSequence(world, world.assertById(id), "decay")?.particles.decay
    );
    const meshId = getSequence(world, world.assertById(id), "decay")!.particles
      .decay;
    const mesh = world.assertByIdAndComponents(meshId, [PARTICLE, SPRITE]);
    expect(mesh[SPRITE].layers).toEqual([{ char: "▒", color: colors.black }]);
    expect(mesh[PARTICLE].offsetZ).toBeGreaterThan(fixedHeight);
    advanceUntil(
      world,
      () => !!world.getEntityById(id)?.[SEQUENCABLE]?.states.evaporate
    );
    const tail = world.assertByIdAndComponents(id, [POSITION]);
    expect(tail[POSITION]).toEqual(origin);
    expect(
      getSequence(world, tail, "evaporate")?.args.sprite.layers.every(
        ({ color }) => color === colors.red
      )
    ).toBe(true);
    const disc = world
      .getEntities([HOMING, POSITION])
      .find((disc) => disc[HOMING].type === "wormTower")!;
    expect(disc).toBeDefined();
    expect(disc[POSITION]).toEqual(origin);
    expect(world.getEntityById(id)).toBeDefined();
    expect(getSequence(world, tail, "evaporate")).toBeDefined();
    expect(getIdentifier(world, "worm:tower")).toBeUndefined();
  });

  it("anchors towers against storm knockback and restricts their +8 healing to the boss", () => {
    const { world, boss } = startFight();
    const tower = createNpc(world, "wormTower", { x: 12, y: 12 });
    registerEntity(world, tower);
    tower[BEHAVIOUR].patterns = [];
    tower[STATS].hp = 10;
    knockEntity(world, tower, "left", 10);
    expect(tower[POSITION]).toEqual({ x: 12, y: 12 });
    boss[STATS].hp -= 20;
    const hp = boss[STATS].hp;
    const disc = shootHoming(world, tower, {
      type: "healDisc",
      target: world.getEntityId(boss),
      positions: [{ ...boss[POSITION] }],
      ttl: 30,
    });
    expect(disc[CASTABLE].heal).toBe(8);
    advanceUntil(world, () => boss[STATS].hp > hp, 20000);
    expect(boss[STATS].hp).toBe(hp + 8);
    expect(tower[STATS].hp).toBe(10);
  });

  it("times out artillery eventually without player damage", () => {
    const { world, memory } = startFight();
    advanceUntil(world, () => memory.phase === "artillery", 120000);
    advanceUntil(world, () => memory.phase !== "artillery", 50000);
    expect(memory.phase).toBe("retreat");
  });

  it("gives the tougher boss three armor and protects head and neck from remaining fire damage and burns", () => {
    const { world, boss, memory } = startFight();
    expect(boss[STATS]).toMatchObject({
      hp: 750,
      maxHp: 750,
      armor: 3,
      resist: -2,
    });
    advanceUntil(world, () => memory.phase === "artillery", 120000);
    for (const position of [boss[POSITION], memory.hole]) {
      const fire = createCell(
        world,
        { ...position },
        "campfire",
        "visible"
      ).cell;
      registerEntity(world, fire);
    }
    const hp = boss[STATS].hp;
    advance(world, 7000);
    expect(boss[STATS].hp).toBe(hp);
    expect(boss[AFFECTABLE]?.burn).toBe(0);
  });

  it("clears the wave warning and casts four delayed gold blasts in the cardinal directions", () => {
    const { world, boss, memory } = startFight();
    boss[STATS].hp = 187;
    advanceUntil(world, () => memory.phase === "rage", 60000);
    memory.rageAttack = "wave";
    memory.ticks = 0;
    advanceUntil(world, () => memory.rageStarted && memory.ticks === 14);
    expect(boss[TOOLTIP]?.idle).toBe(rage);
    advanceUntil(world, () => memory.ticks === 24);
    expect(boss[TOOLTIP]?.idle).toBeUndefined();
    advanceUntil(world, () => memory.ticks === 0);
    memory.rageAttack = "blasts";
    const shots: { tick: number; facing: string | undefined }[] = [];
    const seen = new Set<number>();
    for (let frame = 0; frame < 260 && shots.length < 4; frame += 1) {
      step(world);
      for (const blast of world.getEntities([
        CASTABLE,
        SEQUENCABLE,
        ORIENTABLE,
      ])) {
        const id = world.getEntityId(blast);
        const sequence = getSequence(world, blast, "spell");
        if (
          seen.has(id) ||
          blast[CASTABLE].caster !== world.getEntityId(boss) ||
          sequence?.name !== "castBlast"
        )
          continue;
        seen.add(id);
        shots.push({ tick: memory.ticks, facing: blast[ORIENTABLE].facing });
        expect(blast[CASTABLE]).toMatchObject({
          magic: 5,
          true: 0,
          burn: 0,
          knock: 2,
          retrigger: 2,
          reproc: 1,
        });
        expect(sequence.args.memory.elemental).not.toBe(true);
        expect(sequence.args.material).toBe("gold");
        expect(world.assertComponents(blast, [POSITION])[POSITION]).toEqual({
          x: boss[POSITION].x,
          y: boss[POSITION].y,
        });
      }
    }
    expect(shots.map((shot) => shot.tick)).toEqual([6, 10, 14, 18]);
    expect(shots.map((shot) => shot.facing).sort()).toEqual([
      "down",
      "left",
      "right",
      "up",
    ]);
    expect(shots.map((shot) => shot.facing)).toEqual(memory.blastDirections);
  });

  it("keeps ordinary jump emergence and re-entry on sand and removes underground shadows and hitboxes", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(
      world,
      () => memory.phase === "flight" && !memory.introJump,
      120000
    );
    let flights = 0;
    for (let jump = 0; jump < 3; jump += 1) {
      const [start] = memory.waypoints;
      const finish = memory.waypoints.at(-1);
      expect(isImmersible(world, start)).toBe(false);
      expect(isImmersible(world, finish)).toBe(false);
      expect(
        world.metadata.gameEntity[LEVEL].cells[start.x][start.y]
      ).not.toMatch(/^jetty/);
      expect(
        world.metadata.gameEntity[LEVEL].cells[finish.x][finish.y]
      ).not.toMatch(/^jetty/);
      advanceUntil(world, () => memory.phase === "hidden", 20000);
      expect(boss[SPRITE]).toEqual(none);
      expect(getAttackable(world, boss[POSITION])).toBeUndefined();
      expect(getAffectable(world, boss[POSITION])).toBeUndefined();
      expect(
        getSegments(world, boss, {
          isTransparent: false,
          receiveShadow: false,
        }).some((segment) => segment.sprite === shadow)
      ).toBe(false);
      memory.next = "burrow";
      advanceUntil(
        world,
        () => memory.phase === "flight" && !memory.introJump,
        120000
      );
      flights += 1;
    }
    expect(flights).toBe(3);
  });

  it("lets a red tower summon damage repeatedly on its way to spawning a tower", () => {
    const { world, hero, boss, memory, room } = startFight();
    advanceUntil(world, () => memory.phase === "flight", 30000);
    boss[BEHAVIOUR].patterns = [];
    const origin = { x: room[POSITION].x - 8, y: room[POSITION].y + 4 };
    const target = { x: room[POSITION].x + 8, y: origin.y };
    const disc = shootHoming(world, boss, {
      type: "wormTower",
      positions: [target],
      ttl: 40,
    });
    moveEntity(world, disc, origin);
    moveEntity(world, hero, { x: origin.x + 1, y: origin.y });
    hero[STATS].damp = 99;
    const hp = hero[STATS].hp;
    expect(disc[CASTABLE]).toMatchObject({
      magic: 1,
      true: 0,
      burn: 2,
      retrigger: 2,
    });
    advanceUntil(world, () => hero[STATS].hp < hp);
    expect(world.getEntityById(world.getEntityId(disc))).toBeDefined();
    expect(disc[HOMING].decayedGeneration).toBeUndefined();
    const afterFirst = hero[STATS].hp;
    moveEntity(world, hero, { x: disc[POSITION].x + 4, y: origin.y });
    advanceUntil(world, () => hero[STATS].hp < afterFirst);
    advanceUntil(world, () => !!getIdentifier(world, "worm:tower"), 20000);
    expect(getIdentifier(world, "worm:tower")![POSITION]).toEqual(target);
  });

  it("uses a red oak vanish over the neck and whole visible mouth, then leaves the golden worm chest at the jetty tip", () => {
    const { world, boss, memory, room } = startFight();
    boss[STATS].hp = 187;
    advanceUntil(
      world,
      () => memory.phase === "rage" && memory.ticks === 2,
      60000
    );
    const liveLimbs = getLimbs(world, boss);
    expect(liveLimbs).toHaveLength(2);
    const expected = new Set(
      liveLimbs.map((limb) => `${limb[POSITION]!.x},${limb[POSITION]!.y}`)
    );
    const mouth = getSequence(world, boss, "limb")!;
    for (const id of Object.values(mouth.particles)) {
      const part = world.assertByIdAndComponents(id, [
        PARTICLE,
        SPRITE,
        ORIENTABLE,
      ]);
      const visible = getFacingLayers(
        part[SPRITE],
        part[ORIENTABLE].facing
      ).length;
      if (visible)
        expected.add(
          `${boss[POSITION].x + part[PARTICLE].offsetX},${
            boss[POSITION].y + part[PARTICLE].offsetY
          }`
        );
    }
    expect(expected.size).toBeGreaterThan(2);
    boss[STATS].hp = 0;
    expect(getIdentifier(world, "worm_chest")).toBeUndefined();
    const covered = new Set<string>();
    let square = false;
    for (
      let frame = 0;
      frame < 650 && getIdentifier(world, "worm_boss");
      frame += 1
    ) {
      step(world);
      const vanish = getSequence(world, boss, "vanish");
      for (const id of Object.values(vanish?.particles || {})) {
        const part = world.assertByIdAndComponents(id, [PARTICLE, SPRITE]);
        if (part[SPRITE].layers.some(({ color }) => color === colors.red))
          covered.add(
            `${boss[POSITION].x + part[PARTICLE].offsetX},${
              boss[POSITION].y + part[PARTICLE].offsetY
            }`
          );
        square ||= part[SPRITE].layers.some(
          ({ color, char }) => color === colors.red && char === "█"
        );
      }
    }
    expect(square).toBe(true);
    expect([...expected].every((position) => covered.has(position))).toBe(true);
    expect(getIdentifier(world, "worm_boss")).toBeUndefined();
    advanceUntil(world, () => !!getIdentifier(world, "worm_chest"));
    const chest = world.assertComponents(getIdentifier(world, "worm_chest")!, [
      POSITION,
      INVENTORY,
    ]);
    expect(chest[POSITION]).toEqual({
      x: room[POSITION].x,
      y: room[POSITION].y + 2,
    });
    const loot = chest[INVENTORY].items.map(
      (id) => world.assertByIdAndComponents(id, [ITEM])[ITEM]
    );
    expect(loot).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stackable: "resource",
          material: "wood",
          element: "fire",
          amount: 1,
        }),
        expect.objectContaining({
          stackable: "resource",
          material: "gold",
          amount: 5,
        }),
        expect.objectContaining({
          consume: "potion",
          material: "iron",
          stat: "hp",
          amount: 10,
        }),
      ])
    );
    expect(loot).toHaveLength(3);
  });

  it("collapses walls and lights each rim cell only as the initial wave approaches", () => {
    const { world, room, memory } = startFight();
    advanceUntil(world, () => memory.phase === "collapse", 20000);
    expect(getIdentifier(world, "worm:fire")).toBeUndefined();
    const cells = pixelCircle(room[POSITION], wormRadius, undefined, true);
    const keys = new Set(cells.map(({ x, y }) => `${x},${y}`));
    const rim = cells.filter(({ x, y }) =>
      [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
      ].some((delta) => !keys.has(`${x + delta.x},${y + delta.y}`))
    );
    const walls = world
      .getEntities([HARVESTABLE, POSITION])
      .filter(
        (wall) =>
          wall[HARVESTABLE].resource === "mountain" &&
          keys.has(`${wall[POSITION].x},${wall[POSITION].y}`)
      )
      .map((wall) => ({
        id: world.getEntityId(wall),
        position: { ...wall[POSITION] },
      }));
    const near = (position: { x: number; y: number }) =>
      Math.max(
        0,
        Math.abs(signedDistance(room[POSITION].x, position.x, 40)) - 1
      ) +
      Math.max(
        0,
        Math.abs(signedDistance(room[POSITION].y, position.y, 40)) - 1
      );
    let partial = false;
    let partialHadWalls = false;
    for (
      let frame = 0;
      frame < 350 && memory.phase === "collapse";
      frame += 1
    ) {
      step(world);
      const fires = getIdentifiersAndComponents(world, "worm:fire", [POSITION]);
      for (const fire of fires)
        expect(near(fire[POSITION])).toBeLessThanOrEqual(memory.collapseRadius);
      for (const wall of walls.filter((wall) => !world.getEntityById(wall.id)))
        expect(near(wall.position)).toBeLessThanOrEqual(memory.collapseRadius);
      if (!partial && fires.length > 0 && fires.length < rim.length) {
        partial = true;
        partialHadWalls = walls.some((wall) => !!world.getEntityById(wall.id));
      }
    }
    expect(partial).toBe(true);
    expect(partialHadWalls).toBe(true);
    expect(memory.phase).toBe("flight");
    expect(
      getIdentifiersAndComponents(world, "worm:fire", [POSITION])
    ).toHaveLength(rim.length);
    expect(walls.every((wall) => !world.getEntityById(wall.id))).toBe(true);
  });

  it("uses shout dialogs once for the intro, rage and death, without transient messages", () => {
    const { world, boss, memory } = startFight();
    const lines = () =>
      (boss[TOOLTIP]?.dialogs || []).map((line) =>
        line
          .slice(1, -1)
          .map((sprite) => sprite.layers.at(-1)!.char)
          .join("")
      );
    advanceUntil(world, () => memory.phase === "surface" && memory.ticks === 4);
    expect(lines()).toEqual([]);
    advanceUntil(world, () => memory.phase === "intro" && memory.ticks === 1);
    expect(lines()).toEqual([expect.stringMatching(/^[?¿]{4,8}$/)]);
    expect(getSequence(world, boss, "message")).toBeUndefined();
    advanceUntil(world, () => memory.phase === "artillery", 120000);
    expect(lines()).toEqual([]);
    expect(memory.shoutUntil).toBeUndefined();
    boss[STATS].hp = 187;
    advanceUntil(world, () => memory.rageShouted, 60000);
    expect(lines()).toEqual([expect.stringMatching(/^[!¡]{4,8}$/)]);
    advance(world, 18000);
    expect(lines()).toEqual([]);
    expect(memory.rageShouted).toBe(true);
    boss[STATS].hp = 0;
    advanceUntil(
      world,
      () => !!getSequence(world, boss, "vanish")?.particles.shout
    );
    const speakerId = getSequence(world, boss, "vanish")!.particles.shout;
    const speaker = world.assertByIdAndComponents(speakerId, [TOOLTIP]);
    expect(
      speaker[TOOLTIP].dialogs[0]
        .slice(1, -1)
        .map((sprite) => sprite.layers.at(-1)!.char)
        .join("")
    ).toMatch(/^\.{3,5}$/);
    advanceUntil(world, () => !!getSequence(world, speaker, "dialog"));
    expect(getSequence(world, speaker, "dialog")!.args.isEnemy).toBe(true);
    expect(
      getSequence(world, boss, "message")?.args.messages.some(({ line }) =>
        /^[?¿.!¡]+$/.test(
          line
            .slice(1, -1)
            .map((sprite) => sprite.layers.at(-1)!.char)
            .join("")
        )
      )
    ).not.toBe(true);
    advanceUntil(world, () => !world.getEntityById(speakerId), 2000);
    expect(getSequence(world, boss, "vanish")?.particles.shout).toBeUndefined();
  });

  it("launches consecutive artillery shots seven ticks apart", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(world, () => memory.phase === "artillery", 120000);
    const impacts: number[] = [];
    const seen = new Set<number>();
    for (let frame = 0; frame < 360 && impacts.length < 3; frame += 1) {
      step(world);
      for (const wave of world.getEntities([CASTABLE, SEQUENCABLE])) {
        const id = world.getEntityId(wave);
        if (
          seen.has(id) ||
          wave[CASTABLE].caster !== world.getEntityId(boss) ||
          wave[CASTABLE].magic !== 3 ||
          getSequence(world, wave, "spell")?.name !== "castWave1"
        )
          continue;
        seen.add(id);
        impacts.push(memory.ticks);
      }
    }
    expect(impacts).toEqual([7, 14, 21]);
    expect(
      getIdentifiersAndComponents(world, "worm:fire", [POSITION]).length
    ).toBeGreaterThan(50);
  });

  it.each(["intro", "flight", "artillery", "rage"])(
    "shows the head before the neck using the same %s emergence path",
    (phase) => {
      const { world, boss, memory } = startFight();
      memory.next = phase === "flight" ? "burrow" : "artillery";
      if (phase === "rage") boss[STATS].hp = 187;
      advanceUntil(
        world,
        () =>
          memory.phase === "surface" &&
          memory.surfacePhase === phase &&
          memory.ticks === 4,
        120000
      );
      expect(memory.limbs).toHaveLength(1);
      expect(boss[SPRITE]).not.toEqual(none);
      expect(boss[ORIENTABLE]?.facing).toBe("up");
      for (const id of Object.values(
        getSequence(world, boss, "limb")!.particles
      )) {
        expect(
          world.assertByIdAndComponents(id, [PARTICLE])[PARTICLE].offsetZ
        ).toBeGreaterThan(fixedHeight);
      }
      expect(boss[POSITION]).toEqual(memory.hole);
      advanceUntil(world, () =>
        phase === "flight"
          ? memory.phase === "flight" && memory.ticks === 0
          : memory.phase === "surface" && memory.ticks === 5
      );
      expect(memory.limbs).toHaveLength(2);
      expect(
        world.assertByIdAndComponents(memory.limbs[1].id, [POSITION])[POSITION]
      ).toEqual(memory.hole);
      expect(boss[POSITION]).not.toEqual(memory.hole);
    }
  );

  it("keeps the entry hole briefly after the last segment goes underground, without a hitbox", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(world, () => memory.phase === "flight", 30000);
    memory.next = "burrow";
    advanceUntil(world, () => memory.phase === "hidden", 20000);
    const id = memory.entryHole;
    const generation = world.metadata.gameEntity[RENDERABLE].generation;
    expect(world.assertByIdAndComponents(id, [SPRITE])[SPRITE]).toEqual(shadow);
    expect(getAttackable(world, boss[POSITION])).toBeUndefined();
    expect(getAffectable(world, boss[POSITION])).toBeUndefined();
    advanceUntil(
      world,
      () => world.metadata.gameEntity[RENDERABLE].generation >= generation + 2
    );
    expect(world.getEntityById(id)).toBeDefined();
    advanceUntil(
      world,
      () => world.metadata.gameEntity[RENDERABLE].generation >= generation + 3
    );
    expect(world.getEntityById(id)).toBeUndefined();
  });

  it("cycles spaced pairs, dense roof pairs and a shorter outer shield across jumps", () => {
    const { world, boss, memory } = startFight();
    const patterns: number[] = [];
    const groups: {
      pattern: number;
      facing: string | undefined;
      origins: { x: number; y: number }[];
      targets: { x: number; y: number }[];
      paths: { x: number; y: number }[][];
      generation: number;
    }[] = [];
    const seen = new Set<number>();
    let previous = "";
    for (let frame = 0; frame < 6500; frame += 1) {
      memory.next = "burrow";
      step(world);
      if (memory.phase === "flight" && previous !== "flight")
        patterns.push(memory.shotPattern);
      const discs = world
        .getEntities([HOMING, CASTABLE, POSITION])
        .filter(
          (disc) =>
            disc[HOMING].type === "fireDisc" &&
            disc[CASTABLE].caster === world.getEntityId(boss) &&
            !seen.has(world.getEntityId(disc))
        );
      if (discs.length) {
        discs.forEach((disc) => seen.add(world.getEntityId(disc)));
        groups.push({
          pattern: memory.shotPattern,
          generation: world.metadata.gameEntity[RENDERABLE].generation,
          facing: boss[ORIENTABLE]?.facing,
          origins: discs.map((disc) => ({ ...disc[POSITION] })),
          targets: discs.map((disc) => ({ ...disc[HOMING].positions.at(-1)! })),
          paths: discs.map((disc) =>
            disc[HOMING].positions.map((position) => ({ ...position }))
          ),
        });
      }
      if (patterns.length === 4 && memory.phase !== "flight") break;
      previous = memory.phase;
    }
    expect(patterns).toEqual([0, 1, 2, 0]);
    const spaced = groups.filter((group) => group.pattern === 0);
    expect(spaced.length).toBeGreaterThanOrEqual(6);
    expect(spaced.every((group) => group.origins.length === 2)).toBe(true);
    const roof = groups.filter((group) => group.pattern === 1);
    expect(roof.length).toBeGreaterThanOrEqual(8);
    expect(
      roof.every(
        (group) =>
          group.origins.length === 2 &&
          ["left", "right"].includes(group.facing!)
      )
    ).toBe(true);
    const shields = groups.filter((group) => group.pattern === 2);
    expect(shields).toHaveLength(11);
    for (const group of shields) {
      expect(group.origins).toHaveLength(1);
      expect(group.paths[0]).toHaveLength(3);
    }
    expect(
      shields
        .slice(1)
        .map((group, index) => group.generation - shields[index].generation)
    ).toEqual(Array(10).fill(1));
    expect(new Set(shields.map((group) => group.origins[0].x)).size).toBe(1);
    expect(
      new Set(shields.map((group) => JSON.stringify(group.paths[0]))).size
    ).toBe(1);
  });

  it.each([750, 500, 200])(
    "starts the outer shield beside the neck and lands its last disc with the tail at %s HP",
    (hp) => {
      const { world, boss, memory } = startFight();
      advanceUntil(
        world,
        () => memory.phase === "flight" && memory.ticks === 0,
        60000
      );
      boss[STATS].hp = hp;
      memory.shotPattern = 2;
      const ids: number[] = [];
      let landing = -1;
      let tailLanding = -1;
      let firstNeck: { x: number; y: number } | undefined;
      let firstOrigin: { x: number; y: number } | undefined;
      for (let frame = 0; frame < 1000; frame++) {
        step(world);
        for (const disc of world.getEntities([HOMING, CASTABLE, POSITION])) {
          const id = world.getEntityId(disc);
          if (
            disc[HOMING].type !== "fireDisc" ||
            disc[CASTABLE].caster !== world.getEntityId(boss) ||
            ids.includes(id)
          )
            continue;
          ids.push(id);
          if (ids.length === 1) {
            firstOrigin = { ...disc[POSITION] };
            firstNeck = {
              ...world.assertByIdAndComponents(memory.limbs[1].id, [POSITION])[
                POSITION
              ],
            };
          }
        }
        const last = world.getEntityByIdAndComponents(ids[ids.length - 1], [
          POSITION,
          HOMING,
        ]);
        const target = last?.[HOMING].positions.at(-1);
        if (
          last &&
          target &&
          last[POSITION].x === target.x &&
          last[POSITION].y === target.y &&
          landing < 0
        )
          landing = world.metadata.gameEntity[RENDERABLE].generation;
        if (memory.phase !== "flight" && tailLanding < 0)
          tailLanding = world.metadata.gameEntity[RENDERABLE].generation;
        if (tailLanding >= 0 && landing >= 0) break;
      }
      expect(firstOrigin!.y).toBe(firstNeck!.y);
      expect(Math.abs(firstOrigin!.x - firstNeck!.x)).toBe(1);
      expect(ids).toHaveLength(memory.segments - 4);
      expect(landing).toBe(tailLanding);
    }
  );

  it("shortens the flying shield with damage so remaining shots land with the shorter tail", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(
      world,
      () => memory.phase === "flight" && memory.ticks === 0,
      60000
    );
    memory.shotPattern = 2;
    advanceUntil(world, () => memory.shieldDiscs.length === 9);
    boss[STATS].hp = 500;
    advanceUntil(world, () => memory.shieldDiscs.length === 7);
    const last = world.assertByIdAndComponents(memory.shieldDiscs.at(-1), [
      POSITION,
      HOMING,
    ]);
    const target = { ...last[HOMING].positions.at(-1)! };
    let landing = -1;
    let tailLanding = -1;
    for (
      let frame = 0;
      frame < 700 && (landing < 0 || tailLanding < 0);
      frame++
    ) {
      step(world);
      if (
        landing < 0 &&
        last[POSITION].x === target.x &&
        last[POSITION].y === target.y
      )
        landing = world.metadata.gameEntity[RENDERABLE].generation;
      if (tailLanding < 0 && memory.phase !== "flight")
        tailLanding = world.metadata.gameEntity[RENDERABLE].generation;
    }
    expect(landing).toBe(tailLanding);
  });

  it("finishes queued shots before an adjacent iron slash and requires at least two new shots", () => {
    const { world, boss, hero, room } = startFight();
    boss[BEHAVIOUR].patterns = [];
    const tower = createNpc(world, "wormTower", {
      x: room[POSITION].x + 9,
      y: room[POSITION].y,
    });
    registerEntity(world, tower);
    expect(tower[STATS]).toMatchObject({ hp: 40, armor: 2 });
    const memory = tower[BEHAVIOUR].patterns[0].memory;
    advanceUntil(world, () => memory.queuedAttack === "shot");
    moveEntity(world, hero, { x: tower[POSITION].x, y: tower[POSITION].y + 1 });
    const shots = new Set<number>();
    const generations: number[] = [];
    const track = () => {
      const fresh = world
        .getEntities([HOMING, CASTABLE])
        .filter(
          (disc) =>
            disc[CASTABLE].caster === world.getEntityId(tower) &&
            disc[HOMING].type === "fireDisc" &&
            !shots.has(world.getEntityId(disc))
        );
      if (fresh.length)
        generations.push(world.metadata.gameEntity[RENDERABLE].generation);
      fresh.forEach((disc) => shots.add(world.getEntityId(disc)));
    };
    for (
      let frame = 0;
      frame < 300 && memory.queuedAttack !== "slash";
      frame += 1
    ) {
      step(world);
      track();
    }
    expect(shots.size).toBe(6);
    expect(
      generations.slice(1).map((value, index) => value - generations[index])
    ).toEqual([1, 1]);
    expect(memory.shotsSinceSlash).toBe(0);
    const warned = world.metadata.gameEntity[RENDERABLE].generation;
    moveEntity(world, hero, { x: room[POSITION].x, y: room[POSITION].y + 6 });
    advanceUntil(world, () => memory.queuedAttack !== "slash");
    expect(world.metadata.gameEntity[RENDERABLE].generation - warned).toBe(4);
    const slash = world
      .getEntities([CASTABLE, SEQUENCABLE])
      .find(
        (spell) =>
          spell[CASTABLE].caster === world.getEntityId(tower) &&
          !!getSequence(world, spell, "slash")
      )!;
    expect(slash[CASTABLE]).toMatchObject({
      melee: 1,
      magic: 0,
      burn: 0,
      knock: 3,
    });
    expect(getSequence(world, slash, "slash")!.args.material).toBe("iron");
    expect(getSequence(world, slash, "slash")!.args.element).toBeUndefined();
    advance(world, 100);
    const palette = Object.values(
      getSequence(world, slash, "slash")!.particles
    ).flatMap((id) => {
      const particle = world.assertByIdAndComponents(id, [SPRITE, ORIENTABLE]);
      return getFacingLayers(particle[SPRITE], particle[ORIENTABLE].facing).map(
        (layer) => layer.color
      );
    });
    expect(palette).not.toContain(colors.red);
    expect(palette).not.toContain(colors.yellow);
    advanceUntil(world, () => !getSequence(world, slash, "slash"));
    const before = shots.size;
    moveEntity(world, hero, { x: tower[POSITION].x, y: tower[POSITION].y + 1 });
    for (
      let frame = 0;
      frame < 300 && memory.queuedAttack !== "slash";
      frame += 1
    ) {
      step(world);
      track();
    }
    expect(memory.queuedAttack).toBe("slash");
    expect(shots.size - before).toBeGreaterThanOrEqual(4);
  });

  it("keeps artillery fires for a longer randomized duration", () => {
    const { world, memory } = startFight();
    advanceUntil(world, () => memory.phase === "artillery", 120000);
    const seen = new Set<number>();
    const durations: number[] = [];
    for (let frame = 0; frame < 360 && durations.length < 3; frame += 1) {
      step(world);
      for (const fire of memory.fires as { id: number; end: number }[]) {
        if (seen.has(fire.id)) continue;
        seen.add(fire.id);
        durations.push(
          fire.end - world.metadata.gameEntity[RENDERABLE].generation
        );
      }
    }
    expect(durations).toHaveLength(3);
    expect(
      durations.every((duration) => duration >= 60 && duration <= 150)
    ).toBe(true);
    expect(new Set(durations).size).toBeGreaterThan(1);
  });

  it("removes the arena after a player death and allows a fresh attempt", () => {
    const { world, hero } = startFight();
    hero[STATS].hp = 0;
    advanceUntil(
      world,
      () =>
        getIdentifiersAndComponents(world, "worm:barrier", [POSITION])
          .length === 0
    );
    expect(getIdentifier(world, "worm_boss")).toBeUndefined();
    expect(getIdentifier(world, "worm_bait")?.[STATS]?.hp).toBe(1);
  });
  it("moves continuously from the hole into flight without gaps behind the head", () => {
    const { world, boss, memory } = startFight();
    memory.next = "burrow";
    advanceUntil(
      world,
      () =>
        memory.phase === "surface" &&
        memory.surfacePhase === "flight" &&
        memory.ticks === 4,
      120000
    );
    let generation = world.metadata.gameEntity[RENDERABLE].generation;
    let position = { ...boss[POSITION] };
    for (let tick = 0; tick < 5; tick += 1) {
      const previousGeneration = generation;
      advanceUntil(
        world,
        () =>
          world.metadata.gameEntity[RENDERABLE].generation > previousGeneration
      );
      generation = world.metadata.gameEntity[RENDERABLE].generation;
      expect(boss[POSITION]).not.toEqual(position);
      position = { ...boss[POSITION] };
      for (let i = 1; i < memory.limbs.length; i += 1) {
        const head = world.assertByIdAndComponents(memory.limbs[i - 1].id, [
          POSITION,
        ]);
        const tail = world.assertByIdAndComponents(memory.limbs[i].id, [
          POSITION,
        ]);
        expect(
          getDistance(head[POSITION], tail[POSITION], 40, 1, false)
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  it("reserves nearby separated ring targets for decayed tail summons", () => {
    const { world, boss, memory, room } = startFight();
    advanceUntil(
      world,
      () => memory.phase === "flight" && memory.limbs.length >= 7,
      30000
    );
    boss[STATS].hp -= 70;
    advanceUntil(world, () => memory.detached.length > 0);
    const detached = memory.detached[0];
    advanceUntil(world, () => detached.summoned, 15000);
    const disc = world
      .getEntities([HOMING, CASTABLE])
      .find(
        (disc) =>
          disc[HOMING].type === "wormTower" &&
          disc[CASTABLE].caster === world.getEntityId(boss)
      )!;
    const target = disc[HOMING].positions[0];
    const ring = new Set(
      pixelCircle(room[POSITION], wormRadius - 3).map(({ x, y }) => `${x},${y}`)
    );
    expect(ring.has(`${target.x},${target.y}`)).toBe(true);
    expect(getDistance(detached.position, target, 40)).toBeGreaterThanOrEqual(
      3
    );
    expect(getDistance(detached.position, target, 40)).toBeLessThanOrEqual(7);
  });

  it("summons once per new three-percent rage health threshold despite healing", () => {
    const { world, boss, memory } = startFight();
    boss[STATS].hp = 187;
    advanceUntil(world, () => memory.phase === "rage", 60000);
    expect(memory.rageThreshold || 0).toBe(0);
    const summons = () =>
      world
        .getEntities([HOMING, CASTABLE])
        .filter(
          (disc) =>
            disc[HOMING].type === "wormTower" &&
            disc[CASTABLE].caster === world.getEntityId(boss)
        )
        .map((disc) => world.getEntityId(disc));
    const seen = new Set(summons());
    for (const [hp, threshold] of [
      [165, 1],
      [142, 2],
      [120, 3],
    ]) {
      boss[STATS].hp = hp;
      advanceUntil(world, () => memory.rageThreshold === threshold);
      const launched = summons().filter((id) => !seen.has(id));
      expect(launched).toHaveLength(1);
      launched.forEach((id) => seen.add(id));
      boss[STATS].hp = 187;
      advance(world, 700);
      expect(memory.rageThreshold).toBe(threshold);
      expect(summons().filter((id) => !seen.has(id))).toHaveLength(0);
      boss[STATS].hp = hp;
      advance(world, 700);
      expect(memory.rageThreshold).toBe(threshold);
      expect(summons().filter((id) => !seen.has(id))).toHaveLength(0);
    }
    boss[STATS].hp = 52;
    advanceUntil(world, () => memory.rageThreshold === 4);
    const queued = new Set(summons().filter((id) => !seen.has(id)));
    boss[STATS].hp = 187;
    for (let frame = 0; frame < 120 && memory.rageThreshold < 6; frame += 1) {
      step(world);
      summons()
        .filter((id) => !seen.has(id))
        .forEach((id) => queued.add(id));
    }
    expect(memory.rageThreshold).toBe(6);
    expect(queued.size).toBe(3);
  });

  it("randomly selects each rage attack and repeats exactly three red slashes with equal gaps", () => {
    const { world, boss, memory } = startFight();
    boss[STATS].hp = 187;
    advanceUntil(world, () => memory.rageStarted, 60000);
    for (const [value, attack] of [
      [0, "wave"],
      [0.4, "blasts"],
      [0.9, "slashes"],
    ] as const) {
      delete memory.rageAttack;
      memory.ticks = 0;
      const spy = jest.spyOn(Math, "random").mockReturnValue(value);
      try {
        advanceUntil(world, () => !!memory.rageAttack);
      } finally {
        spy.mockRestore();
      }
      expect(memory.rageAttack).toBe(attack);
    }
    const count = memory.slashes;
    expect(count).toBe(3);
    const casts: number[] = [];
    const seen = new Set<number>();
    for (let frame = 0; frame < 500 && casts.length < count; frame += 1) {
      step(world);
      for (const spell of world.getEntities([CASTABLE, SEQUENCABLE])) {
        const id = world.getEntityId(spell);
        if (
          seen.has(id) ||
          spell[CASTABLE].caster !== world.getEntityId(boss) ||
          !getSequence(world, spell, "slash")
        )
          continue;
        seen.add(id);
        casts.push(world.metadata.gameEntity[RENDERABLE].generation);
        expect(spell[CASTABLE]).toMatchObject({
          magic: 2,
          melee: 0,
          burn: 3,
          knock: 12,
        });
      }
    }
    expect(casts).toHaveLength(count);
    expect(
      casts.slice(1).map((generation, index) => generation - casts[index])
    ).toEqual(Array(count - 1).fill(6));
    expect(memory.rageAttack).toBeUndefined();
  });
  it("finishes emerging before each shout and removes the whole dialog before casting", () => {
    const { world, boss, memory } = startFight();
    advanceUntil(world, () => memory.phase === "surface" && memory.ticks === 6);
    expect(boss[TOOLTIP]?.dialogs).toEqual([]);
    const still = { ...boss[POSITION] };
    advanceUntil(world, () => memory.phase === "intro" && memory.ticks === 1);
    expect(boss[POSITION]).toEqual(still);
    const references = new Set<number>();
    for (let frame = 0; frame < 200 && memory.phase === "intro"; frame += 1) {
      const dialog = getSequence(world, boss, "dialog");
      if (dialog?.args.isDialog) references.add(dialog.reference);
      expect(
        world
          .getEntities([CASTABLE, SEQUENCABLE])
          .some(
            (spell) => getSequence(world, spell, "spell")?.name === "castWave1"
          )
      ).toBe(false);
      step(world);
    }
    expect(memory.phase).toBe("collapse");
    expect(references.size).toBe(1);
    expect(boss[TOOLTIP]?.dialogs).toEqual([]);
    expect(getSequence(world, boss, "dialog")).toBeUndefined();
    boss[STATS].hp = 187;
    advanceUntil(world, () => memory.rageShouted, 60000);
    const ragePosition = { ...boss[POSITION] };
    for (let frame = 0; frame < 200 && !memory.rageStarted; frame += 1) {
      expect(boss[POSITION]).toEqual(ragePosition);
      expect(memory.rageAttack).toBeUndefined();
      step(world);
    }
    expect(memory.rageStarted).toBe(true);
    expect(boss[TOOLTIP]?.dialogs).toEqual([]);
    expect(getSequence(world, boss, "dialog")).toBeUndefined();
  });

  it("warns rage slashes with rage2 for exactly four ticks and uses normal rage for waves", () => {
    const { world, boss, memory } = startFight();
    boss[STATS].hp = 187;
    advanceUntil(world, () => memory.rageStarted, 60000);
    memory.rageAttack = "slashes";
    memory.slashes = 3;
    memory.ticks = 0;
    advanceUntil(world, () => memory.ticks === 1);
    expect(boss[TOOLTIP]?.idle).toBe(rage2);
    const warned = world.metadata.gameEntity[RENDERABLE].generation;
    advanceUntil(world, () =>
      world
        .getEntities([CASTABLE, SEQUENCABLE])
        .some(
          (spell) =>
            spell[CASTABLE].caster === world.getEntityId(boss) &&
            !!getSequence(world, spell, "slash")
        )
    );
    expect(world.metadata.gameEntity[RENDERABLE].generation - warned).toBe(4);
    expect(boss[TOOLTIP]?.idle).toBeUndefined();
  });

  it("keeps artillery damage within its smaller visible radius through the final frame", () => {
    const { world, boss, hero, memory } = startFight();
    advanceUntil(
      world,
      () => memory.phase === "artillery" && memory.ticks === 7,
      120000
    );
    const wave = world
      .getEntities([CASTABLE, SEQUENCABLE, POSITION])
      .find(
        (spell) =>
          spell[CASTABLE].caster === world.getEntityId(boss) &&
          spell[CASTABLE].magic === 3 &&
          getSequence(world, spell, "spell")?.name === "castWave1"
      )!;
    expect(getSequence(world, wave, "spell")!.args.range).toBe(2);
    boss[BEHAVIOUR].patterns = [];
    for (const fire of world.getEntities([BURNABLE]))
      fire[BURNABLE].burning = false;
    for (const spell of [...world.getEntities([CASTABLE])])
      if (spell !== wave && !spell[NPC] && !spell[FRAGMENT])
        disposeEntity(world, spell);
    for (const fire of getIdentifiersAndComponents(world, "worm:fire", [
      POSITION,
    ]))
      disposeEntity(world, fire);
    const origin = { ...wave[POSITION] };
    const outside = [
      { x: 0, y: 2 },
      { x: 0, y: -2 },
      { x: 2, y: 0 },
      { x: -2, y: 0 },
    ]
      .map((delta) => ({ x: origin.x + delta.x, y: origin.y + delta.y }))
      .filter((position) => isWalkable(world, position))
      .sort(
        (a, b) =>
          getDistance(b, boss[POSITION], 40) -
          getDistance(a, boss[POSITION], 40)
      )[0];
    moveEntity(world, hero, outside);
    hero[AFFECTABLE].burn = 0;
    step(world);
    hero[AFFECTABLE].burn = 0;
    const hp = hero[STATS].hp;

    let frames = 0;
    for (; frames < 60 && getSequence(world, wave, "spell"); frames += 1) {
      step(world);

      for (const id of getSequence(world, wave, "spell")?.args.areas || []) {
        const area = world.assertByIdAndComponents(id, [POSITION]);
        expect(
          getDistance(origin, area[POSITION], 40, 1, false)
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(signedDistance(origin.x, area[POSITION].x, 40)) +
            Math.abs(signedDistance(origin.y, area[POSITION].y, 40))
        ).toBeLessThanOrEqual(2);
      }
    }
    expect(frames).toBeLessThanOrEqual(12);
    expect(getSequence(world, wave, "spell")).toBeUndefined();
    expect(hero[STATS].hp).toBe(hp);
    expect(hero[AFFECTABLE].burn).toBe(0);
  });
  it("protects towers from environmental fire and fire spells while ordinary magic can hurt them", () => {
    const { world, boss, room } = startFight();
    boss[BEHAVIOUR].patterns = [];
    world.assertComponents(boss, [BELONGABLE])[BELONGABLE].faction = "hostile";
    const position = { x: room[POSITION].x + 5, y: room[POSITION].y };
    const tower = createNpc(world, "wormTower", position);
    tower[BEHAVIOUR].patterns = [];
    registerEntity(world, tower);
    const fire = createCell(world, position, "campfire", "visible").cell;
    registerEntity(world, fire);
    const hp = tower[STATS].hp;
    advance(world, 4000);
    expect(tower[STATS].hp).toBe(hp);
    expect(tower[AFFECTABLE]?.burn).toBe(0);
    const disc = shootHoming(world, boss, {
      type: "fireDisc",
      positions: [position],
      ttl: 10,
    });
    moveEntity(world, disc, position);
    const cast = (element?: "fire") => {
      const spell = castSpell(world, boss, {
        [ITEM]: {
          carrier: -1,
          bound: false,
          amount: 1,
          spell: "wave",
          material: "iron",
          element,
        },
      })!;
      Object.assign(spell[POSITION], position);
      return spell;
    };
    cast("fire");
    advance(world, 700);
    expect(tower[STATS].hp).toBe(hp);
    expect(tower[AFFECTABLE]?.burn).toBe(0);
    const blast = castSpell(
      world,
      boss,
      {
        [ITEM]: {
          carrier: -1,
          bound: false,
          amount: 1,
          spell: "blast",
          material: "gold",
          element: "fire",
        },
      },
      "up"
    )!;
    Object.assign(blast[POSITION], { x: position.x, y: position.y + 1 });
    expect(blast[CASTABLE]).toMatchObject({ magic: 5, burn: 0 });
    advance(world, 700);
    expect(tower[STATS].hp).toBe(hp);
    const ordinary = cast();
    expect(ordinary[CASTABLE].magic).toBeGreaterThan(0);
    advanceUntil(world, () => tower[STATS].hp < hp);
  });

  it("avoids tower artillery targets and cancels an impact if a tower arrives after the warning", () => {
    const { world, boss, hero, memory } = startFight();
    advanceUntil(
      world,
      () => memory.phase === "artillery" && memory.ticks === 1,
      120000
    );
    const target = { ...memory.target };
    const tower = createNpc(world, "wormTower", target);
    tower[BEHAVIOUR].patterns = [];
    registerEntity(world, tower);
    advanceUntil(world, () => memory.ticks === 7);
    expect(
      world
        .getEntities([CASTABLE, SEQUENCABLE, POSITION])
        .some(
          (spell) =>
            spell[CASTABLE].caster === world.getEntityId(boss) &&
            spell[CASTABLE].magic === 3 &&
            spell[POSITION].x === target.x &&
            spell[POSITION].y === target.y &&
            !!getSequence(world, spell, "spell")
        )
    ).toBe(false);
    expect(
      getIdentifiersAndComponents(world, "worm:fire", [POSITION]).some(
        (fire) => fire[POSITION].x === target.x && fire[POSITION].y === target.y
      )
    ).toBe(false);
    moveEntity(world, hero, target);
    for (let shot = 0; shot < 8; shot += 1) {
      advanceUntil(world, () => memory.ticks % 7 === 1);
      expect(memory.target).not.toEqual(target);
      advanceUntil(world, () => memory.ticks % 7 === 2);
    }
  });
  it.each([false, true])(
    "keeps the complete connected body growing under damage (after artillery: %s)",
    (afterArtillery) => {
      const { world, boss, memory } = startFight();
      if (afterArtillery) {
        advanceUntil(
          world,
          () => memory.phase === "artillery" && memory.ticks === 6,
          120000
        );
        boss[STATS].hp = 570;
        advanceUntil(world, () => memory.phase !== "artillery", 20000);
      }
      memory.next = "burrow";
      advanceUntil(
        world,
        () =>
          memory.phase === "flight" && !memory.introJump && memory.ticks === 0,
        120000
      );
      boss[STATS].hp = 500;
      const generation = world.metadata.gameEntity[RENDERABLE].generation;
      advanceUntil(
        world,
        () => world.metadata.gameEntity[RENDERABLE].generation > generation
      );
      expect(memory.limbs.length).toBeGreaterThan(1);
      let maximum = memory.limbs.length;
      for (
        let frame = 0;
        frame < 1000 && memory.phase === "flight";
        frame += 1
      ) {
        step(world);
        maximum = Math.max(maximum, memory.limbs.length);
        const parts = memory.limbs.map((limb: { id: number }) =>
          world.assertByIdAndComponents(limb.id, [POSITION])
        );
        for (let n = 1; n < parts.length; n += 1)
          expect(
            getDistance(
              parts[n - 1][POSITION],
              parts[n][POSITION],
              40,
              1,
              false
            )
          ).toBeLessThanOrEqual(1);
      }
      expect(memory.phase).not.toBe("flight");
      expect(maximum).toBeGreaterThanOrEqual(11);
    }
  );
  it("blinks artillery markers twice per world tick on the ground", () => {
    const { world, memory } = startFight();
    advanceUntil(
      world,
      () => memory.phase === "artillery" && memory.ticks === 1,
      120000
    );
    const marker = world.assertByIdAndComponents(memory.marker, [SPRITE, FOG]);
    const initial = marker[SPRITE];
    expect(marker[FOG].type).toBe("object");
    advance(world, 200);
    expect(marker[SPRITE]).not.toBe(initial);
    advance(world, 200);
    expect(marker[SPRITE]).toBe(initial);
  });

  it("keeps two orbiting tower discs during artillery and stops them on exit", () => {
    const { world, boss, room, memory } = startFight();
    const bossPattern = boss[BEHAVIOUR].patterns[0];
    memory.phase = "artillery";
    boss[BEHAVIOUR].patterns = [
      { name: "wait", memory: { ticks: 1000 } },
      bossPattern,
    ];
    const tower = createNpc(world, "wormTower", {
      x: room[POSITION].x + 7,
      y: room[POSITION].y + 2,
    });
    registerEntity(world, tower);
    const towerMemory = tower[BEHAVIOUR].patterns[0].memory;
    advanceUntil(world, () => towerMemory.orbits?.length === 2);
    const ids = [...towerMemory.orbits] as number[];
    const first = world.assertByIdAndComponents(ids[0], [
      POSITION,
      HOMING,
      CASTABLE,
    ]);
    const origin = { ...first[POSITION] };
    expect(first[HOMING]).toMatchObject({ type: "fireOrbit", ttl: 0 });
    expect(first[CASTABLE]).toMatchObject({ magic: 1, burn: 2 });
    advance(world, 700);
    expect(first[POSITION]).not.toEqual(origin);
    expect(
      world
        .getEntities([HOMING, CASTABLE])
        .filter(
          (disc) =>
            disc[CASTABLE].caster === world.getEntityId(tower) &&
            disc[HOMING].type === "fireOrbit"
        )
    ).toHaveLength(2);
    memory.phase = "flight";
    advanceUntil(world, () => !towerMemory.orbits);
    advance(world, 700);
    expect(ids.every((id) => !world.getEntityById(id))).toBe(true);
  });

  it("uses each artillery orbit once and can slash nearby heroes without firing bursts", () => {
    const { world, boss, room, hero, memory } = startFight();
    boss[BEHAVIOUR].patterns.unshift({ name: "wait", memory: { ticks: 1000 } });
    memory.phase = "artillery";
    const tower = createNpc(world, "wormTower", {
      x: room[POSITION].x + 7,
      y: room[POSITION].y + 2,
    });
    registerEntity(world, tower);
    const towerMemory = tower[BEHAVIOUR].patterns[0].memory;
    advanceUntil(world, () => towerMemory.orbits?.length === 2);
    const ids = [...towerMemory.orbits] as number[];
    const disc = world.assertByIdAndComponents(ids[0], [
      POSITION,
      CASTABLE,
      HOMING,
    ]);
    expect(disc[CASTABLE].retrigger).toBe(0);
    moveEntity(world, hero, disc[POSITION]);
    advanceUntil(
      world,
      () => !!disc[HOMING].decayedGeneration || !world.getEntityById(ids[0])
    );
    advanceUntil(world, () =>
      world
        .getEntities([CASTABLE, SEQUENCABLE])
        .some(
          (spell) =>
            spell[CASTABLE].caster === world.getEntityId(tower) &&
            !!spell[SEQUENCABLE].states.slash
        )
    );
    moveEntity(world, hero, { x: room[POSITION].x, y: room[POSITION].y + 2 });
    advance(world, 3000);
    expect(towerMemory.orbits).toEqual(ids);
    expect(
      world
        .getEntities([HOMING, CASTABLE])
        .filter(
          (shot) =>
            shot[CASTABLE].caster === world.getEntityId(tower) &&
            shot[HOMING].type === "fireOrbit"
        )
        .every((shot) => ids.includes(world.getEntityId(shot)))
    ).toBe(true);
    expect(
      world
        .getEntities([HOMING, CASTABLE])
        .some(
          (shot) =>
            shot[CASTABLE].caster === world.getEntityId(tower) &&
            shot[HOMING].type === "fireDisc"
        )
    ).toBe(false);
  });

  it.each(["shot", "slash"])(
    "cancels queued %s in rage and stays peaceful above the heal cap",
    (queuedAttack) => {
      const { world, boss, room, hero, memory } = startFight();
      boss[BEHAVIOUR].patterns.unshift({
        name: "wait",
        memory: { ticks: 1000 },
      });
      memory.phase = "choose";
      const tower = createNpc(world, "wormTower", {
        x: room[POSITION].x + 7,
        y: room[POSITION].y + 2,
      });
      registerEntity(world, tower);
      const towerMemory = tower[BEHAVIOUR].patterns[0].memory;
      advanceUntil(world, () => !!towerMemory.queuedAttack);
      towerMemory.queuedAttack = queuedAttack;
      towerMemory.attackAt = towerMemory.ticks + 1;
      moveEntity(world, hero, {
        x: tower[POSITION].x,
        y: tower[POSITION].y + 1,
      });
      memory.phase = "rage";
      boss[STATS].hp = 180;
      advanceUntil(world, () => !!towerMemory.heal);
      expect(towerMemory.queuedAttack).toBeUndefined();
      boss[STATS].hp = 190;
      advance(world, 5000);
      expect(towerMemory.queuedAttack).toBeUndefined();
      expect(
        world
          .getEntities([CASTABLE])
          .filter(
            (spell) => spell[CASTABLE].caster === world.getEntityId(tower)
          )
          .every(
            (spell) =>
              spell[CASTABLE].magic === 0 &&
              spell[CASTABLE].melee === 0 &&
              spell[CASTABLE].burn === 0
          )
      ).toBe(true);
    }
  );

  it("stops tower healing above 25 percent and resumes below it", () => {
    const { world, boss, room, memory } = startFight();
    const bossPattern = boss[BEHAVIOUR].patterns[0];
    memory.phase = "rage";
    boss[STATS].hp = 180;
    boss[BEHAVIOUR].patterns = [
      { name: "wait", memory: { ticks: 1000 } },
      bossPattern,
    ];
    const tower = createNpc(world, "wormTower", {
      x: room[POSITION].x + 7,
      y: room[POSITION].y + 2,
    });
    registerEntity(world, tower);
    const towerMemory = tower[BEHAVIOUR].patterns[0].memory;
    advanceUntil(world, () => !!towerMemory.heal);
    boss[STATS].hp = 190;
    advanceUntil(world, () => !towerMemory.heal);
    advance(world, 3000);
    expect(boss[STATS].hp).toBe(190);
    expect(
      world
        .getEntities([HOMING, CASTABLE])
        .filter(
          (disc) =>
            disc[CASTABLE].caster === world.getEntityId(tower) &&
            disc[HOMING].type === "healDisc"
        )
    ).toHaveLength(0);
    boss[STATS].hp = 170;
    advanceUntil(world, () => !!towerMemory.heal);
    expect(
      world.assertByIdAndComponents(towerMemory.heal, [CASTABLE])[CASTABLE].heal
    ).toBe(8);
  });

  it("routes low-health tower summons from neck through mouth to the upper ring", () => {
    const { world, boss, room, memory } = startFight();
    boss[STATS].hp = 187;
    advanceUntil(world, () => memory.rageStarted, 60000);
    boss[STATS].hp = 165;
    advanceUntil(world, () => memory.rageThreshold === 1);
    const disc = world
      .getEntities([HOMING, CASTABLE, POSITION])
      .find(
        (disc) =>
          disc[CASTABLE].caster === world.getEntityId(boss) &&
          disc[HOMING].type === "wormTower" &&
          disc[HOMING].positions.length === 2
      )!;
    expect(disc).toBeDefined();
    expect(disc[POSITION]).toEqual(memory.hole);
    expect(disc[HOMING].positions[0]).toEqual({
      x: boss[POSITION].x,
      y: boss[POSITION].y - 1,
    });
    expect(
      signedDistance(room[POSITION].y, disc[HOMING].positions[1].y, 40)
    ).toBeLessThan(0);
    const target = { ...disc[HOMING].positions[1] };
    advanceUntil(world, () => disc[HOMING].positions.length === 1);
    expect(disc[POSITION].x).toBe(boss[POSITION].x);
    advanceUntil(
      world,
      () =>
        getIdentifiersAndComponents(world, "worm:tower", [POSITION]).some(
          (tower) =>
            tower[POSITION].x === target.x && tower[POSITION].y === target.y
        ),
      20000
    );
  });

  it("chooses a different rage attack each time and returns sooner after a wave", () => {
    const { world, boss, memory } = startFight();
    boss[STATS].hp = 187;
    advanceUntil(world, () => memory.rageStarted, 60000);
    for (const previous of ["wave", "blasts", "slashes"]) {
      for (const sample of [0, 0.99]) {
        memory.previousRageAttack = previous;
        delete memory.rageAttack;
        memory.ticks = 0;
        const spy = jest.spyOn(Math, "random").mockReturnValue(sample);
        try {
          advanceUntil(world, () => !!memory.rageAttack);
        } finally {
          spy.mockRestore();
        }
        expect(memory.rageAttack).not.toBe(previous);
      }
    }
    memory.rageAttack = "wave";
    memory.ticks = 0;
    advanceUntil(world, () => memory.ticks === 24);
    const cast = world.metadata.gameEntity[RENDERABLE].generation;
    advanceUntil(world, () => !memory.rageAttack);
    expect(world.metadata.gameEntity[RENDERABLE].generation - cast).toBe(17);
  });
});

describe("fire chief worm quest", () => {
  it("points to the cave, rewards a worm kill, then focuses the letter delivery on the glacier guard", () => {
    const { world, hero, bait } = setup();
    const sign = world.assertComponents(getIdentifier(world, "worm_sign")!, [
      POSITION,
    ]);
    world.metadata.gameEntity[LEVEL].initialized[sign[POSITION].x][
      sign[POSITION].y
    ] = false;
    disposeEntity(world, sign);
    const chief = createNpc(world, "fireChief", {
      x: 18,
      y: 17,
    }) as TypedEntity<"POSITION">;
    registerEntity(world, chief);
    npcSequence(world, chief, "fireChiefNpc", {});
    const state = getSequence(world, chief, "npc")!;
    state.args.step = "worm";
    step(world, 2);
    expect(chief[POPUP]?.targets).toEqual([{ amount: 1, unit: "wormBoss" }]);
    expect(chief[POPUP]?.focuses[0].identifier).toBe("worm_sign");
    expect(chief[POPUP]?.deals).toContainEqual({
      item: { tool: "hammer", material: "wood", amount: 1 },
      stock: 1,
      prices: [],
    });
    expect(
      chief[POPUP]!.lines[0].every((line) => line.length <= frameWidth - 2)
    ).toBe(true);
    expect(chief[POPUP]!.lines[0].flat()).toContainEqual(
      getItemSprite({ stackable: "worm" }, "display")
    );
    moveEntity(world, hero, { x: 21, y: 17 });
    questSequence(world, hero, "waypointQuest", {
      ...chief[POPUP]!.focuses[0],
      distance: 2,
    });
    step(world, 2);
    expect(getIdentifier(world, "focus")?.[FOCUSABLE]?.pendingTarget).toBe(
      world.getEntityId(getIdentifier(world, "worm_sign")!)
    );
    expect(isQuestCompleted(world, hero, chief)).toBe(false);
    bait[STATS].hp = 0;
    advanceUntil(world, () => !!getIdentifier(world, "worm_boss"));
    world.assertComponents(getIdentifier(world, "worm_boss")!, [STATS])[
      STATS
    ].hp = 0;
    advanceUntil(world, () => isQuestCompleted(world, hero, chief));
    expect(
      world.assertComponents(hero, [PLAYER])[PLAYER].defeatedUnits.wormBoss
    ).toBe(1);
    completeQuest(world, hero, chief);
    const coins = world
      .assertComponents(hero, [INVENTORY])
      [INVENTORY].items.map(
        (id) => world.assertByIdAndComponents(id, [ITEM])[ITEM]
      )
      .filter((item) => item.stackable === "coin")
      .reduce((total, item) => total + item.amount, 0);
    expect(coins).toBe(75);
    expect(
      world
        .getEntities([ITEM])
        .some(
          (item) =>
            item[ITEM].carrier === world.getEntityId(hero) &&
            item[ITEM].tool === "hammer"
        )
    ).toBe(true);
    expect(
      world
        .getEntities([ITEM])
        .some(
          (item) =>
            item[ITEM].carrier === world.getEntityId(hero) &&
            item[ITEM].stackable === "letter" &&
            item[ITEM].amount === 1
        )
    ).toBe(true);
    const guard = createNpc(world, "waterGuard", { x: 28, y: 28 });
    registerEntity(world, guard);
    const existingBoat = createCell(world, { x: 14, y: 13 }, "boat", "visible");
    existingBoat.all.forEach((entity) => {
      if (entity[POSITION]) registerEntity(world, entity);
    });
    world.metadata.gameEntity[LEVEL].objects[12][13] = ["boat"];
    world.metadata.gameEntity[LEVEL].initialized[12][13] = false;
    removePopup(world, chief);
    step(world, 2);
    expect(state.args.step).toBe("boat");
    expect(
      chief[POPUP]!.lines[0].every((line) => line.length <= frameWidth - 2)
    ).toBe(true);
    expect(chief[POPUP]?.targets[0].identifier).toBe("waterGuard");
    expect(
      chief[POPUP]?.lines
        .flat(2)
        .map((sprite) => sprite.layers.map((layer) => layer.char).join(""))
        .join("")
    ).toContain("glacier");
    const boat = createCell(world, { x: 16, y: 13 }, "boat", "visible");
    boat.all.forEach((entity) => {
      if (entity[POSITION]) registerEntity(world, entity);
    });
    step(world, 2);
    expect(chief[POPUP]).toBeDefined();
    expect(isQuestCompleted(world, hero, chief)).toBe(false);
    questSequence(world, hero, "waypointQuest", {
      identifier: "waterGuard",
      highlight: "quest",
      distance: 2,
    });
    step(world, 2);
    expect(getIdentifier(world, "focus")?.[FOCUSABLE]?.pendingTarget).toBe(
      world.getEntityId(guard)
    );
    guard[FOG]!.visibility = "visible";
    expect(isQuestCompleted(world, hero, chief)).toBe(true);
    removePopup(world, chief);
    step(world, 2);
    expect(chief[POPUP]).toBeUndefined();
    boat.all
      .filter((entity) => entity[SPRITE])
      .forEach((entity) => disposeEntity(world, entity));
  });
});
