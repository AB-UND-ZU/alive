import {
  craftedFavourites,
  fishFavourites,
  petLevels,
  startingFavourites,
} from "../../game/balancing/pets";
import { populateItems } from "../../bindings/creation";
import { choice, shuffle } from "../../game/math/std";
import { colors } from "../../game/assets/colors";
import { halo } from "../../game/assets/sprites";
import { resolveSprite, spriteRef } from "../../game/assets/spriteIds";
import {
  addBackground,
  createDialog,
  mergeSprites,
  recolorSprite,
} from "../../game/assets/ui";
import { getItemSprite } from "../../game/assets/utils";
import { World } from "../ecs";
import { entities } from "..";
import { REFERENCE } from "../components/reference";
import { RENDERABLE } from "../components/renderable";
import { getHasteInterval } from "./movement";
import { hasComponent, requireComponent, TypedEntity } from "../entities";
import { AFFECTABLE, getEmptyAffectable } from "../components/affectable";
import { ATTACKABLE } from "../components/attackable";
import { BELONGABLE } from "../components/belongable";
import { INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { EQUIPPABLE } from "../components/equippable";
import { MOVABLE } from "../components/movable";
import { PLAYER } from "../components/player";
import { Sprite, SPRITE } from "../components/sprite";
import { STATS, Stats } from "../components/stats";
import {
  PetFood,
  petSkills,
  petTraits,
  Tameable,
  TAMEABLE,
} from "../components/tameable";
import { TOOLTIP } from "../components/tooltip";
import { addToInventory } from "./collect";
import {
  consumptionConfigs,
  getItemConsumption,
  StackableConsumption,
} from "./consume";
import { matchesItem } from "./popup";
import { rerenderEntity } from "./renderer";
import { spendItem } from "./trigger";
import { releaseXp } from "./leveling";
import { disposeSequence } from "./map";
import { replaceSequence } from "./sequence";
import { ProgressSequence } from "../components/sequencable";

export const petFoodSprite = (item: PetFood) =>
  recolorSprite(getItemSprite(item), {
    [colors.black]: colors.white,
    [colors.white]: colors.black,
  });

function maxPetHp(state: Tameable, level: number) {
  const bonus =
    (state.stat === "hp" ? 15 : 0) +
    (state.attributes.survival === false ? 10 : 0);
  return Math.round((petLevels[level].hp * (100 + bonus)) / 100);
}

export function setPetDialog(world: World, pet: TypedEntity, message?: string | Sprite) {
  const tooltip = requireComponent(pet, TOOLTIP);
  if (!message && !tooltip.dialogs.length) return;
  disposeSequence(world, pet, "dialog");
  if (message) delete tooltip.lastTooltip;
  tooltip.dialogs = message
    ? [createDialog(typeof message === "string" ? message : addBackground([message]))]
    : [];
  tooltip.changed = true;
}

function petInterval(world: World, stats: Stats, state: Tameable) {
  return (
    getHasteInterval(world, stats.haste) *
    (state.attributes.moody === false ? 1.1 : 1)
  );
}

export function initializePet(world: World, pet: TypedEntity) {
  const stats = requireComponent(pet, STATS);
  const traits = shuffle([...petTraits]);
  const state: Tameable = {
    favourites: [...startingFavourites],
    stat: choice("hp", "melee", "armor", "haste"),
    attributes: {
      [traits[0]]: true,
      [traits[1]]: true,
      [traits[2]]: false,
      [traits[3]]: false,
    },
    skills: [],
  };
  stats.maxHp = stats.hp = maxPetHp(state, stats.level);
  stats.power +=
    Number(state.stat === "melee") + Number(state.attributes.moody === true);
  stats.armor +=
    Number(state.stat === "armor") +
    Number(state.attributes.movement === false);
  stats.haste +=
    Number(state.stat === "haste") +
    Number(state.attributes.distance === false);
  const frame = entities.createFrame(world, {
    [REFERENCE]: {
      tick: petInterval(world, stats, state),
      delta: 0,
      suspended: false,
      suspensionCounter: -1,
    },
    [RENDERABLE]: { generation: 0 },
  });
  requireComponent(pet, MOVABLE).reference = world.getEntityId(frame);
  world.addComponentToEntity(pet, TAMEABLE, state);
}

function learnPetLevel(
  world: World,
  pet: TypedEntity,
  state: Tameable,
  stats: Stats
) {
  stats.xp -= stats.maxXp;
  stats.level++;
  if (stats.level > 1) stats.power++;
  if (stats.level === 2) {
    stats.haste++;
    const clock = world.assertByIdAndComponents(
      requireComponent(pet, MOVABLE).reference,
      [REFERENCE]
    )[REFERENCE];
    const interval = petInterval(world, stats, state);
    clock.delta = Math.min(clock.delta / clock.tick, 1) * interval;
    clock.tick = interval;
  }
  stats.maxXp = petLevels[stats.level].maxXp;
  const maxHp = maxPetHp(state, stats.level);
  stats.hp += maxHp - stats.maxHp;
  stats.maxHp = maxHp;
  const skill = choice(
    ...petSkills.filter((skill) => !state.skills.includes(skill))
  );
  state.skills.push(skill);
  if ((skill === "attack" || skill === "heal") && !pet[EQUIPPABLE]?.weapon) {
    populateItems(world, world.assertComponents(pet, [INVENTORY, "POSITION"]), [
      { weapon: "sword", material: "iron", amount: 0, bound: true },
    ]);
  }
  replaceSequence<"progress", ProgressSequence>(
    world,
    pet,
    "progress",
    "levelUp",
    {
      level: stats.level,
      ring: 0,
      note: 0,
      xp: 0,
      maxHp: 0,
      maxMp: 0,
      maxXp: stats.maxXp,
    }
  );
  const choices = stats.level === 1 ? fishFavourites
    : stats.level === 2 ? craftedFavourites
    : [...fishFavourites, ...craftedFavourites];
  state.favourites.push(
    choice(...choices.filter(({ item }) => !petFavourite(world, state, item)))
  );
}

export function petKnockout(world: World, pet: TypedEntity) {
  const state = requireComponent(pet, TAMEABLE);
  if (state.ghost) return;
  state.ghost = requireComponent(pet, SPRITE);
  pet[SPRITE] = spriteRef(
    mergeSprites(recolorSprite(resolveSprite(state.ghost), colors.grey), halo)
  );
  requireComponent(pet, MOVABLE).flying = true;
  requireComponent(pet, TOOLTIP).override = undefined;
  requireComponent(pet, TOOLTIP).idle = undefined;
  setPetDialog(world, pet);
  if (hasComponent(pet, ATTACKABLE))
    world.removeComponentFromEntity(pet, ATTACKABLE);
  if (hasComponent(pet, AFFECTABLE))
    world.removeComponentFromEntity(pet, AFFECTABLE);
  rerenderEntity(world, pet);
}

function petFavourite(world: World, state: Tameable, food: PetFood) {
  return state.favourites.find(({ item }) => matchesItem(world, item, food));
}

export function getPetConsumption(
  food: TypedEntity<"ITEM">
): StackableConsumption | undefined {
  const item = food[ITEM];
  return item.consume === "potion" && item.material && item.stat
    ? consumptionConfigs.potion?.[item.material]?.[item.stat]
    : getItemConsumption(food);
}

const isWaterBucket = (item: PetFood) =>
  item.consume === "bucket" && item.element === "water";

export function isPetOffering(
  world: World,
  pet: TypedEntity,
  giver: TypedEntity,
  food: TypedEntity<"ITEM">
) {
  const state = pet[TAMEABLE];
  const stats = pet[STATS];
  if (
    !state ||
    !stats ||
    !giver[PLAYER] ||
    food[ITEM].amount < 1 ||
    (!state.ghost && stats.hp <= 0) ||
    (state.owner !== undefined && state.owner !== world.getEntityId(giver))
  )
    return false;
  const favourite = petFavourite(world, state, food[ITEM]);
  if (state.ghost || state.owner === undefined) return !!favourite;
  if (favourite) return true;
  if (isWaterBucket(food[ITEM])) return state.thirsty || stats.hp < stats.maxHp;
  const effect = getPetConsumption(food);
  return (
    !!effect &&
    effect.amount > 0 &&
    ((effect.countable === "hp" && stats.hp < stats.maxHp) ||
      (effect.countable === "mp" && stats.mp < stats.maxMp))
  );
}

export function gainPetXp(
  world: World,
  pet: TypedEntity,
  owner: number,
  amount: number
) {
  const state = pet[TAMEABLE];
  const stats = pet[STATS];
  if (!state || !stats || stats.hp <= 0 || stats.level >= petLevels.length - 1)
    return;
  stats.xp += amount;
  if (stats.xp < stats.maxXp) return;
  learnPetLevel(world, pet, state, stats);
  if (state.owner === undefined) {
    state.owner = owner;
    requireComponent(pet, BELONGABLE).faction = "settler";
    setPetDialog(world, pet);
  }
}

export function feedPet(
  world: World,
  pet: TypedEntity,
  giver: TypedEntity,
  food: TypedEntity<"ITEM">
): boolean {
  const state = pet[TAMEABLE];
  const self = giver === pet;
  if (
    !state ||
    food[ITEM].amount < 1 ||
    !pet[INVENTORY]?.items.includes(world.getEntityId(food)) ||
    (!self && !isPetOffering(world, pet, giver, food))
  )
    return false;
  const item = food[ITEM];
  const favourite = petFavourite(world, state, item);
  if ((state.ghost || (!self && state.owner === undefined)) && !favourite)
    return false;
  const water = isWaterBucket(item);
  const consumption = getPetConsumption(food);
  if (!water && (!consumption || consumption.amount <= 0)) return false;
  const stats = requireComponent(pet, STATS);
  if (
    self &&
    (state.ghost ||
      !consumption ||
      consumption.countable !== "hp" ||
      stats.hp >= stats.maxHp)
  )
    return false;

  spendItem(world, pet, { ...item, amount: 1 }, food);
  if (water) {
    addToInventory(
      world,
      pet,
      { [ITEM]: { consume: "bucket", material: item.material, amount: 1 } },
      1
    );
    stats.hp = Math.min(
      stats.maxHp,
      stats.hp + (state.attributes.thirst === true ? 4 : 2)
    );
    state.thirsty = false;
  } else if (state.ghost) {
    pet[SPRITE] = state.ghost;
    delete state.ghost;
    requireComponent(pet, MOVABLE).flying = false;
    world.addComponentToEntity(pet, ATTACKABLE, { scratchColor: colors.grey });
    world.addComponentToEntity(pet, AFFECTABLE, getEmptyAffectable());
    stats.hp = stats.maxHp;
    setPetDialog(world, pet);
  } else if (consumption) {
    const stat = consumption.countable;
    const max =
      stat === "hp" ? stats.maxHp : stat === "mp" ? stats.maxMp : stats.maxXp;
    const amount = consumption.percentage
      ? Math.round((max * consumption.amount) / 100)
      : consumption.amount;
    stats[stat] = Math.min(max, stats[stat] + amount * (favourite ? 2 : 1));
    if (
      favourite &&
      (!self || state.owner !== undefined) &&
      stats.level < petLevels.length - 1
    ) {
      releaseXp(world, world.assertComponents(pet, ["POSITION"]), {
        pet: world.getEntityId(pet),
        owner: state.owner ?? world.getEntityId(giver),
        xp: favourite.xp,
      });
    }
  }
  rerenderEntity(world, pet);
  return true;
}
