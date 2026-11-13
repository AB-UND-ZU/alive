import { World, entities } from "../../engine";
import { AFFECTABLE } from "../../engine/components/affectable";
import { BURNABLE } from "../../engine/components/burnable";
import { CASTABLE } from "../../engine/components/castable";
import { EXERTABLE } from "../../engine/components/exertable";
import { FRAGMENT } from "../../engine/components/fragment";
import { materials } from "../../engine/components/item";
import { PARTICLE } from "../../engine/components/particle";
import { Position, POSITION } from "../../engine/components/position";
import { REFERENCE } from "../../engine/components/reference";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { STATS } from "../../engine/components/stats";
import { SPRITE } from "../../engine/components/sprite";
import { TypedEntity } from "../../engine/entities";
import { getMotion, sampleMotion } from "../../engine/motion";
import {
  disposeEntity,
  moveEntity,
  registerEntity,
} from "../../engine/systems/map";
import { getTriggerElapsed } from "../../engine/systems/magic";
import { createBubble } from "../../engine/systems/water";
import { createCell } from "../../bindings/creation";
import { rain, warnOn, warnOff } from "../../game/assets/sprites";
import { getAbilityStats } from "../../game/balancing/abilities";
import { combine } from "../../game/math/std";
import { playedSounds } from "../../testing/env";
import { advance, FRAME, step, walk } from "../../testing/harness";
import {
  cast,
  createArea,
  createSpellWorld,
  getUnit,
  isCasting,
  recordHits,
  SpellItem,
} from "./helpers";

const trap = { spell: "trap", material: "wood" } as const;
const earthTrap = { ...trap, element: "earth" } as const;

type TrapEntity = TypedEntity<"CASTABLE" | "POSITION" | "SEQUENCABLE">;

const getTrapAreas = (world: World, spell: TrapEntity) =>
  world
    .getEntities([EXERTABLE, POSITION])
    .filter((area) => area[EXERTABLE].castable === world.getEntityId(spell))
    .map((area) => area[POSITION]);

const setup = (item: SpellItem = trap) => {
  const area = createArea(11, 11, {
    "♀": { x: 5, y: 5 },
    D: { x: 1, y: 1 },
    E: { x: 2, y: 1 },
    L: { x: 3, y: 1 },
    N: { x: 1, y: 2 },
    A: { x: 2, y: 2 },
  });
  const { world, hero } = createSpellWorld(area, item, {
    size: 32,
    legend: { E: "dummy", L: "dummy", N: "guide", A: "guide" },
  });
  const enemies = ["D", "E", "L"].map((char) => getUnit(world, area, char));
  const allies = ["N", "A"].map((char) => getUnit(world, area, char));
  for (const unit of [...enemies, ...allies]) {
    unit[STATS].maxHp = 99;
    unit[STATS].hp = 99;
    if (unit.BEHAVIOUR) unit.BEHAVIOUR.patterns = [];
  }
  cast(world, "down");
  const spell = world
    .getEntities([CASTABLE, POSITION, SEQUENCABLE])
    .find((entity) => entity[SEQUENCABLE].states.aura?.name === "trapAura");
  if (!spell) throw new Error("Trap was not cast");
  const center = { ...spell[POSITION] };
  const state = spell[SEQUENCABLE].states.aura!;
  const startedAt = world.metadata.elapsed - state.elapsed;
  const arm = () => {
    moveEntity(world, hero, { x: center.x, y: center.y + 3 });
    step(world);
  };
  return { world, hero, spell, center, enemies, allies, startedAt, arm };
};

const advanceTo = (world: World, time: number) => {
  while (world.metadata.elapsed + FRAME < time) step(world);
  const remaining = time - world.metadata.elapsed;
  if (remaining > 0) world.update(remaining);
};

const advanceTriggerTo = (world: World, spell: TrapEntity, time: number) => {
  const trigger = spell[CASTABLE].trigger;
  if (!trigger?.frame) throw new Error("Trap has not triggered");
  while (getTriggerElapsed(world, trigger) + FRAME < time) step(world);
  const remaining = time - getTriggerElapsed(world, trigger);
  if (remaining > 0) world.update(remaining);
};

describe("trap spell", () => {
  it("arms all nine cells only after its caster leaves the cast cell", () => {
    const { world, hero, spell, center } = setup();
    step(world, 10);
    expect(getTrapAreas(world, spell)).toEqual([]);

    walk(world, "down", 1);
    step(world);
    expect(hero[POSITION]).toEqual({ x: center.x, y: center.y + 1 });
    const expected: Position[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        expected.push({ x: center.x + x, y: center.y + y });
      }
    }
    expect(getTrapAreas(world, spell)).toHaveLength(9);
    expect(getTrapAreas(world, spell)).toEqual(
      expect.arrayContaining(expected)
    );
  });

  it.each([
    { x: 1, y: 0 },
    { x: -1, y: -1 },
  ])(
    "detects a hostile in the neighboring cell %j and warns before damage",
    (offset) => {
      const { world, spell, center, enemies, arm } = setup();
      const [enemy] = enemies;
      arm();
      moveEntity(world, enemy, {
        x: center.x + offset.x,
        y: center.y + offset.y,
      });
      step(world);

      advanceTriggerTo(world, spell, 499);
      expect(enemy[STATS].hp).toBe(99);
      advanceTriggerTo(world, spell, 500);
      expect(enemy[STATS].hp).toBe(99 - getAbilityStats(trap).magic);
    }
  );

  it.each([
    { distance: 3, beeps: 1 },
    { distance: 12, beeps: 0 },
  ])(
    "sounds each visible warning pulse once at distance $distance",
    ({ distance, beeps }) => {
      const { world, hero, spell, center, enemies, arm } = setup();
      const warningSounds = () =>
        playedSounds.filter((sound) => sound === "prompt");
      arm();
      moveEntity(world, hero, { x: center.x, y: center.y + distance });
      advance(world, 300);
      expect(warningSounds()).toEqual([]);
      moveEntity(world, enemies[0], center);
      step(world);
      const warning = world.assertByIdAndComponents(
        spell[SEQUENCABLE].states.aura!.particles.warning,
        [SPRITE]
      );
      expect(warning[SPRITE]).toBe(warnOn);
      expect(warningSounds()).toHaveLength(beeps);
      advanceTriggerTo(world, spell, 99);
      expect(warningSounds()).toHaveLength(beeps);
      advanceTriggerTo(world, spell, 100);
      expect(warning[SPRITE]).toBe(warnOff);
      expect(warningSounds()).toHaveLength(beeps);
      advanceTriggerTo(world, spell, 101);
      expect(warningSounds()).toHaveLength(beeps);
      advanceTriggerTo(world, spell, 200);
      expect(warning[SPRITE]).toBe(warnOn);
      expect(warningSounds()).toHaveLength(beeps * 2);
      advanceTriggerTo(world, spell, 499);
      expect(warningSounds()).toHaveLength(beeps * 3);
      advanceTriggerTo(world, spell, 500);
      advance(world, 1000);
      expect(warningSounds()).toHaveLength(beeps * 3);
    }
  );

  it("hits each hostile once across the full area, including later arrivals", () => {
    const { world, hero, spell, center, enemies, arm } = setup();
    const [first, second, late] = enemies;
    arm();
    moveEntity(world, first, { x: center.x - 1, y: center.y });
    moveEntity(world, second, { x: center.x + 1, y: center.y + 1 });
    step(world);

    const frame = spell[CASTABLE].trigger!.frame!;
    advanceTriggerTo(world, spell, 500);
    const damage = getAbilityStats(trap).magic;
    expect(enemies.map((enemy) => enemy[STATS].hp)).toEqual([
      99 - damage,
      99 - damage,
      99,
    ]);
    moveEntity(world, first, center);
    moveEntity(world, late, { x: center.x, y: center.y - 1 });
    expect(recordHits(world, [first, second, late], 5)).toEqual([
      [],
      [],
      [damage],
    ]);
    advanceTriggerTo(world, spell, 999);
    expect(getTrapAreas(world, spell)).toHaveLength(9);
    advanceTriggerTo(world, spell, 1000);
    step(world);
    expect(getTrapAreas(world, spell)).toEqual([]);
    expect(isCasting(world, hero)).toBe(false);
    expect(world.getEntityById(frame)).toBeUndefined();
    expect(recordHits(world, enemies, 40)).toEqual([[], [], []]);
    expect(playedSounds.filter((sound) => sound === "trap")).toHaveLength(2);
  });

  it("implodes a complete outer border during its half-second burst", () => {
    const { world, spell, center, enemies, arm } = setup();
    arm();
    moveEntity(world, enemies[0], center);
    step(world);
    const state = spell[SEQUENCABLE].states.aura!;
    const particles = () =>
      Object.values(state.particles).map((id) =>
        world.assertByIdAndComponents(id, [PARTICLE, SPRITE])
      );

    advanceTriggerTo(world, spell, 499);
    expect(state.particles.warning).toBeDefined();
    const warning = Object.values(state.particles);
    advanceTriggerTo(world, spell, 500);
    for (const id of warning) expect(world.getEntityById(id)).toBeUndefined();
    const border = particles();
    expect(border.map((entity) => entity[PARTICLE].animatedOrigin)).toEqual([
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: -1, y: 1 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
    ]);
    expect(border.map((entity) => entity[SPRITE].layers[0].char)).toEqual([
      "─",
      "┐",
      "│",
      "┘",
      "─",
      "└",
      "│",
      "┌",
    ]);
    for (const entity of border) {
      expect(entity[PARTICLE].offsetX).toBe(0);
      expect(entity[PARTICLE].offsetY).toBe(0);
      expect(entity[PARTICLE].duration).toBe(500);
      const motion = getMotion(entity)!;
      expect(sampleMotion(motion, world.metadata.elapsed)).toMatchObject(
        entity[PARTICLE].animatedOrigin!
      );
    }

    advanceTriggerTo(world, spell, 750);
    expect(particles()).toEqual(border);
    for (const entity of border) {
      const position = sampleMotion(getMotion(entity)!, world.metadata.elapsed);
      expect(position.x).toBeCloseTo(entity[PARTICLE].animatedOrigin!.x / 2, 8);
      expect(position.y).toBeCloseTo(entity[PARTICLE].animatedOrigin!.y / 2, 8);
    }
    advanceTriggerTo(world, spell, 999);
    expect(particles()).toHaveLength(8);
    advanceTriggerTo(world, spell, 1000);
    expect(particles()).toEqual([]);
    expect(getTrapAreas(world, spell)).toEqual([]);
  });

  it("cleans up its timer and areas when a triggered trap is removed", () => {
    const { world, spell, center, enemies, arm } = setup();
    arm();
    moveEntity(world, enemies[0], center);
    step(world);
    const frame = spell[CASTABLE].trigger?.frame;
    expect(frame).toBeDefined();
    disposeEntity(world, spell);
    step(world);
    expect(world.getEntityById(frame!)).toBeUndefined();
    expect(getTrapAreas(world, spell)).toEqual([]);
    advance(world, 2000);
    expect(enemies[0][STATS].hp).toBe(99);
  });

  it("does not hit a new arrival at the end of its half-second active window", () => {
    const { world, spell, center, enemies, arm } = setup();
    const [first, late] = enemies;
    arm();
    moveEntity(world, first, center);
    step(world);

    advanceTriggerTo(world, spell, 999);
    moveEntity(world, late, { x: center.x + 1, y: center.y });
    advanceTriggerTo(world, spell, 1000);
    expect(late[STATS].hp).toBe(99);
  });

  it("ignores its caster and friendly units when it cannot heal", () => {
    const { world, hero, spell, center, allies, arm } = setup();
    arm();
    moveEntity(world, hero, center);
    moveEntity(world, allies[0], { x: center.x + 1, y: center.y });
    advance(world, 1000);
    expect(spell[CASTABLE].trigger?.frame).toBeUndefined();
    expect(getTrapAreas(world, spell)).toHaveLength(9);
    expect(allies[0][STATS].hp).toBe(99);
  });

  it("requires an injured friendly unit at the center to trigger Earth healing", () => {
    const { world, spell, center, allies, arm } = setup(earthTrap);
    const [ally] = allies;
    ally[STATS].hp = 10;
    arm();
    moveEntity(world, ally, { x: center.x - 1, y: center.y - 1 });
    advance(world, 700);
    expect(spell[CASTABLE].trigger?.frame).toBeUndefined();
    expect(ally[STATS].hp).toBe(10);
    moveEntity(world, ally, center);
    step(world);

    advanceTriggerTo(world, spell, 499);
    expect(ally[STATS].hp).toBe(10);
    advanceTriggerTo(world, spell, 500);
    expect(ally[STATS].hp).toBe(10 + getAbilityStats(earthTrap).heal);
  });

  it("does not spend an Earth trap on a full-health friendly unit", () => {
    const { world, spell, center, allies, arm } = setup(earthTrap);
    arm();
    moveEntity(world, allies[0], center);
    advance(world, 700);
    expect(spell[CASTABLE].trigger?.frame).toBeUndefined();
    expect(getTrapAreas(world, spell)).toHaveLength(9);
  });

  it.each([
    { material: "wood", damage: 4 },
    { material: "iron", damage: 8 },
    { material: "gold", damage: 12 },
    { material: "diamond", damage: 16 },
    { material: "ruby", damage: 20 },
  ] as const)(
    "heals 3 HP and deals $damage damage with a $material Earth trap",
    ({ material, damage }) => {
      const { world, spell, center, enemies, allies, arm } = setup({
        ...earthTrap,
        material,
      });
      const [first, second] = enemies;
      for (const ally of allies) ally[STATS].hp = 10;
      arm();
      moveEntity(world, allies[0], { x: center.x - 1, y: center.y });
      moveEntity(world, allies[1], { x: center.x + 1, y: center.y + 1 });
      moveEntity(world, first, { x: center.x + 1, y: center.y - 1 });
      moveEntity(world, second, center);
      step(world);

      advanceTriggerTo(world, spell, 499);
      expect(allies.map((ally) => ally[STATS].hp)).toEqual([10, 10]);
      expect([first, second].map((enemy) => enemy[STATS].hp)).toEqual([99, 99]);
      advanceTriggerTo(world, spell, 500);
      expect(allies.map((ally) => ally[STATS].hp)).toEqual([13, 13]);
      expect([first, second].map((enemy) => enemy[STATS].hp)).toEqual([
        99 - damage,
        99 - damage,
      ]);
      advance(world, 900);
      expect(allies.map((ally) => ally[STATS].hp)).toEqual([13, 13]);
    }
  );

  it("does not apply fire procs or ignite ground during the warning", () => {
    const item = { ...trap, element: "fire" } as const;
    const { world, spell, center, enemies, arm } = setup(item);
    const grass = createCell(
      world,
      { x: center.x - 1, y: center.y },
      "grass",
      "visible"
    ).cell;
    registerEntity(world, grass);
    const [enemy] = enemies;
    arm();
    moveEntity(world, enemy, center);
    step(world);

    advanceTriggerTo(world, spell, 499);
    expect(enemy[AFFECTABLE]?.burn).toBe(0);
    expect(grass[BURNABLE]?.burning).toBe(false);
    advanceTriggerTo(world, spell, 500);
    expect(enemy[AFFECTABLE]?.burn).toBe(getAbilityStats(item).burn);
    expect(grass[BURNABLE]?.burning).toBe(true);
  });

  it("ignores falling rain particles and their ground splashes", () => {
    const { world, spell, center, arm } = setup();
    arm();
    entities.createParticle(world, {
      [PARTICLE]: { offsetX: center.x, offsetY: center.y, offsetZ: 7 },
      RENDERABLE: { generation: 0 },
      SPRITE: rain,
    });
    createBubble(world, center, "rain", false);
    advance(world, 1000);
    expect(spell[CASTABLE].trigger?.frame).toBeUndefined();
    expect(getTrapAreas(world, spell)).toHaveLength(9);
  });

  it("keeps an untriggered trap for one hundred world ticks", () => {
    const { world, hero, spell, startedAt, arm } = setup();
    const { duration } = getAbilityStats(trap);
    const tick = world.metadata.gameEntity[REFERENCE].tick;
    expect(duration).toBe(100);
    arm();
    advanceTo(world, startedAt + 51 * tick);
    expect(getTrapAreas(world, spell)).toHaveLength(9);
    advanceTo(world, startedAt + duration * tick - FRAME);
    expect(getTrapAreas(world, spell)).toHaveLength(9);
    advanceTo(world, startedAt + duration * tick + FRAME);
    expect(getTrapAreas(world, spell)).toEqual([]);
    expect(isCasting(world, hero)).toBe(false);
  });

  it("finishes its warning and burst when triggered just before expiry", () => {
    const { world, hero, spell, center, enemies, startedAt, arm } = setup();
    const tick = world.metadata.gameEntity[REFERENCE].tick;
    const { duration, magic } = getAbilityStats(trap);
    arm();
    advanceTo(world, startedAt + duration * tick - 200);
    moveEntity(world, enemies[0], center);
    step(world);

    advanceTriggerTo(world, spell, 500);
    expect(enemies[0][STATS].hp).toBe(99 - magic);
    advanceTriggerTo(world, spell, 999);
    expect(getTrapAreas(world, spell)).toHaveLength(9);
    advanceTriggerTo(world, spell, 1000);
    step(world);
    expect(getTrapAreas(world, spell)).toEqual([]);
    expect(isCasting(world, hero)).toBe(false);
  });

  it("wraps its full area across the level boundary", () => {
    const { world, hero } = createSpellWorld("|♀|", trap, { size: 32 });
    cast(world, "right");
    const spell = world
      .getEntities([CASTABLE, POSITION, SEQUENCABLE])
      .find((entity) => entity[SEQUENCABLE].states.aura?.name === "trapAura")!;
    moveEntity(world, hero, { x: 3, y: 0 });
    step(world);
    const expected: Position[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        expected.push(combine(32, { x: 0, y: 0 }, { x, y }));
      }
    }
    expect(getTrapAreas(world, spell)).toHaveLength(9);
    expect(getTrapAreas(world, spell)).toEqual(
      expect.arrayContaining(expected)
    );
  });

  it.each([1, 2])(
    "can hit a Golem through its covered cells at offset %s only once",
    (offset) => {
      const { world, hero, spell, center, arm } = setup();
      arm();
      const created = createCell(
        world,
        { x: center.x + offset, y: center.y },
        "golem",
        "visible"
      );
      for (const entity of created.all) {
        if (POSITION in entity) registerEntity(world, entity);
      }
      const boss = world.assertComponents(created.cell, [STATS, POSITION]);
      if (boss.BEHAVIOUR) boss.BEHAVIOUR.patterns = [];
      for (const entity of created.all) {
        if (entity[STATS]) {
          entity[STATS].hp = entity[STATS].maxHp = 99;
          entity[STATS].resist = 0;
          entity[STATS].armor = 0;
        }
      }
      const bossId = world.getEntityId(boss);
      expect(
        created.all.filter(
          (entity) => entity[FRAGMENT]?.structure === bossId && entity[POSITION]
        ).length
      ).toBeGreaterThan(1);
      step(world);

      advanceTriggerTo(world, spell, 500);
      expect(boss[STATS].hp).toBe(99 - getAbilityStats(trap).magic);
      expect(spell[CASTABLE].affected[bossId]).toBeDefined();
      expect(recordHits(world, [boss], 28)).toEqual([[]]);
      expect(hero[STATS].hp).toBeGreaterThan(0);
    }
  );

  it.each(materials)("deals the damage of a %s trap", (material) => {
    const item = { spell: "trap", material } as const;
    const { world, spell, center, enemies, arm } = setup(item);
    arm();
    moveEntity(world, enemies[0], center);
    step(world);

    advanceTriggerTo(world, spell, 500);
    expect(enemies[0][STATS].hp).toBe(99 - getAbilityStats(item).magic);
  });
});
