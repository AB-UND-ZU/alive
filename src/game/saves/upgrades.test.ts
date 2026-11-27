import { upgradeTestSave } from "../../testing/saves";
import { createSave, restoreSavedWorld } from ".";
import { TOOLTIP } from "../../engine/components/tooltip";
import { waveTower } from "../assets/templates/creatures";
import { snowCover } from "../assets/sprites";
import { rage2, parseSprite } from "../assets/ui";
import { resolveSprite, spriteRef } from "../assets/spriteIds";
import { deserialize, serialize } from "v8";
import {
  advance,
  advanceUntil,
  assertHero,
  createAreaWorld,
  createTestWorld,
  step,
  walk,
} from "../../testing/harness";
import { createSystems, preloadLevel } from "../../engine/ecs";
import { createSnapshot, restoreSnapshot } from "../../engine/snapshot";
import { POSITION } from "../../engine/components/position";
import { SPRITE } from "../../engine/components/sprite";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { STATS } from "../../engine/components/stats";
import { LEVEL } from "../../engine/components/level";
import { moveEntity, registerEntity } from "../../engine/systems/map";
import { World } from "../../engine/ecs";
import { entities } from "../../engine";
import {
  createItemAsDrop,
  createItemInInventory,
} from "../../engine/systems/drop";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { FOG } from "../../engine/components/fog";
import { createNpc } from "../../bindings/creation";
import { getTraderDeal } from "../balancing/trading";
import { createPopup } from "../../engine/systems/popup";
import { CASTABLE } from "../../engine/components/castable";
import { REFERENCE } from "../../engine/components/reference";
import { RENDERABLE } from "../../engine/components/renderable";
import {
  castAs,
  createSpellWorld,
  getUnit,
} from "../../features/spells/helpers";
import { none } from "../assets/sprites";

// IndexedDB stores values with the same structured clone algorithm
const load = (world: World, snapshot = createSnapshot(world)) =>
  restoreSavedWorld(upgradeTestSave({
    ...createSave(world, undefined, snapshot),
    version: "0.8.0",
  }));

const store = (world: World) =>
  load(world, deserialize(serialize(createSnapshot(world))));

const storeAndLoad = (world: World) => {
  const restored = store(world);
  createSystems(restored);
  preloadLevel(restored);
  return restored;
};

describe("legacy save upgrades", () => {
  it("only converts the old movement modifier when upgrading a save", () => {
    const world = createAreaWorld("|♀|");
    const terrain = world.createEntity();
    world.addComponentToEntity(terrain, "TEMPO", { amount: -2 });
    const id = world.getEntityId(terrain);
    const current = createSave(world);
    const legacy = { ...current, version: "0.8.0" };

    expect(restoreSnapshot(current.snapshot).assertById(id).TEMPO?.amount).toBe(
      -2
    );
    expect(restoreSavedWorld(current).assertById(id).TEMPO?.amount).toBe(-2);
    expect(restoreSavedWorld(upgradeTestSave(legacy)).assertById(id).TEMPO?.amount).toBe(-4);
  });

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
    expect(popup.deals).toEqual([
      apple,
      sand,
      getTraderDeal({ stackable: "gravel" }),
    ]);
    expect(popup.verticalIndezes[0]).toBe(0);
    expect(
      restoreSavedWorld(createSave(loaded)).assertByIdAndComponents(id, [
        "POPUP",
      ]).POPUP.deals
    ).toEqual(popup.deals);
  });

  it("loads a retired bandit archer as a rogue", () => {
    const world = createAreaWorld("|♀|");
    const bandit = world.createEntity();
    world.addComponentToEntity(bandit, "NPC", { type: "banditRogue" });
    Object.assign(bandit.NPC!, { type: "banditArcher" });
    expect(store(world).assertById(world.getEntityId(bandit)).NPC?.type).toBe(
      "banditRogue"
    );
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
    const loaded = load(world, snapshot);
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

  it("stores compact sprite references and restores old tokens and inline artwork", () => {
    const world = createTestWorld();
    const hero = assertHero(world);
    world.assertComponents(hero, [SPRITE])[SPRITE] = spriteRef(none);
    const snapshot = createSnapshot(world);
    const components = snapshot.entities.find(
      ([id]) => id === world.getEntityId(hero)
    )![1];
    expect(components.SPRITE).toEqual({ id: none.id });

    components.SPRITE = { $sprite: "snowCover" };
    const { id, ...inline } = rage2;
    components.TOOLTIP = {
      idle: {
        ...inline,
        facing: {
          up: inline.layers,
          right: inline.layers,
          down: inline.layers,
          left: inline.layers,
        },
        amounts: {
          single: inline.layers,
          double: inline.layers,
          multiple: inline.layers,
        },
      },
      dialogs: [],
    };
    const loaded = load(world, snapshot);
    const restored = loaded.assertByIdAndComponents(world.getEntityId(hero), [
      SPRITE,
      TOOLTIP,
    ]);
    expect(restored[SPRITE]).toEqual({ id: snowCover.id });
    expect(restored[TOOLTIP].idle?.id).toBe(id);

    const custom = parseSprite("\x02a\x0fb");
    restored[SPRITE] = spriteRef(custom);
    const reloaded = restoreSavedWorld(
      createSave(loaded)
    ).assertByIdAndComponents(world.getEntityId(hero), [SPRITE]);
    expect(reloaded[SPRITE]).toEqual({ id: custom.id, custom: true });
    expect(resolveSprite(reloaded[SPRITE]).layers).toEqual(custom.layers);
  });

  it("restores an uncharged chest tower from pre-ID artwork", () => {
    const world = createAreaWorld("|♀ |");
    const tower = world.createEntity();
    world.addComponentToEntity(tower, SPRITE, waveTower.iron.default);
    const id = world.getEntityId(tower);
    const snapshot = createSnapshot(world);
    const components = snapshot.entities.find(
      ([entityId]) => entityId === id
    )![1];
    const { name, layers } = waveTower.iron.default;
    components.SPRITE = { name, layers };
    expect(
      load(world, snapshot).assertByIdAndComponents(id, [SPRITE])[SPRITE]
    ).toEqual({ id: waveTower.iron.default.id });
  });
});
