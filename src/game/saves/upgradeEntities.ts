import { populateItems } from "../../bindings/creation";
import { Gear } from "../../engine/components/equippable";
import { Item, Material } from "../../engine/components/item";
import { World } from "../../engine/ecs";
import { hasComponent, TypedEntity } from "../../engine/entities";
import { getLimbs } from "../../engine/systems/damage";
import { matchesItem } from "../../engine/systems/popup";
import { getHasteInterval } from "../../engine/systems/movement";
import { getItemSprite } from "../assets/utils";
import { spriteRef } from "../assets/spriteIds";
import { unitDefinitions } from "../balancing/units";
import { iterateMatrix } from "../math/matrix";

const retiredArcher: string = "banditArcher";

function upgradeNpc(world: World, entity: TypedEntity<"NPC">) {
  const archer = entity.NPC.type === retiredArcher;
  if (archer) entity.NPC.type = "banditRogue";
  const type = entity.NPC.type;
  if (
    !archer &&
    type !== "banditKnight" &&
    type !== "banditPriest" &&
    type !== "banditMage" &&
    type !== "fireNomad" &&
    type !== "waterGuard"
  )
    return;

  const definition = unitDefinitions[type];
  const stats = entity.STATS;
  if (!stats || stats.hp <= 0) return;
  const oldMaxHp = archer ? 20 : type === "fireNomad" ? 50 : 40;
  const upgradedHealth = type !== "waterGuard" && stats.maxHp === oldMaxHp;
  if (upgradedHealth) {
    const maxHp = definition.stats.hp!;
    stats.hp += maxHp - stats.maxHp;
    stats.maxHp = maxHp;
  }
  if (type === "banditKnight" && stats.armor === 1) stats.armor = 2;
  if (archer) {
    if (stats.armor === 0) stats.armor = 1;
    if (entity.SPRITE) entity.SPRITE = spriteRef(definition.sprite);
    if (entity.REMAINABLE?.cell === "tombstone1") delete entity.REMAINABLE.cell;
    const patterns = entity.BEHAVIOUR?.patterns;
    const index = patterns?.findIndex((pattern) => pattern.name === "archer");
    if (patterns && index !== undefined && index >= 0) {
      patterns.splice(
        index,
        1,
        ...definition.patternNames.map((name) => ({ name, memory: {} }))
      );
    }
  }

  const carrier = world.getEntityComponents(entity, [
    "INVENTORY",
    "POSITION",
    "EQUIPPABLE",
  ]);
  if (!carrier) return;
  const items = carrier.INVENTORY.items.flatMap((id) => {
    const item = world.getEntityByIdAndComponents(id, ["ITEM", "SPRITE"]);
    return item?.ITEM.bound && item.ITEM.carrier === world.getEntityId(entity)
      ? [item]
      : [];
  });

  const changeMaterial = (slot: Gear, kind: string, previous: Material) => {
    const replacement = definition.equipments.find(
      (item) => item[slot] === kind
    )!;
    const old = items.find(({ ITEM }) =>
      matchesItem(world, ITEM, { ...replacement, material: previous })
    );
    if (!old) return false;
    old.ITEM.material = replacement.material;
    old.SPRITE = spriteRef(
      getItemSprite(old.ITEM, old.ITEM.weapon ? undefined : "resource")
    );
    return true;
  };
  const addMissing = (defaults: Omit<Item, "carrier">[]) => {
    const missing = defaults.filter(
      (item) => !items.some(({ ITEM }) => matchesItem(world, ITEM, item))
    );
    populateItems(world, carrier, missing);
  };
  const potions = definition.equipments.filter(
    (item) => item.consume === "potion"
  );

  if (archer) {
    changeMaterial("skill", "bow", "wood");
    addMissing(definition.equipments);
  } else if (type === "waterGuard") {
    const sword = changeMaterial("weapon", "sword", "iron");
    const shield = changeMaterial("offhand", "shield", "iron");
    if (sword || shield) addMissing(potions);
  } else {
    if (type === "banditKnight") changeMaterial("skill", "slash", "iron");
    // Fully spent potion stacks disappear. Only introduce them for an old loadout.
    if (upgradedHealth) addMissing(potions);
  }
}

function upgradeSpear(
  world: World,
  spell: TypedEntity<"CASTABLE" | "SEQUENCABLE">
) {
  const slash = spell.SEQUENCABLE.states.slash;
  if (slash?.name !== "chargeSpear") return;
  for (const id of slash.args.exertables) {
    const area = world.getEntityByIdAndComponents(id, [
      "CASTABLE",
      "EXERTABLE",
      "POSITION",
    ]);
    if (!area || area.EXERTABLE.castable !== id) continue;
    // Each old damage area remembered root hits on its own. If a multipart enemy
    // moved since the hit, its original limb can no longer be identified.
    for (const [rootId, hit] of Object.entries(area.CASTABLE.affected)) {
      const root = world.getEntityById(Number(rootId));
      if (!root?.STRUCTURABLE) {
        spell.CASTABLE.affected[rootId] = hit;
        continue;
      }
      const limbs = getLimbs(world, root);
      const touched = limbs.filter(
        ({ POSITION }) =>
          POSITION?.x === area.POSITION.x && POSITION.y === area.POSITION.y
      );
      for (const limb of touched.length ? touched : limbs) {
        spell.CASTABLE.affected[world.getEntityId(limb)] = hit;
      }
    }
    area.EXERTABLE.castable = slash.args.castable;
    world.removeComponentFromEntity(area, "CASTABLE", false);
    for (const component of [
      "FRAGMENT",
      "BELONGABLE",
      "SPRITE",
      "SEQUENCABLE",
      "RENDERABLE",
    ] as const) {
      if (hasComponent(area, component))
        world.removeComponentFromEntity(area, component, false);
    }
  }
}

export function upgradeEntities(world: World) {
  const level = world.metadata.gameEntity.LEVEL;
  // /new recorded the unit in both the cell matrix and the position index.
  iterateMatrix(level.cells, (x, y, cell) => {
    if (cell === retiredArcher) level.cells[x][y] = "banditRogue";
  });
  if (level.cellPositions[retiredArcher]) {
    level.cellPositions.banditRogue = (
      level.cellPositions.banditRogue || []
    ).concat(level.cellPositions[retiredArcher]);
    delete level.cellPositions[retiredArcher];
  }
  for (const entity of world.metadata.ecs.entities) {
    const defeats: Record<string, number | undefined> | undefined =
      entity.PLAYER?.defeatedUnits;
    const count = defeats?.[retiredArcher];
    if (defeats && count !== undefined) {
      defeats.banditRogue = (defeats.banditRogue || 0) + count;
      delete defeats[retiredArcher];
    }
    if (hasComponent(entity, "NPC")) upgradeNpc(world, entity);
    if (
      entity.SEQUENCABLE?.states.slash?.name === "chargeSpear" &&
      entity.CASTABLE
    ) {
      upgradeSpear(
        world,
        world.assertComponents(entity, ["SEQUENCABLE", "CASTABLE"])
      );
    }
    if (
      entity.SEQUENCABLE?.states.aura?.name === "totemAura" &&
      entity.MOVABLE
    ) {
      const clock = world.getEntityByIdAndComponents(entity.MOVABLE.reference, [
        "REFERENCE",
      ])?.REFERENCE;
      if (clock?.tick === 183) {
        const tick = getHasteInterval(world, 7);
        clock.delta *= tick / clock.tick;
        clock.tick = tick;
        if (entity.MOVABLE.spring?.duration === 183)
          entity.MOVABLE.spring.duration = tick;
      }
    }
  }
}
