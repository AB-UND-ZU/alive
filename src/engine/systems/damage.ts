import { resolveSprite } from "../../game/assets/spriteIds";
import { bumpEntity } from "../motion";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import {
  add,
  choice,
  combine,
  copy,
  getDistance,
  shuffle,
} from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { MELEE } from "../components/melee";
import { getCellEntities, moveEntity } from "./map";
import { ATTACKABLE } from "../components/attackable";
import { rerenderEntity } from "./renderer";
import {
  ITEM,
  ItemStats,
  Ranged,
  ranged,
  rechargables,
} from "../components/item";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
  orientations,
} from "../components/orientable";
import { EQUIPPABLE } from "../components/equippable";
import { isGhost } from "./fate";
import { createSequence, getSequence } from "./sequence";
import {
  FlashSequence,
  MarkerSequence,
  MeleeSequence,
  SEQUENCABLE,
  SlashSequence,
} from "../components/sequencable";
import { BELONGABLE, neutrals, tribes } from "../components/belongable";
import {
  attributes,
  emptyUnitStats,
  heroBaseHaste,
  UnitStats,
  STATS,
} from "../components/stats";
import { colors } from "../../game/assets/colors";
import {
  none,
  tooltipFriendlyStart,
  tooltipHostileStart,
  tooltipNeutralStart,
} from "../../game/assets/sprites";
import { PLAYER } from "../components/player";
import { isControllable } from "./freeze";
import { RECHARGABLE } from "../components/rechargable";
import {
  BuffStats,
  CASTABLE,
  Castable,
  DamageType,
  getEmptyCastable,
  MarkerType,
} from "../components/castable";
import { requireComponent, hasComponent, TypedEntity } from "../entities";
import { queueMessage } from "../../game/assets/utils";
import { pickupOptions, play } from "../../game/sound";
import {
  getEquipmentStats,
  getItemStats,
} from "../../game/balancing/equipment";
import { NPC } from "../components/npc";
import { getAbilityStats } from "../../game/balancing/abilities";
import { closePopup, getActivePopup } from "./popup";
import { Affectable, AFFECTABLE } from "../components/affectable";
import { BURNABLE } from "../components/burnable";
import { extinguishEntity } from "./burn";
import { FRAGMENT } from "../components/fragment";
import { isFragment } from "./enter";
import { CONDITIONABLE } from "../components/conditionable";
import { isDecaying, isHarvested } from "./drop";
import { STRUCTURABLE } from "../components/structurable";
import {
  attemptBubbleAbsorb,
  getAffectables,
  getExertables,
  isAffectable,
} from "./magic";
import { LEVEL } from "../components/level";
import { getTempo, isPassable, isWalkable } from "./movement";
import { hasWater } from "./immersion";
import { BUMPABLE } from "../components/bumpable";
import { EXERTABLE } from "../components/exertable";
import { getSpikable, stingEntity } from "./spike";
import { getBlockable } from "./action";
import { entities } from "..";
import { SPRITE } from "../components/sprite";
import { IDENTIFIABLE } from "../components/identifiable";
import { castSpell } from "./trigger";
import { LAYER } from "../components/layer";
import { LOOTABLE } from "../components/lootable";
import { FOG } from "../components/fog";
import { Inventory, INVENTORY } from "../components/inventory";
import { TAMEABLE } from "../components/tameable";
import { canPetStrike, petTerrainBonus, recordPetOpponent } from "./petSkills";
import { createText } from "../../game/assets/ui";

export const isDead = (world: World, entity: TypedEntity) =>
  (hasComponent(entity, STATS) && entity[STATS].hp <= 0) || !!isGhost(world, entity);

export const isNpc = (world: World, entity: TypedEntity): entity is TypedEntity<"NPC"> => hasComponent(entity, NPC);

export const isTribe = (world: World, entity: TypedEntity) =>
  hasComponent(entity, BELONGABLE) && tribes.some((tribe) => tribe === entity[BELONGABLE].faction);

export const isEnemy = (world: World, entity: TypedEntity) =>
  hasComponent(entity, BELONGABLE) && !tribes.some((tribe) => tribe === entity[BELONGABLE].faction);

export const isNeutral = (world: World, entity: TypedEntity) =>
  hasComponent(entity, BELONGABLE) && neutrals.some((neutral) => neutral === entity[BELONGABLE].faction);

export const isHostile = (world: World, entity: TypedEntity) =>
  entity[BELONGABLE]?.faction === "hostile";

export const isCooperating = (world: World, entity: TypedEntity, target: TypedEntity) =>
  !target[BELONGABLE] ||
  (!isHostile(world, target) &&
    (isNeutral(world, target) || isFriendlyFire(world, entity, target)));

export const createTooltip = (world: World, entity: TypedEntity<"SPRITE">) => {
  const text = resolveSprite(entity[SPRITE]).name;
  const enemy = isEnemy(world, entity) && !isNeutral(world, entity);
  const friendly = isTribe(world, entity);
  return [
    enemy
      ? tooltipHostileStart
      : friendly
      ? tooltipFriendlyStart
      : tooltipNeutralStart,
    ...createText(
      text,
      enemy ? colors.maroon : friendly ? colors.green : colors.silver,
      colors.black
    ),
    none,
  ];
};

export const triggerSpear = (
  world: World,
  entity: TypedEntity,
  weapon: TypedEntity<"ITEM">,
  orientation?: Orientation
) => {
  if (weapon[ITEM].weapon !== "spear") return;

  const weaponStats = getEquipmentStats(weapon[ITEM], entity[NPC]?.type);
  const castableStats = {
    ...getEmptyCastable(world, entity),
    ...weaponStats,
    cascade: world.getEntityId(entity),
  };

  const spellEntity = entities.createCascade(world, {
    [BELONGABLE]: { faction: requireComponent(entity, BELONGABLE).faction },
    [CASTABLE]: castableStats,
    [FRAGMENT]: { structure: -1 },
    [ORIENTABLE]: { facing: orientation },
    [POSITION]: copy(requireComponent(entity, POSITION)),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
    [STRUCTURABLE]: {},
  });
  const spellId = world.getEntityId(spellEntity);
  spellEntity[FRAGMENT].structure = spellId;
  const tick = world.assertByIdAndComponents(requireComponent(entity, MOVABLE).reference, [
    REFERENCE,
  ])[REFERENCE].tick;

  play(world, entity, "spear");

  // create spear slash
  createSequence<"slash", SlashSequence>(
    world,
    spellEntity,
    "slash",
    "chargeSpear",
    {
      tick,
      material: weapon[ITEM].material,
      element: weapon[ITEM].element,
      castable: spellId,
      exertables: [],
    }
  );
};

export const isFriendlyFire = (
  world: World,
  entity: TypedEntity,
  target: TypedEntity
) => {
  if (!entity[BELONGABLE] || !target[BELONGABLE]) return true;

  const entityFaction = entity[BELONGABLE].faction;
  const targetFaction = target[BELONGABLE].faction;

  return (
    entityFaction === targetFaction ||
    (isTribe(world, entity) && isTribe(world, target)) ||
    (isNeutral(world, entity) && isNeutral(world, target)) ||
    (entityFaction === "wild" && targetFaction === "unit")
  );
};

export const isFightable = (world: World, entity: TypedEntity) =>
  hasComponent(entity, ATTACKABLE) &&
  !isDead(world, entity) &&
  !isHarvested(world, entity) &&
  !getSequence(world, entity, "decay") &&
  !isDecaying(world, entity);

export const isAttackable = (world: World, entity: TypedEntity): entity is TypedEntity<"ATTACKABLE" | "STATS"> =>
  hasComponent(entity, ATTACKABLE) && hasComponent(entity, STATS);

export const getAttackables = (
  world: World,
  position: Position,
  fragment = false
) => {
  if (getBlockable(world, position)) return [];

  const attackables: TypedEntity[] = [];

  getCellEntities(world, position).forEach((target) => {
    if (isAttackable(world, target)) {
      attackables.push(target);
      return;
    }

    if (!isFragment(world, target)) return;

    const structurableEntity = world.getEntityById(
      target[FRAGMENT].structure
    );

    if (!structurableEntity) return;

    if (fragment && isAttackable(world, structurableEntity)) {
      attackables.push(target);
      return;
    }

    if (isAttackable(world, structurableEntity)) {
      attackables.push(structurableEntity);
    }
  });

  return attackables;
};

export const getAttackable = (
  world: World,
  position: Position,
  fragment?: boolean
) => getAttackables(world, position, fragment)[0];

export const getRoot = (world: World, entity: TypedEntity) =>
  (isFragment(world, entity) && getStructure(world, entity)) || entity;

export const getStructure = (world: World, entity: TypedEntity) =>
  world.getEntityById(requireComponent(entity, FRAGMENT).structure);

export const getLimbs = (world: World, entity: TypedEntity) => {
  const limbs = [];

  if (entity[STRUCTURABLE]) {
    const entityId = world.getEntityId(entity);
    for (const limbEntity of world.getEntities([FRAGMENT])) {
      if (limbEntity[FRAGMENT].structure === entityId) {
        limbs.push(limbEntity);
      }
    }
  } else {
    limbs.push(entity);
  }
  return limbs;
};

export const getEntityEquipmentStats = (
  world: World,
  entity: TypedEntity
): UnitStats => {
  const equipmentStats = { ...emptyUnitStats };
  const items = [...new Set(Object.values(entity[EQUIPPABLE] || {}))];
  items.forEach((itemId) => {
    const item = world.getEntityByIdAndComponents(itemId, [ITEM]);

    if (!item) return;

    const itemStats = getItemStats(item[ITEM], entity[NPC]?.type);

    attributes.forEach((attribute) => {
      equipmentStats[attribute] += itemStats[attribute];
    });
  });

  return equipmentStats;
};

export const getEntityBaseStats = (
  world: World,
  entity: TypedEntity
): UnitStats => {
  const equipmentStats = getEntityEquipmentStats(world, entity);
  const entityStats = { ...(entity[STATS] || emptyUnitStats) };
  attributes.forEach((attribute) => {
    // Consume already applies equipment capacity to the stored HP/MP limits.
    if (!entity[PLAYER] || (attribute !== "maxHp" && attribute !== "maxMp"))
      entityStats[attribute] += equipmentStats[attribute];
  });

  if (entity[PLAYER]) entityStats.haste += heroBaseHaste;
  return entityStats;
};

const statModifiers = {
  addPower: "power",
  addArmor: "armor",
  addWisdom: "wisdom",
  addResist: "resist",
  addHaste: "haste",
} as const;
export const getEntityStats = (
  world: World,
  entity: TypedEntity
): UnitStats => {
  const baseStats = getEntityBaseStats(world, entity);
  if (!entity[POSITION]) return baseStats;

  const exertables = getExertables(world, entity[POSITION]);
  const exertableStats = exertables.reduce((aggregated, exertable) => {
    const castable = world.getEntityByIdAndComponents(
      exertable[EXERTABLE].castable,
      [CASTABLE]
    );
    if (!castable?.[CASTABLE]) return aggregated;

    const allied = isFriendlyFire(world, entity, castable);

    Object.entries(statModifiers).forEach(([modifier, target]) => {
      const value = castable[CASTABLE][modifier as keyof BuffStats];
      if ((value > 0 && allied) || (value < 0 && !allied)) {
        aggregated[target] += value;
      }
    });
    return aggregated;
  }, baseStats) as UnitStats;

  exertableStats.haste += getTempo(world, entity[POSITION]);

  return exertableStats;
};

export const getEntityDisplayStats = (
  world: World,
  entity: TypedEntity
): UnitStats => {
  const entityStats = getEntityBaseStats(world, entity);
  return {
    ...entityStats,
    vision: entityStats.vision + 3,
  };
};

// damage is calculated as follows:
//   attack  = attacker item + offensive stat
//   defense = defender item + defensive stat
//   delta   = attack - defense
// if attack <= 0
//   damage  = 0
// if delta > 0
//   damage  = delta
// else
//   damage  = 1 / (2 - delta)
// example values:
//   atk | def | dmg
//    3  |  0  |  3
//    3  |  1  |  2
//    3  |  3  | 0.5
//    3  |  5  | 0.25
export const calculateDamage = (
  world: World,
  itemStats: Partial<Pick<Castable, DamageType>>,
  attackerEntity: TypedEntity,
  defenderEntity: TypedEntity
) => {
  const attackerStats = getEntityStats(world, attackerEntity);
  const defenderStats = getEntityStats(world, defenderEntity);

  const offensive = itemStats.melee
    ? itemStats.melee + attackerStats.power
    : itemStats.magic
    ? itemStats.magic + attackerStats.wisdom
    : itemStats.true || 0;
  const defensive = itemStats.melee
    ? defenderStats.armor
    : itemStats.magic
    ? defenderStats.resist
    : 0;

  const attack = itemStats.melee || itemStats.magic || itemStats.true || 0;
  const delta = offensive + petTerrainBonus(world, attackerEntity) - defensive;
  const damage = attack <= 0 ? 0 : delta > 0 ? delta : 1 / (2 - delta);
  const newHp = Math.max(0, defenderStats.hp - damage);

  const visibleHp = defenderStats.hp >= 1 ? Math.floor(defenderStats.hp) : 1;
  const visibleNewHp = newHp >= 1 ? Math.floor(newHp) : newHp === 0 ? 0 : 1;
  const passedThreshold = visibleNewHp < visibleHp;
  const visibleDamage = damage >= 1 ? damage : passedThreshold ? 1 : 0;

  return { damage: visibleDamage, hp: newHp };
};

export const calculateHealing = (targetStats: UnitStats, amount: number) => {
  const hp = Math.min(targetStats.maxHp, targetStats.hp + amount);
  const visibleHealing = Math.max(0, Math.ceil(hp - targetStats.hp));
  return { hp, healing: visibleHealing };
};

export const canRecharge = (world: World, entity: TypedEntity) =>
  !!((entity[INVENTORY] as Inventory).items || []).find((itemId) =>
    rechargables.includes(
      world.getEntityByIdAndComponents(itemId, [ITEM])?.[ITEM]
        .skill as (typeof rechargables)[number]
    )
  );

const zapSize = 11;
const zapDelay = 100;

export const triggerZap = (
  world: World,
  attackerEntity: TypedEntity,
  targetEntity: TypedEntity,
  fragmentEntity: TypedEntity,
  itemStats: Partial<ItemStats>
) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const count = attackerEntity[CONDITIONABLE]?.zap?.amount || 1;
  const rootEntity = getRoot(world, targetEntity);
  const targets = [];

  for (let offsetX = 0; offsetX < zapSize; offsetX += 1) {
    for (let offsetY = 0; offsetY < zapSize; offsetY += 1) {
      const position = combine(size, requireComponent(fragmentEntity, POSITION), {
        x: offsetX - (zapSize - 1) / 2,
        y: offsetY - (zapSize - 1) / 2,
      });

      // force hitting other enemy roots only
      const enemies = getAffectables(world, position)
        .map((affectable) => getRoot(world, affectable))
        .filter(
          (root) =>
            root !== rootEntity && !isFriendlyFire(world, attackerEntity, root)
        );
      targets.push(...new Set(enemies));
    }
  }

  // hit other enemies first before retriggering target again
  const ordered = [];
  while (ordered.length < count) {
    const sorted = shuffle(targets);
    sorted.sort(
      (left, right) =>
        getDistance(requireComponent(fragmentEntity, POSITION), requireComponent(left, POSITION), size, 1) -
        getDistance(requireComponent(fragmentEntity, POSITION), requireComponent(right, POSITION), size, 1)
    );
    ordered.push(...sorted, rootEntity);
  }

  const zapped = ordered.slice(0, count);
  const zapCounts: Record<number, number> = {};
  const zapTargets = [];

  for (const zapTarget of zapped) {
    const zapRoot = getRoot(world, zapTarget);
    recordPetOpponent(world, attackerEntity, zapRoot);
    if (attemptBubbleAbsorb(world, zapRoot)) continue;

    const { damage, hp } = calculateDamage(
      world,
      itemStats,
      attackerEntity,
      zapRoot
    );
    requireComponent(zapRoot, STATS).hp = hp;
    rerenderEntity(world, zapRoot);

    // add hit marker
    const zapId = world.getEntityId(zapRoot);
    if (!(zapId in zapCounts)) {
      zapTargets.push(zapTarget);
      zapCounts[zapId] = 0;
    }
    zapCounts[zapId] += 1;

    createAmountMarker(
      world,
      zapTarget,
      -damage,
      "up",
      itemStats.melee ? "melee" : "magic",
      zapDelay * zapCounts[zapId]
    );
  }

  // animate lightning flash
  const castableEntity = entities.createSpell(world, {
    [BELONGABLE]: { faction: "nature" },
    [CASTABLE]: getEmptyCastable(world, targetEntity),
    [ORIENTABLE]: {},
    [POSITION]: copy(requireComponent(fragmentEntity, POSITION)),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });
  createSequence<"flash", FlashSequence>(
    world,
    castableEntity,
    "flash",
    "lightningFlash",
    { targets: zapTargets.map((target) => requireComponent(target, POSITION)) }
  );
  play(world, fragmentEntity, "zap", { actor: attackerEntity, variant: 2 });
  zapTargets.forEach((target, index) =>
    play(world, target, "spark", {
      actor: attackerEntity,
      variant: index + 1,
      delay: index * 35,
    })
  );

  delete attackerEntity[CONDITIONABLE]?.zap;
  rerenderEntity(world, attackerEntity);
};

export const applyEffects = (
  world: World,
  targetEntity: TypedEntity,
  burn: number,
  freeze: number
) => {
  let hasAffected = false;

  if (!targetEntity[AFFECTABLE]) return hasAffected;

  const targetStats = getEntityStats(world, targetEntity);

  // set affected unit on fire
  const targetBurn = burn - targetStats.damp;
  const curentBurn = targetEntity[AFFECTABLE].burn;
  if (
    burn > 0 &&
    targetBurn > 0 &&
    targetBurn > curentBurn &&
    !isDead(world, targetEntity)
  ) {
    hasAffected = true;
    targetEntity[AFFECTABLE].burn = targetBurn;
    if (targetEntity[BURNABLE]) targetEntity[BURNABLE].burning = true;
  }

  // freeze affected units
  const targetFreeze = freeze - targetStats.thaw;
  const curentFreeze = targetEntity[AFFECTABLE].freeze;
  if (
    freeze > 0 &&
    targetFreeze > 0 &&
    targetFreeze > curentFreeze &&
    !isDead(world, targetEntity)
  ) {
    hasAffected = true;
    targetEntity[AFFECTABLE].freeze = targetFreeze;
  }

  // extinguish unit if burning and frozen
  if (
    targetEntity[AFFECTABLE].freeze > 0 &&
    targetEntity[AFFECTABLE].burn > 0
  ) {
    hasAffected = true;
    targetEntity[AFFECTABLE].freeze = 0;
    extinguishEntity(world, targetEntity);
  }

  return hasAffected;
};

const procDelay = 100;

export const applyProcs = (
  world: World,
  attackerEntity: TypedEntity | undefined,
  itemStats: Partial<ItemStats>,
  procId: number,
  targetEntity: TypedEntity,
  fragmentEntity: TypedEntity,
  orientation: Orientation
) => {
  let hasAffected = false;

  if (!targetEntity[AFFECTABLE]) return hasAffected;

  const { [procId]: lastProc, ...otherProcs } = (
    targetEntity[AFFECTABLE] as Affectable
  ).procs;
  const generation = world.metadata.gameEntity[RENDERABLE].generation;

  // handle zap regardless of other procs
  const zapCondition = attackerEntity?.[CONDITIONABLE]?.zap;
  const zapEntity = world.getEntityByIdAndComponents(zapCondition?.item, [
    ITEM,
  ]);

  if (zapEntity && zapCondition && attackerEntity) {
    const zapStats = getAbilityStats(zapEntity[ITEM]);
    triggerZap(world, attackerEntity, targetEntity, fragmentEntity, zapStats);
  }

  // skip if not ready to proc again
  if (lastProc && lastProc + (itemStats.reproc || procDelay) > generation)
    return hasAffected;

  // process burn and freeze
  hasAffected = applyEffects(
    world,
    targetEntity,
    itemStats.burn || 0,
    itemStats.freeze || 0
  );

  // handle drain
  const drain = itemStats.drain;
  if (attackerEntity && drain) {
    const { healing, hp } = calculateHealing(requireComponent(attackerEntity, STATS), drain);
    if (healing > 0) {
      requireComponent(attackerEntity, STATS).hp = hp;
      hasAffected = true;
      createAmountMarker(world, attackerEntity, drain, "up", "heal");
      play(world, attackerEntity, "pickup", { ...pickupOptions.hp });
    }
  }

  // handle knock
  knockEntity(
    world,
    targetEntity,
    orientation,
    itemStats.knock || 0,
    attackerEntity
  );

  // mark proc as handled
  targetEntity[AFFECTABLE].procs[procId] = generation;

  // clean up stale procs
  Object.entries(otherProcs).forEach(([procId, procGeneration]) => {
    if (
      procGeneration + procDelay <= generation ||
      !world.getEntityById(parseInt(procId))
    ) {
      delete requireComponent(targetEntity, AFFECTABLE).procs[procId];
    }
  });

  return hasAffected;
};

const interruptPopup = (world: World, entity: TypedEntity) => {
  const popup = getActivePopup(world, entity);
  if (popup && popup[IDENTIFIABLE]?.name !== "use") closePopup(world, entity, popup);
};

export const knockEntity = (
  world: World,
  entity: TypedEntity,
  orientation: Orientation,
  amount: number,
  source?: TypedEntity
) => {
  // fire tribe has knock immunity
  if (
    source?.[LAYER]?.structure !== entity[LAYER]?.structure ||
    entity[BELONGABLE]?.faction === "fire" ||
    entity[NPC]?.type === "wormTower"
  )
    return;

  const size = world.metadata.gameEntity[LEVEL].size;
  if (!orientation) orientation = choice(...orientations);
  const delta = orientationPoints[orientation];

  if (amount > 0 && !entity[FRAGMENT] && (entity[MOVABLE] || entity[LOOTABLE]?.disposable)) {
    const position = requireComponent(entity, POSITION);
    if (entity[LOOTABLE]?.disposable && hasWater(world, position)) return;
    interruptPopup(world, entity);
    let target = copy(position);
    let slide = amount;
    let sting;

    while (slide > 0) {
      const newTarget = combine(size, target, delta);
      const spikable = getSpikable(world, newTarget);
      if (spikable) {
        sting = spikable;
        break;
      }
      // Worm attacks can push across the lake, but still stop at obstacles.
      if (
        source?.[NPC]?.type === "wormBoss"
          ? !isPassable(world, newTarget)
          : !isWalkable(world, newTarget)
      )
        break;

      slide -= 1;
      target = newTarget;
    }

    // move or bump of not moved
    if (slide < amount) {
      if (!entity[MOVABLE] && !entity[BUMPABLE] && entity[LOOTABLE]?.disposable)
        world.addComponentToEntity(entity, BUMPABLE, { generation: 0 });
      moveEntity(world, entity, target);
      rerenderEntity(world, entity);
    } else if (entity[BUMPABLE]) {
      bumpEntity(world, entity, orientation);
    }

    // knock into spikes but prevent tornadoes killing all mobs in desert
    if (
      sting && entity[STATS] &&
      !(isNpc(world, entity) && entity[FOG]?.visibility !== "visible")
    ) {
      stingEntity(world, sting, entity);
    }
  }
};

export const createAmountMarker = (
  world: World,
  entity: TypedEntity,
  amount: number,
  orientation: Orientation,
  type: MarkerType,
  delay = 0
) => {
  if (!hasComponent(entity, SEQUENCABLE)) {
    const rootEntity = getRoot(world, entity);

    if (!hasComponent(rootEntity, SEQUENCABLE)) {
      console.warn("Unable to display marker for entity:", entity);
      return;
    }

    entity = rootEntity;
  }

  if (!getSequence(world, entity, "marker")) {
    createSequence<"marker", MarkerSequence>(
      world,
      entity,
      "marker",
      "amountMarker",
      {
        amount,
        type,
        orientation,
      }
    );
  }

  queueMessage(world, entity, {
    line: createText(
      `${amount > 0 ? "+" : amount < 0 ? "-" : ""}${Math.abs(amount)}`,
      amount === 0
        ? colors.white
        : amount > 0
        ? colors.lime
        : type === "magic"
        ? colors.fuchsia
        : type === "true"
        ? colors.white
        : colors.red
    ),
    orientation,
    fast: amount <= 0,
    delay,
  });

  // increase total damage counter
  if (entity[PLAYER] && amount < 0) {
    entity[PLAYER].receivedStats[type] -= amount;
  }
};

export default function setupDamage(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle melee attacks
    for (const entity of world.getEntities([
      POSITION,
      MOVABLE,
      MELEE,
      EQUIPPABLE,
      RENDERABLE,
      STATS,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.assertByIdAndComponents(
        entity[MOVABLE].reference,
        [RENDERABLE, REFERENCE]
      );
      const entityGeneration = entityReference[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityGeneration) continue;

      entityReferences[entityId] = entityGeneration;

      // skip if entity has already interacted
      if (entity[MOVABLE].lastInteraction === entityGeneration) continue;

      // skip if not able to attack
      if (!isControllable(world, entity)) continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].orientations[0] || entity[MOVABLE].pendingOrientation;

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const rigid = entity[STRUCTURABLE]?.rigid;
      const limbs = rigid ? getLimbs(world, entity) : [entity];

      // skip if entity has no weapon
      const weaponId = entity[EQUIPPABLE].weapon;
      const weaponEntity = world.getEntityByIdAndComponents(weaponId, [ITEM]);

      if (!weaponId || !weaponEntity) continue;

      const weaponStats = getEquipmentStats(
        weaponEntity[ITEM],
        entity[NPC]?.type
      );

      let interacted = false;
      let attacked = false;
      let trigger = false;

      for (const limb of limbs) {
        const targetPosition = add(requireComponent(limb, POSITION), delta);
        const targetEntity = getAttackable(world, targetPosition);

        // skip if there's no target
        if (!targetEntity) continue;
        if (hasComponent(entity, TAMEABLE) && !canPetStrike(world, entity, getRoot(world, targetEntity))) continue;

        // skip if not damaging enemy or healing ally
        const friendly = isFriendlyFire(world, entity, targetEntity);
        const healing =
          weaponStats.heal > 0 && (friendly || !weaponStats.melee);

        if (healing !== friendly) continue;

        interacted = true;

        // do nothing if target is dead and pending decay
        if (isDead(world, targetEntity)) continue;

        attacked = true;
        if (!healing) recordPetOpponent(world, entity, getRoot(world, targetEntity));

        // trigger ranged weapons if necessary
        if (ranged.includes(weaponEntity[ITEM].weapon as Ranged)) {
          if (
            weaponEntity[ITEM].weapon === "wand" &&
            isAffectable(world, targetEntity)
          ) {
            trigger = true;
            castSpell(world, entity, weaponEntity, targetOrientation);
            break;
          }

          if (weaponEntity[ITEM].weapon === "spear") {
            trigger = true;
            triggerSpear(world, entity, weaponEntity, targetOrientation);
            break;
          }
        }

        // prevent attack if shield is active
        let displayedDamage = 0;
        const absorbed = !healing && attemptBubbleAbsorb(world, targetEntity);
        const fragmentEntity =
          getAttackable(world, targetPosition, true) || targetEntity;

        if (!absorbed) {
          if (healing) {
            const stats = requireComponent(targetEntity, STATS);
            const { healing, hp } = calculateHealing(
              stats,
              weaponStats.heal + petTerrainBonus(world, entity)
            );
            stats.hp = hp;
            if (entity[TAMEABLE]?.healingHits) entity[TAMEABLE].healingHits--;

            displayedDamage = -healing;
          } else {
            const { damage, hp } = calculateDamage(
              world,
              weaponStats,
              entity,
              targetEntity
            );

            requireComponent(targetEntity, STATS).hp = hp;

            // propagate damage
            const rootEntity = getRoot(world, targetEntity);
            if (targetEntity !== rootEntity) {
              const { hp } = calculateDamage(
                world,
                { true: damage },
                {},
                rootEntity
              );
              requireComponent(rootEntity, STATS).hp = hp;
              rerenderEntity(world, rootEntity);
            }

            // trigger on hit effects
            applyProcs(
              world,
              entity,
              weaponStats,
              weaponId,
              rootEntity,
              fragmentEntity,
              targetOrientation
            );

            play(world, fragmentEntity, "hit", {
              actor: entity,
              intensity: damage,
              variant: targetEntity[PLAYER] ? 1 : 2,
            });

            // set rechargable if applicable
            const shouldRecharge = canRecharge(world, entity);

            if (shouldRecharge && targetEntity[RECHARGABLE]) {
              targetEntity[RECHARGABLE].hit = true;
            }

            displayedDamage = damage;
          }
        }

        // close popup on target hits
        if (!healing || !entity[TAMEABLE]) interruptPopup(world, targetEntity);

        // create hit marker
        if (!absorbed && !(healing && displayedDamage === 0)) {
          createAmountMarker(
            world,
            fragmentEntity,
            -displayedDamage,
            targetOrientation,
            healing
              ? "heal"
              : weaponStats.true > 0
              ? "true"
              : weaponStats.magic > 0
              ? "magic"
              : "melee"
          );
        }
        rerenderEntity(world, targetEntity);
        rerenderEntity(world, fragmentEntity);
      }

      if (interacted) {
        // mark as interacted
        entity[MOVABLE].pendingOrientation = undefined;
        entity[MOVABLE].lastInteraction = entityGeneration;
      }

      if (attacked) {
        // perform bump
        entity[MELEE].facing = targetOrientation;
        entity[MELEE].hits += 1;

        for (const limb of limbs) {
          if (limb[BUMPABLE]) {
            bumpEntity(
              world,
              limb,
              targetOrientation,
              entity[RENDERABLE].generation
            );
          }

          if (!rigid && limb[ORIENTABLE]) {
            limb[ORIENTABLE].facing = targetOrientation;
          }
        }

        rerenderEntity(world, entity);

        // animate sword orientation
        if (!trigger) {
          createSequence<"melee", MeleeSequence>(
            world,
            entity,
            "melee",
            "swordAttack",
            {
              facing: targetOrientation,
              tick: entityReference[REFERENCE].tick,
              rotate: false,
            }
          );
        }
      }
    }
  };

  return { onUpdate };
}
