import { deserialize, serialize } from "v8";
import {
  advance,
  advanceUntil,
  assertHero,
  createAreaWorld,
  createTestWorld,
  step,
  walk,
} from "../testing/harness";
import { createSystems, preloadLevel } from "./ecs";
import { createSnapshot, restoreSnapshot, WorldSnapshot } from "./snapshot";
import { POSITION } from "./components/position";
import { SPRITE } from "./components/sprite";
import { SEQUENCABLE } from "./components/sequencable";
import { STATS } from "./components/stats";
import { LEVEL } from "./components/level";
import { getCellEntities, moveEntity, registerEntity } from "./systems/map";
import { World } from "./ecs";
import { entities } from ".";
import { createItemAsDrop, createItemInInventory } from "./systems/drop";
import { INVENTORY } from "./components/inventory";
import { ITEM } from "./components/item";
import { FOG } from "./components/fog";
import { createNpc } from "../bindings/creation";
import { getTraderDeal } from "../game/balancing/trading";
import { createPopup } from "./systems/popup";
import { CASTABLE } from "./components/castable";
import { REFERENCE } from "./components/reference";
import { RENDERABLE } from "./components/renderable";
import { castAs, createSpellWorld, getUnit } from "../features/spells/helpers";
import { none } from "../game/assets/sprites";

// IndexedDB stores values with the same structured clone algorithm
const store = (world: World) =>
  restoreSnapshot(
    deserialize(serialize(createSnapshot(world))) as WorldSnapshot
  );

const storeAndLoad = (world: World) => {
  const restored = store(world);
  createSystems(restored);
  preloadLevel(restored);
  return restored;
};

const getEntityIds = (world: World) =>
  world.getEntities([]).map((entity) => world.getEntityId(entity));

describe("world snapshot", () => {
  it("restores missing trader goods while preserving the existing stock and selected row", () => {
    const world = createAreaWorld("|♀     |");
    const sand = getTraderDeal({ stackable: "sand" }, 2);
    const apple = getTraderDeal({ stackable: "apple" }, 4);
    const trader = createNpc(world, "earthTrader", { x: 3, y: 0 });
    createPopup(world, trader, { tabs: ["buy", "sell"], deals: [sand, apple] });
    const id = world.getEntityId(trader);
    world.assertByIdAndComponents(id, ["POPUP"]).POPUP.verticalIndezes[0] = 1;
    const loaded = store(world);
    const popup = loaded.assertByIdAndComponents(id, ["POPUP"]).POPUP;
    expect(popup.deals).toEqual([apple, sand, getTraderDeal({ stackable: "gravel" })]);
    expect(popup.verticalIndezes[0]).toBe(0);
    expect(store(loaded).assertByIdAndComponents(id, ["POPUP"]).POPUP.deals).toEqual(popup.deals);
  });

  it("loads a retired bandit archer as a rogue", () => {
    const world = createAreaWorld("|♀|");
    const bandit = world.createEntity();
    world.addComponentToEntity(bandit, "NPC", { type: "banditRogue" });
    Object.assign(bandit.NPC!, { type: "banditArcher" });
    expect(store(world).assertById(world.getEntityId(bandit)).NPC?.type).toBe("banditRogue");
  });

  it("loads an island with a missing loot item and preserves its remaining items", () => {
    const world = createAreaWorld("| ♀       |", {
      size: 48,
      level: "LEVEL_ISLAND",
    });
    step(world, 30);
    const missing = createItemAsDrop(
      world,
      { x: 4, y: 0 },
      entities.createItem,
      {
        ITEM: { stat: "hp", amount: 1, bound: false },
        SPRITE: none,
      }
    );
    const carrier = world.assertByIdAndComponents(missing[ITEM].carrier, [
      INVENTORY,
      FOG,
      POSITION,
    ]);
    const carrierId = world.getEntityId(carrier);
    const valid = createItemInInventory(world, carrier, entities.createItem, {
      ITEM: { stackable: "apple", amount: 3 },
      SPRITE: none,
    });
    const validId = world.getEntityId(valid);
    carrier[FOG].visibility = "visible";
    registerEntity(world, carrier);
    world.removeEntity(missing);
    const snapshot = createSnapshot(world);
    const loaded = restoreSnapshot(snapshot);
    createSystems(loaded);
    preloadLevel(loaded);
    expect(loaded.metadata.gameEntity[LEVEL].name).toBe("LEVEL_ISLAND");
    expect(
      loaded.assertByIdAndComponents(carrierId, [INVENTORY])[INVENTORY].items
    ).toEqual([validId]);
    expect(loaded.assertByIdAndComponents(validId, [ITEM])[ITEM].amount).toBe(
      3
    );
    walk(loaded, "right");
    expect(assertHero(loaded)[POSITION]).toEqual({ x: 2, y: 0 });
  });

  it("arms an older unplaced trap on all sides when its caster moves", () => {
    const area = "|  ♀   D|";
    const { world, hero } = createSpellWorld(area, undefined, { size: 32 });
    const target = getUnit(world, area, "D");
    if (target.BEHAVIOUR) target.BEHAVIOUR.patterns = [];
    const spell = castAs(
      world,
      hero,
      { spell: "trap", material: "wood" },
      "right"
    );
    const args = spell[SEQUENCABLE].states.aura!.args;
    Reflect.deleteProperty(args, "delay");
    args.range = 0;
    const loaded = storeAndLoad(world);
    const victim = loaded.assertByIdAndComponents(world.getEntityId(target), [
      POSITION,
      STATS,
    ]);
    moveEntity(loaded, victim, { x: 3, y: 1 });
    const hp = victim[STATS].hp;
    advance(loaded, 600);
    expect(victim[STATS].hp).toBe(hp);
    moveEntity(loaded, assertHero(loaded), { x: 12, y: 0 });
    advanceUntil(loaded, () => victim[STATS].hp < hp, 1500);
  });

  it.each([250, 750])(
    "resumes a saved trap %i ms into its warning and burst",
    (elapsed) => {
      const area = "|  ♀   D|";
      const { world, hero } = createSpellWorld(area, undefined, { size: 32 });
      const target = getUnit(world, area, "D");
      const spell = castAs(
        world,
        hero,
        { spell: "trap", material: "wood" },
        "right"
      );
      const aura = spell[SEQUENCABLE].states.aura!;
      moveEntity(world, hero, { x: 12, y: 0 });
      moveEntity(world, target, { x: 3, y: 0 });
      if (target.BEHAVIOUR) target.BEHAVIOUR.patterns = [];
      const hp = target[STATS].hp;
      if (elapsed < 500) {
        advanceUntil(world, () => !!aura.particles.warning);
      } else {
        advanceUntil(world, () => target[STATS].hp < hp);
      }
      const savedHp = target[STATS].hp;

      // This is the saved clock format before traps shared their aura reference.
      const frame = entities.createFrame(world, {
        [REFERENCE]: {
          tick: 500,
          delta: 250,
          suspended: false,
          suspensionCounter: -1,
        },
        [RENDERABLE]: { generation: elapsed < 500 ? 1 : 2 },
      });
      Object.assign(spell[CASTABLE], {
        trigger: {
          delay: 500,
          duration: 500,
          frame: world.getEntityId(frame),
        },
      });
      delete aura.args.memory;
      Reflect.deleteProperty(aura.args, "delay");
      aura.args.range = 0;
      const oldClock = world.assertByIdAndComponents(aura.reference, [
        REFERENCE,
      ])[REFERENCE];
      oldClock.tick = -1;
      oldClock.delta = 0;
      const loaded = storeAndLoad(world);
      const victim = loaded.assertByIdAndComponents(world.getEntityId(target), [
        STATS,
      ]);
      const trapId = world.getEntityId(spell);
      advance(loaded, 200);
      expect(victim[STATS].hp).toBe(savedHp);
      expect(loaded.getEntityById(trapId)).toBeDefined();
      advance(loaded, 100);
      expect(victim[STATS].hp).toBe(hp - spell[CASTABLE].magic);
      expect(!!loaded.getEntityById(trapId)).toBe(elapsed < 500);
      advance(loaded, 600);
      expect(loaded.getEntityById(trapId)).toBeUndefined();
    }
  );

  it("restores all entities with their IDs and level", () => {
    const world = createTestWorld();
    walk(world, "down", 2);

    const restored = store(world);

    expect(getEntityIds(restored)).toEqual(getEntityIds(world));
    expect(restored.metadata.gameEntity[LEVEL].name).toBe("LEVEL_MENU");
    expect(restored.metadata.playtime).toBe(world.metadata.playtime);
    expect(assertHero(restored)[POSITION]).toEqual(assertHero(world)[POSITION]);
    expect(assertHero(restored)[STATS]).toEqual(assertHero(world)[STATS]);
  });

  it("keeps sprite identity and map references", () => {
    const world = createTestWorld();
    const restored = storeAndLoad(world);
    const hero = assertHero(restored);

    const emptySprites = (target: World) =>
      target.getEntities([SPRITE]).filter((entity) => entity[SPRITE] === none)
        .length;
    expect(emptySprites(restored)).toBe(emptySprites(world));
    expect(emptySprites(restored)).toBeGreaterThan(0);
    expect(getCellEntities(restored, hero[POSITION])).toContain(hero);
  });

  it("keeps values that JSON can't store", () => {
    const restored = store(createTestWorld());
    const weather = restored
      .getEntities([SEQUENCABLE])
      .map((entity) => entity[SEQUENCABLE].states.weather)
      .find(Boolean);

    expect(weather?.args.end).toBe(Infinity);
  });

  it("keeps playing after loading", () => {
    const world = createTestWorld();
    step(world, 30);
    const restored = storeAndLoad(world);
    const { x, y } = assertHero(restored)[POSITION];

    walk(restored, "down", 2);

    expect(assertHero(restored)[POSITION]).toEqual({ x, y: y + 2 });
  });
});
