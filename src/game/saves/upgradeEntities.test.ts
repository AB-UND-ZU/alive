import { createNpc, populateItems } from "../../bindings/creation";
import { createSystems, preloadLevel, World } from "../../engine/ecs";
import { restoreUpgradedSave } from "../../testing/saves";
import { createSave } from ".";
import { moveEntity } from "../../engine/systems/map";
import { getUnit, setupHero } from "../../features/skills/helpers";
import {
  act,
  advance,
  advanceUntil,
  assertHero,
  createAreaWorld,
  face,
  getItems,
} from "../../testing/harness";
import { getItemSprite } from "../assets/utils";

function migrate(world: World) {
  return restoreUpgradedSave({ ...createSave(world), version: "0.8.0" });
}

it("updates only the legacy NPC defaults and keeps wounds, loot and spent supplies", () => {
  const world = createAreaWorld("|♀         |");
  const knight = createNpc(world, "banditKnight", { x: 3, y: 0 });
  const knightId = world.getEntityId(knight);
  const skill = world.assertByIdAndComponents(knight.EQUIPPABLE.skill, [
    "ITEM",
  ]);
  skill.ITEM.material = "iron";
  Object.assign(knight.STATS, { hp: 33, maxHp: 40, armor: 1 });
  const potion = knight.INVENTORY.items.find((id) => {
    const item = world.assertByIdAndComponents(id, ["ITEM"]).ITEM;
    return item.consume === "potion" && item.bound;
  })!;
  knight.INVENTORY.items = knight.INVENTORY.items.filter((id) => id !== potion);
  world.removeEntity(world.assertById(potion), false);

  const priest = createNpc(world, "banditPriest", { x: 4, y: 0 });
  const supply = priest.INVENTORY.items.find((id) => {
    const item = world.assertByIdAndComponents(id, ["ITEM"]).ITEM;
    return item.consume === "potion" && item.bound;
  })!;
  world.assertByIdAndComponents(supply, ["ITEM"]).ITEM.amount = 3;
  const mage = createNpc(world, "banditMage", { x: 5, y: 0 });
  Object.assign(mage.STATS, { hp: 0, maxHp: 40 });
  const nomad = createNpc(world, "fireNomad", { x: 6, y: 0 });
  Object.assign(nomad.STATS, { hp: 40, maxHp: 50 });
  const guard = createNpc(world, "waterGuard", { x: 7, y: 0 });
  const guardPotion = guard.INVENTORY.items.find(
    (id) =>
      world.assertByIdAndComponents(id, ["ITEM"]).ITEM.consume === "potion"
  )!;
  guard.INVENTORY.items = guard.INVENTORY.items.filter(
    (id) => id !== guardPotion
  );
  world.removeEntity(world.assertById(guardPotion), false);
  for (const id of [guard.EQUIPPABLE.weapon, guard.EQUIPPABLE.offhand]) {
    world.assertByIdAndComponents(id, ["ITEM"]).ITEM.material = "iron";
  }

  const saved = migrate(world);
  expect(
    getItems(saved, saved.assertById(world.getEntityId(guard)))
  ).toContainEqual(
    expect.objectContaining({
      consume: "potion",
      material: "gold",
      amount: Infinity,
      bound: true,
    })
  );
  const leveled = saved.assertById(knightId);
  expect(leveled.STATS).toMatchObject({ hp: 53, maxHp: 60, armor: 2 });
  expect(leveled.EQUIPPABLE.skill).toBe(knight.EQUIPPABLE.skill);
  expect(
    saved.assertByIdAndComponents(leveled.EQUIPPABLE.skill, ["SPRITE"]).SPRITE
      .id
  ).toBe(getItemSprite({ skill: "slash", material: "wood" }, "resource").id);
  const potions = getItems(saved, leveled).filter(
    (item) => item.consume === "potion"
  );
  expect(potions).toEqual([
    expect.objectContaining({ bound: false, amount: 1 }),
    expect.objectContaining({ bound: true, amount: 10 }),
  ]);
  expect(saved.assertByIdAndComponents(supply, ["ITEM"]).ITEM.amount).toBe(3);
  expect(saved.assertById(world.getEntityId(mage)).STATS.hp).toBe(0);
  expect(saved.assertById(world.getEntityId(nomad)).STATS).toMatchObject({
    hp: 65,
    maxHp: 75,
  });
  expect(
    saved.assertByIdAndComponents(guard.EQUIPPABLE.weapon, ["ITEM"]).ITEM
      .material
  ).toBe("gold");
  expect(
    saved.assertByIdAndComponents(guard.EQUIPPABLE.offhand, ["ITEM"]).ITEM
      .material
  ).toBe("diamond");
});

it("converts a bow-only archer, its queued AI actions, map cell and defeat counter", () => {
  const world = createAreaWorld("|♀    |");
  const archer = createNpc(world, "banditRogue", { x: 3, y: 0 });
  for (const id of archer.INVENTORY.items)
    world.removeEntity(world.assertById(id), false);
  archer.INVENTORY.items = [];
  archer.EQUIPPABLE = {};
  const [bow] = populateItems(world, archer, [
    { skill: "bow", material: "wood", amount: 1, bound: true },
  ]);
  Object.assign(archer.NPC, { type: "banditArcher" });
  Object.assign(archer.STATS, { hp: 15, maxHp: 20, armor: 0 });
  archer.BEHAVIOUR.patterns = [
    { name: "wait", memory: { ticks: 3 } },
    { name: "archer", memory: {} },
  ];
  archer.REMAINABLE.cell = "tombstone1";
  const level = world.metadata.gameEntity.LEVEL;
  Object.assign(level.cells[3], { 0: "banditArcher" });
  level.cellPositions.banditArcher = [{ x: 3, y: 0 }];
  Object.assign(assertHero(world).PLAYER.defeatedUnits, {
    banditArcher: 2,
    banditRogue: 3,
  });

  const saved = migrate(world);
  const rogue = saved.assertById(world.getEntityId(archer));
  expect(rogue.NPC.type).toBe("banditRogue");
  expect(rogue.STATS).toMatchObject({ hp: 35, maxHp: 40, armor: 1 });
  expect(rogue.REMAINABLE.cell).toBeUndefined();
  expect(rogue.BEHAVIOUR.patterns).toEqual([
    { name: "wait", memory: { ticks: 3 } },
    { name: "bandit_camp", memory: {} },
    { name: "bandit_rogue", memory: {} },
  ]);
  expect(rogue.EQUIPPABLE.skill).toBe(world.getEntityId(bow));
  expect(getItems(saved, rogue)).toEqual([
    expect.objectContaining({ skill: "bow", material: "iron", bound: true }),
    expect.objectContaining({
      weapon: "sword",
      material: "iron",
      element: "water",
      bound: true,
    }),
    expect.objectContaining({
      stackable: "arrow",
      amount: Infinity,
      bound: true,
    }),
  ]);
  expect(saved.metadata.gameEntity.LEVEL.cells[3][0]).toBe("banditRogue");
  expect(
    saved.metadata.gameEntity.LEVEL.cellPositions.banditRogue
  ).toContainEqual({ x: 3, y: 0 });
  expect(assertHero(saved).PLAYER.defeatedUnits).toMatchObject({
    banditRogue: 5,
  });
  expect(assertHero(saved).PLAYER.defeatedUnits).not.toHaveProperty(
    "banditArcher"
  );
});

it("keeps a summoned totem's movement clock phase", () => {
  const { world } = setupHero("|  ♀    |", [
    { skill: "totem", material: "wood", amount: 1 },
    { stackable: "charge", amount: 1 },
  ]);
  face(world, "right");
  act(world, "skill");
  const totem = world
    .getEntities(["MOVABLE", "SEQUENCABLE"])
    .find((entity) => entity.SEQUENCABLE.states.aura?.name === "totemAura")!;
  const frameId = totem.MOVABLE.reference;
  Object.assign(
    world.assertByIdAndComponents(frameId, ["REFERENCE"]).REFERENCE,
    { tick: 183, delta: 91.5 }
  );
  totem.MOVABLE.spring = { duration: 183 };
  const saved = migrate(world);
  expect(
    saved.assertByIdAndComponents(frameId, ["REFERENCE"]).REFERENCE
  ).toMatchObject({ tick: 228, delta: 114 });
  expect(
    saved.assertById(world.getEntityId(totem)).MOVABLE.spring?.duration
  ).toBe(228);
});

it("resumes a spear thrust without hitting a moving target twice", () => {
  const area = "|  ♀A    |";
  const { world } = setupHero(
    area,
    [{ weapon: "spear", skill: "spear", material: "wood", amount: 1 }],
    { legend: { A: "dummy" } }
  );
  const target = getUnit(world, area, "A");
  face(world, "right");
  act(world, "skill");
  const spell = world
    .getEntities(["SEQUENCABLE", "CASTABLE"])
    .find((entity) => entity.SEQUENCABLE.states.slash?.name === "chargeSpear")!;
  const slash = spell.SEQUENCABLE.states.slash!;
  advanceUntil(
    world,
    () => !!spell.CASTABLE.affected[world.getEntityId(target)],
    500
  );
  const hp = target.STATS.hp;
  const affected = spell.CASTABLE.affected;
  spell.CASTABLE.affected = {};
  slash.args.exertables.forEach((id, index) => {
    const cell = world.assertByIdAndComponents(id, ["EXERTABLE"]);
    cell.EXERTABLE.castable = id;
    world.addComponentToEntity(cell, "CASTABLE", {
      ...spell.CASTABLE,
      affected: index === 0 ? affected : {},
    });
    world.addComponentToEntity(cell, "FRAGMENT", {
      structure: world.getEntityId(spell),
    });
  });
  const saved = migrate(world);
  const savedTarget = saved.assertById(world.getEntityId(target));
  createSystems(saved);
  preloadLevel(saved);
  moveEntity(saved, savedTarget, {
    x: target.POSITION.x + 1,
    y: target.POSITION.y,
  });
  advance(saved, 500);
  expect(savedTarget.STATS.hp).toBe(hp);
  expect(saved.getEntityById(world.getEntityId(spell))).toBeUndefined();
});
