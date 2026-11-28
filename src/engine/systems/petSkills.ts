import { getAbilityStats } from "../../game/balancing/abilities";
import { BuffStats, CASTABLE, emptyBuffStats, getEmptyCastable } from "../components/castable";
import { AuraSequence } from "../components/sequencable";
import {
  getHarvestConfig,
  harvestTools,
  trenchResources,
} from "../../game/balancing/harvesting";
import { combine, getDistance, random, shuffle } from "../../game/math/std";
import { BEHAVIOUR } from "../components/behaviour";
import { BELONGABLE } from "../components/belongable";
import { BUMPABLE } from "../components/bumpable";
import { HARVESTABLE } from "../components/harvestable";
import { HOOKABLE } from "../components/hookable";
import { MOVABLE } from "../components/movable";
import { SPRITE } from "../components/sprite";
import { INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { LEVEL } from "../components/level";
import { LOOTABLE } from "../components/lootable";
import {
  ORIENTABLE,
  orientationPoints,
  orientations,
} from "../components/orientable";
import { PLAYER } from "../components/player";
import { POSITION, Position } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { STATS } from "../components/stats";
import { TAMEABLE } from "../components/tameable";
import { World } from "../ecs";
import { TypedEntity } from "../entities";
import { bumpEntity } from "../motion";
import {
  isDead,
  isFightable,
  isFriendlyFire,
  isNeutral,
} from "./damage";
import { iterateMatrixFromCenter } from "../../game/math/matrix";
import { getBurning } from "./burn";
import { dropBagItem } from "./drop";
import { onSameLayer } from "./enter";
import { getSightCells } from "./visibility";
import { getHarvestable, harvestResource } from "./harvest";
import { shootHoming } from "./homing";
import { isImmersible } from "./immersion";
import { getCellEntities } from "./map";
import { feedPet, getPetConsumption, isPetOffering } from "./petCare";
import { isPathable, isWalkable } from "./movement";
import { matchesItem } from "./popup";
import { addToInventory, collectItem } from "./collect";
import { createSequence, getSequence } from "./sequence";

type Pet = TypedEntity<"TAMEABLE" | "POSITION" | "INVENTORY" | "STATS">;

const petMemory = (pet: TypedEntity) =>
  pet[BEHAVIOUR]?.patterns.find((pattern) => pattern.name === "pet")?.memory;

export function canPetStrike(world: World, pet: TypedEntity<"TAMEABLE">, target: TypedEntity) {
  const id = world.getEntityId(target);
  if (id === pet[TAMEABLE].owner) {
    const stats = target[STATS];
    return !!pet[TAMEABLE].healingHits && !!stats && stats.hp < stats.maxHp;
  }
  return pet[TAMEABLE].skills.includes("attack") && petMemory(pet)?.target === id;
}

const petAuraRadius = 2;

export function inPetAuraRange(world: World, pet: TypedEntity<"POSITION">) {
  const owner = world.getEntityByIdAndComponents(pet[TAMEABLE]?.owner, [POSITION]);
  return !!owner && !isDead(world, owner) && onSameLayer(world, owner, pet) &&
    getDistance(pet[POSITION], owner[POSITION], world.metadata.gameEntity[LEVEL].size, 1) <= petAuraRadius;
}

export function startPetAura(world: World, pet: Pet) {
  if (getSequence(world, pet, "aura") || !inPetAuraRange(world, pet)) return;
  if (!pet[CASTABLE]) {
    const aura = getEmptyCastable(world, pet);
    const totem = getAbilityStats({ skill: "totem" });
    const buffs = (Object.keys(emptyBuffStats) as (keyof BuffStats)[]).filter(stat => totem[stat] > 0);
    for (const stat of shuffle(buffs).slice(0, 2)) aura[stat] = totem[stat];
    world.addComponentToEntity(pet, CASTABLE, aura);
  }
  createSequence<"aura", AuraSequence>(world, pet, "aura", "totemAura", {
    range: petAuraRadius, areas: [], progress: 0, duration: 0, delay: 0,
  });
}

export const petTerrainBonus = (world: World, pet: TypedEntity) => {
  if (!pet[TAMEABLE] || !pet[POSITION]) return 0;
  if (
    pet[TAMEABLE].attributes.water === true &&
    isImmersible(world, pet[POSITION])
  )
    return 1;
  return pet[TAMEABLE].attributes.water === false &&
    getCellEntities(world, pet[POSITION]).some(
      (entity) =>
        entity[HARVESTABLE]?.resource === "sand" ||
        entity[HARVESTABLE]?.resource === "beach"
    )
    ? 1
    : 0;
};

// Use the actual victim or attacker, including spells that hit at a distance.
export const recordPetOpponent = (
  world: World,
  attacker: TypedEntity | undefined,
  victim: TypedEntity
) => {
  if (!attacker) return;
  if (
    victim[TAMEABLE] &&
    victim[TAMEABLE].owner === undefined &&
    attacker[POSITION]
  ) {
    const memory = petMemory(victim);
    if (memory) {
      memory.attacker = world.getEntityId(attacker);
      memory.fleeUntil = world.metadata.gameEntity[RENDERABLE].generation + 4;
      delete memory.heal;
    }
  }
  if (!attacker[PLAYER] && !victim[PLAYER]) return;
  const defending = !!victim[PLAYER];
  const hero = defending ? victim : attacker;
  const enemy = defending ? attacker : victim;
  if (!enemy[POSITION] || isFriendlyFire(world, hero, enemy)) return;
  for (const pet of world.getEntities([TAMEABLE, BEHAVIOUR])) {
    if (pet[TAMEABLE].owner !== world.getEntityId(hero) || pet[TAMEABLE].ghost)
      continue;
    if ((pet[TAMEABLE].attributes.aggression === false) !== defending) continue;
    const memory = petMemory(pet);
    if (memory) memory.opponent = world.getEntityId(enemy);
  }
};

export const getPetCombatTarget = (
  world: World,
  pet: Pet,
  hero: TypedEntity
) => {
  const memory = petMemory(pet);
  if (!memory?.opponent) return;
  const enemy = world.getEntityByIdAndComponents(memory.opponent, [POSITION]);
  delete memory.opponent;
  if (enemy && isFightable(world, enemy) && !isFriendlyFire(world, hero, enemy))
    return enemy;
};

export const rewardPetKill = (
  world: World,
  hero: TypedEntity,
  enemy: TypedEntity
) => {
  if (
    !hero[STATS] ||
    isDead(world, hero) ||
    isFriendlyFire(world, hero, enemy) ||
    isNeutral(world, enemy)
  )
    return;
  for (const pet of world.getEntities([TAMEABLE, POSITION])) {
    const tame = pet[TAMEABLE];
    if (
      tame.owner !== world.getEntityId(hero) ||
      tame.ghost ||
      isDead(world, pet)
    )
      continue;
    if (tame.skills.includes("heal") && hero[STATS].hp < hero[STATS].maxHp) {
      tame.healingHits = (tame.healingHits ?? 0) + 1;
    }
    if (tame.skills.includes("mana")) {
      tame.kills = ((tame.kills || 0) + 1) % 2;
      if (tame.kills === 0) {
        addToInventory(world, pet, { [ITEM]: { stat: "mp", amount: 1 } }, 1);
      }
    }
  }
};

export const shootPetDisc = (
  world: World,
  pet: Pet,
  target: TypedEntity<"POSITION">
) => {
  if (!pet[TAMEABLE].skills.includes("disc")) return false;
  const memory = petMemory(pet);
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  if (!memory || memory.nextDisc > generation) return false;
  const distance = getDistance(
    pet[POSITION],
    target[POSITION],
    world.metadata.gameEntity[LEVEL].size,
    1
  );
  if (distance < 3 && pet[STATS].hp >= pet[STATS].maxHp / 2) return false;
  const disc = shootHoming(world, pet, {
    type: "goldDisc",
    target: world.getEntityId(target),
    positions: [],
  });
  disc[BELONGABLE].faction = pet[BELONGABLE]!.faction;
  memory.nextDisc = generation + 6;
  return true;
};

const foodStat = (item: TypedEntity<"ITEM">) => {
  const food = getPetConsumption(item);
  return food && food.amount > 0 ? food.countable : undefined;
};

export const runPetForaging = (
  world: World,
  pet: Pet,
  hero: TypedEntity<"POSITION" | "STATS">,
  moveTo: (
    position: Position,
    following?: boolean,
    mustReach?: boolean
  ) => boolean,
  resting = false,
  sight = getSightCells(hero)
) => {
  const memory = petMemory(pet);
  const tame = pet[TAMEABLE];
  if (!memory) return false;
  if (getSequence(world, pet, "collect")) return true;

  if (memory.offering !== undefined) {
    const offering = world.getEntityByIdAndComponents(memory.offering, [ITEM]);
    delete memory.offering;
    if (offering && feedPet(world, pet, hero, offering)) return true;
  }

  const level = world.metadata.gameEntity[LEVEL];
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  const distance = (p: Position) =>
    getDistance(pet[POSITION], p, level.size, 1);
  const isHungry =
    !resting &&
    !tame.ghost &&
    pet[STATS].hp <
      pet[STATS].maxHp * (tame.attributes.hunger === true ? 1 : 0.5);
  const carried = pet[INVENTORY].items.map((id) =>
    world.assertByIdAndComponents(id, [ITEM, SPRITE])
  );
  const ownFood = isHungry && carried.find((item) => foodStat(item) === "hp");
  if (ownFood && feedPet(world, pet, pet, ownFood)) return true;
  const foodFirst = isHungry && tame.attributes.hunger === true;
  const canGather = tame.owner !== undefined && !tame.ghost;
  const cargo = carried.filter((item) => !item[ITEM].bound);
  const types: typeof cargo = [];
  for (const item of cargo) {
    if (!types.some((other) => matchesItem(world, item[ITEM], other[ITEM])))
      types.push(item);
  }
  if (canGather && types.length >= 4) memory.delivering = true;
  const wantLoot = canGather && !foodFirst && tame.skills.includes("collect");
  const reserve = new Set(carried.map(foodStat));
  const dig = memory.dug as Position | undefined;
  const heroId = world.getEntityId(hero);
  const candidates: {
    carrier: TypedEntity<"POSITION">;
    id: number;
    distance: number;
    priority: number;
  }[] = [];
  for (const position of types.length >= 4 ? [] : sight) {
    for (const carrier of getCellEntities(world, position)) {
      const loot = carrier[LOOTABLE];
      if (
        !loot?.disposable ||
        !carrier[INVENTORY] ||
        !onSameLayer(world, pet, carrier) ||
        (loot.droppedBy !== undefined && loot.droppedBy !== heroId) ||
        carrier[MOVABLE]?.swimming ||
        carrier[HOOKABLE]?.hooked ||
        carrier[HOOKABLE]?.catching
      )
        continue;
      for (const id of carrier[INVENTORY].items) {
        const item = world.assertByIdAndComponents(id, [ITEM]);
        if (
          item[ITEM].bound ||
          !Number.isFinite(item[ITEM].amount) ||
          (item[ITEM].stat === "xp" && !item[ITEM].material)
        )
          continue;
        const offering =
          loot.droppedBy === heroId && isPetOffering(world, pet, hero, item);
        const stat = foodStat(item);
        const food = isHungry && stat === "hp";
        const dug = dig && dig.x === position.x && dig.y === position.y;
        const supply =
          canGather &&
          !resting &&
          tame.attributes.hunger === false &&
          (stat === "hp" || stat === "mp") &&
          !reserve.has(stat);
        const gather =
          !memory.delivering &&
          (wantLoot || supply || (canGather && !resting && dug));
        if (!offering && !food && !gather) continue;
        const priority = offering ? 0 : food ? 1 : 2;
        candidates.push({
          carrier,
          id,
          distance: distance(position),
          priority,
        });
      }
    }
  }
  candidates.sort((a, b) => a.priority - b.priority || a.distance - b.distance);
  for (const candidate of candidates) {
    if (candidate.distance > 1) {
      const position = candidate.carrier[POSITION];
      if (
        (tame.ghost ||
          orientations.some((side) =>
            isPathable(
              world,
              combine(level.size, position, orientationPoints[side])
            )
          )) &&
        moveTo(position, false, true)
      )
        return true;
    } else if (
      collectItem(world, pet, candidate.carrier, undefined, candidate.id)
    ) {
      if (candidate.priority === 0) memory.offering = getSequence(world, pet, "collect")?.args.itemId;
      return true;
    }
  }
  if (!canGather || (resting && !memory.delivering)) return false;

  reserve.clear();
  for (const item of cargo) {
    const stat = foodStat(item);
    let keep = 0;
    if (
      tame.attributes.hunger === false &&
      (stat === "hp" || stat === "mp") &&
      !reserve.has(stat)
    ) {
      reserve.add(stat);
      if (
        hero[STATS][stat] >=
        hero[STATS][stat === "hp" ? "maxHp" : "maxMp"] / 2
      )
        keep = 1;
    }
    if (item[ITEM].amount <= keep) continue;
    memory.delivering = true;
    const front = combine(
      level.size,
      hero[POSITION],
      orientationPoints[hero[ORIENTABLE]?.facing || "down"]
    );
    return !!iterateMatrixFromCenter(level.cells, front, (x, y) => {
      const destination = { x, y };
      if (!isWalkable(world, destination, pet) || getBurning(world, destination)) return false;
      if (distance(destination) === 1) {
        dropBagItem(world, pet, item, destination, item[ITEM].amount - keep);
        return true;
      }
      const beside = orientations
        .map(side => combine(level.size, destination, orientationPoints[side]))
        .filter(p => isPathable(world, p))
        .sort((a, b) => distance(a) - distance(b));
      return beside.some(p => moveTo(p, true, true));
    }, 1);
  }
  delete memory.delivering;

  if (!tame.skills.includes("harvest") || memory.nextHarvest > generation)
    return false;
  delete memory.dug;
  memory.nextHarvest = generation + random(12, 25);
  for (const facing of orientations) {
    const position = combine(
      level.size,
      pet[POSITION],
      orientationPoints[facing]
    );
    const target = getHarvestable(world, position);
    if (!target || !target[HARVESTABLE].amount) continue;
    const resource = target[HARVESTABLE].resource;
    const tree = ["tree", "glacier_tree", "birch", "oak", "palm"].includes(
      resource
    );
    if (tree || resource === "mountain") {
      addToInventory(world, pet, { [ITEM]: { stackable: tree ? "stick" : "ore", amount: 1 } }, 1);
    } else if (
      harvestTools[resource] === "shovel" &&
      !trenchResources.includes(resource) &&
      getHarvestConfig(resource).yields.length
    ) {
      harvestResource(world, target, 1);
      memory.dug = position;
    } else continue;
    if (pet[BUMPABLE]) bumpEntity(world, pet, facing);
    if (target[BUMPABLE]) bumpEntity(world, target, facing);
    return true;
  }
  return false;
};
