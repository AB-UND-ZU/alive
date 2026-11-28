import { PLAYER } from "../components/player";
import { blocked, heart } from "../../game/assets/sprites";
import {
  sleep1,
  sleep2,
} from "../../game/assets/ui";
import { BEHAVIOUR } from "../components/behaviour";
import {
  findPath,
  invertOrientation,
  relativeOrientations,
  rotateOrientation,
} from "../../game/math/path";
import { choice, combine, getDistance, random, signedDistance } from "../../game/math/std";
import { BUMPABLE } from "../components/bumpable";
import { traceCircularVisiblity } from "../../game/math/tracing";
import { FRAGMENT } from "../components/fragment";
import { HARVESTABLE } from "../components/harvestable";
import { LAYER } from "../components/layer";
import { LEVEL } from "../components/level";
import { LOCKABLE } from "../components/lockable";
import { MOVABLE } from "../components/movable";
import { NPC } from "../components/npc";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
  orientations,
} from "../components/orientable";
import { Position, POSITION } from "../components/position";
import { Sprite } from "../components/sprite";
import { STATS } from "../components/stats";
import { TAMEABLE } from "../components/tameable";
import { TOOLTIP } from "../components/tooltip";
import { World } from "../ecs";
import { TypedEntity } from "../entities";
import { bumpEntity } from "../motion";
import { isDead, isEnemy, isFightable, isNeutral } from "./damage";
import { getEnterable, getFragment } from "./enter";
import { getHarvestable, harvestResource } from "./harvest";
import { isImmersible } from "./immersion";
import { getCellEntities } from "./map";
import { isFlyable, isPathable, isWalkable } from "./movement";
import { petFoodSprite, setPetDialog } from "./petCare";
import { getPetCombatTarget, runPetForaging, shootPetDisc, startPetAura } from "./petSkills";
import { rerenderEntity } from "./renderer";
import { getEntityVision } from "./visibility";

type Pet = TypedEntity<
  "BEHAVIOUR" | "TAMEABLE" | "POSITION" | "MOVABLE" | "STATS" | "TOOLTIP" | "INVENTORY"
>;
type Memory = {
  target?: number;
  attacker?: number;
  fleeUntil?: number;
  heal?: number;
  door?: Position;
  structure?: number;
  position?: Position;
  neighbors?: string;
  idle?: number;
  sleeping?: number;
  nextRecovery?: number;
  circle?: number;
  refuseUntil?: number;
  nextSpeech?: number;
  walkSpots?: Position[];
  nextWalk?: number;
};

const plantResources = new Set([
  "plant",
  "tree",
  "glacier_tree",
  "birch",
  "oak",
  "palm",
  "grass",
  "bush",
  "flower",
  "berry",
  "sapling",
  "hedge",
]);

export function updatePet(
  world: World,
  pet: Pet,
  memory: Memory,
  tick: number
) {
  const tame = pet[TAMEABLE];
  if (!tame.ghost && tame.skills.includes("aura")) startPetAura(world, pet);
  const hero = world.getEntityByIdAndComponents(tame.owner, [POSITION, STATS]);
  const position = pet[POSITION];
  const { walkable, size } = world.metadata.gameEntity[LEVEL];
  const around = (point: Position, side: Orientation, steps = 1) => {
    const delta = orientationPoints[side];
    return combine(size, point, { x: delta.x * steps, y: delta.y * steps });
  };
  const distance = (a: Position, b: Position) =>
    getDistance(a, b, size, 1, false);
  const stats = pet[STATS];
  const near = orientations.map((side) => around(position, side));
  const waterShy = tame.attributes.water === false;
  const outside = (p: Position) => !getEnterable(world, p);
  const canStep = (p: Position) =>
    outside(p) && (tame.ghost ? isFlyable(world, p) : isPathable(world, p));
  const moveTo = (target: Position, following = false, mustReach = false) => {
    if (distance(position, target) === 0) return false;
    const directions = relativeOrientations(world, position, target, 1);
    const direct = directions.find((side) => {
      const next = around(position, side);
      return (
        distance(next, target) === 0 &&
        outside(next) &&
        (!waterShy || !isImmersible(world, next) || following) &&
        (!following || canStep(next))
      );
    });
    if (direct || tame.ghost) {
      pet[MOVABLE].orientations = direct
        ? [direct]
        : directions.filter((side) => canStep(around(position, side)));
      return pet[MOVABLE].orientations.length > 0;
    }
    const next = findPath(
      walkable,
      position,
      target,
      true,
      mustReach,
      undefined,
      (x, y) => {
        const p = { x, y };
        if (!outside(p)) return 0;
        if (waterShy && isImmersible(world, p))
          return following ? size * size : 0;
        return 1;
      }
    )[0];
    if (
      next &&
      (canStep(next) ||
        (!following && distance(next, target) === 0 && outside(next)))
    ) {
      pet[MOVABLE].orientations = relativeOrientations(
        world,
        position,
        next,
        1
      );
      return true;
    }
    return false;
  };
  const preference = tame.attributes.distance === true
    ? 2
    : tame.attributes.distance === false
    ? 4
    : 3;
  const stepsBetween = (a: Position, b: Position) =>
    Math.abs(signedDistance(a.x, b.x, size)) + Math.abs(signedDistance(a.y, b.y, size));
  const follow = () => {
    if (hero && stepsBetween(position, hero[POSITION]) > preference) moveTo(hero[POSITION], true);
  };
  const openStep = (side: Orientation) => {
    const next = around(position, side);
    return outside(next) && (tame.ghost ? isFlyable(world, next) : isWalkable(world, next)) &&
      (!waterShy || !isImmersible(world, next));
  };
  const sidestepOwner = () => {
    if (!hero) return false;
    const crossing = pet[MOVABLE].pendingOrientation;
    if (crossing) {
      delete pet[MOVABLE].pendingOrientation;
      if (openStep(crossing)) {
        pet[MOVABLE].orientations = [crossing];
        return true;
      }
    }
    if (distance(position, hero[POSITION]) !== 0) return false;
    const heading = crossing ? invertOrientation(crossing) : hero[ORIENTABLE]?.facing ?? "down";
    const step = [1, -1, 2, 0].map(turn => rotateOrientation(heading, turn)).find(openStep);
    if (step) pet[MOVABLE].orientations = [step];
    return !!step;
  };
  const observer = hero ?? world.getEntity([PLAYER, POSITION, STATS]);
  if (tame.owner === undefined || tame.ghost) {
    if (!observer || distance(position, observer[POSITION]) > 1) {
      delete memory.nextSpeech;
      setPetDialog(world, pet);
    } else if (tick >= (memory.nextSpeech ?? 0)) {
      memory.nextSpeech = tick + random(15, 45);
      setPetDialog(world, pet, random(1, 3) === 1 ? petFoodSprite(choice(...tame.favourites).item) : undefined);
    }
  }
  const waitOutside = () => {
    const structure = hero?.[LAYER]?.structure;
    if (structure) {
      if (structure !== memory.structure) {
        memory.structure = structure;
        memory.door = world
          .getEntities([LOCKABLE, POSITION])
          .find(
            (door) =>
              getFragment(world, door[POSITION])?.[FRAGMENT].structure ===
              structure
          )?.[POSITION];
      }
      if (memory.door) {
        const door = memory.door;
        const waiting = [-1, 1]
          .map((x) => combine(size, door, { x, y: 1 }))
          .concat(orientations.map((side) => around(door, side)))
          .filter(
            (p) => outside(p) && (canStep(p) || !distance(p, position))
          )[0];
        if (waiting) moveTo(waiting, true);
      }
      return true;
    }
    memory.structure = undefined;
    return false;
  };
  if (tame.ghost) {
    if (sidestepOwner()) return;
    if (observer && runPetForaging(world, pet, observer, moveTo, true)) return;
    if (!waitOutside()) follow();
    return;
  }

  const neighbors = [position, ...near]
    .concat(
      [-1, 1].flatMap((x) =>
        [-1, 1].map((y) => combine(size, position, { x, y }))
      )
    )
    .flatMap((p) =>
      getCellEntities(world, p)
        .filter((unit) => unit !== pet && !!unit[MOVABLE])
        .map((unit) => `${world.getEntityId(unit)}@${p.x},${p.y}`)
    )
    .join(";");
  const moved = memory.position && distance(position, memory.position) > 0;
  const stirred =
    neighbors !== memory.neighbors && memory.neighbors !== undefined;
  memory.position = { ...position };
  memory.neighbors = neighbors;
  memory.idle = moved || stirred ? 0 : (memory.idle ?? 0) + 1;
  if (hero && hero[STATS].hp >= hero[STATS].maxHp) delete tame.healingHits;
  const napAfter =
    (tame.attributes.movement === false ? 12 : 36) *
    (tame.attributes.moody === false ? 2 : 1);
  const vision = getEntityVision(world, pet).visibility;
  const visible = traceCircularVisiblity(world, position, vision);
  const nearest = visible
    .flatMap((cell) => getCellEntities(world, cell))
    .filter(
      (unit) =>
        unit[NPC] &&
        unit !== pet &&
        isEnemy(world, unit) &&
        !isNeutral(world, unit) &&
        unit[LAYER]?.structure === pet[LAYER]?.structure &&
        isFightable(world, unit)
    )
    .sort(
      (a, b) =>
        distance(position, a[POSITION]) - distance(position, b[POSITION])
    )[0];
  const combat = tame.skills.includes("attack") || tame.skills.includes("disc");
  const current = world.getEntityByIdAndComponents(memory.target, [POSITION]);
  const target =
    combat && hero
      ? current && isFightable(world, current)
        ? current
        : getPetCombatTarget(world, pet, hero) ??
          (tame.attributes.aggression === true ? nearest : undefined)
      : undefined;
  memory.target = target && world.getEntityId(target);
  if (tame.owner !== undefined || stats.hp >= stats.maxHp) delete memory.attacker;
  const attacker = world.getEntityByIdAndComponents(memory.attacker, [POSITION]);
  const threat = attacker ?? target ?? nearest;
  const retreatAt = tame.attributes.survival === true
    ? 0
    : tame.attributes.survival === false
    ? 0.5
    : 0.25;
  const danger =
    attacker || target || (nearest && distance(position, nearest[POSITION]) <= 3);
  const offering = memory.sleeping !== undefined && !danger && observer &&
    runPetForaging(world, pet, observer, moveTo, true);
  if (memory.sleeping !== undefined && (stirred || moved || danger || offering || tame.healingHits)) {
    memory.idle = 0;
    memory.sleeping = undefined;
    pet[TOOLTIP].idle = undefined;
    pet[TOOLTIP].override = undefined;
    pet[TOOLTIP].changed = true;
  }
  if (offering) return;
  if (memory.sleeping === undefined && !danger && !tame.healingHits && memory.idle >= napAfter) {
    memory.sleeping = tick;
    memory.nextRecovery = tick + 3;
  }
  if (memory.sleeping !== undefined) {
    const elapsed = tick - memory.sleeping;
    const idle = elapsed % 2 ? sleep2 : sleep1;
    if (pet[TOOLTIP].idle !== idle) {
      pet[TOOLTIP].idle = idle;
      pet[TOOLTIP].override = "idle";
      pet[TOOLTIP].changed = true;
    }
    if (tick >= (memory.nextRecovery ?? tick + 3)) {
      memory.nextRecovery = tick + 3;
      if (stats.hp >= stats.maxHp) return;
      stats.hp = Math.min(stats.maxHp, stats.hp + 2);
      rerenderEntity(world, pet);
    }
    return;
  }
  if (sidestepOwner()) return;
  if (threat && (!target || stats.hp <= stats.maxHp * retreatAt)) {
    if (target && tame.skills.includes("disc"))
      shootPetDisc(world, pet, target);
    if (distance(position, threat[POSITION]) <= 3 || (attacker && tick < (memory.fleeUntil ?? 0))) {
      const steps = orientations.filter(openStep);
      if (hero) {
        // Get out of melee and straight attack lanes, then regroup with the owner.
        const dangerAt = (p: Position) => distance(p, threat[POSITION]) <= 1 ? 2 :
          Number(p.x === threat[POSITION].x || p.y === threat[POSITION].y);
        const gap = (p: Position) => Math.max(0, stepsBetween(p, hero[POSITION]) - preference);
        const safest = [position, ...steps.map(side => around(position, side))]
          .sort((a, b) => dangerAt(a) - dangerAt(b) || gap(a) - gap(b))[0];
        if (safest !== position) moveTo(safest);
      } else {
        steps.sort((a, b) => getDistance(around(position, b), threat[POSITION], size, 1) -
          getDistance(around(position, a), threat[POSITION], size, 1));
        pet[MOVABLE].orientations = steps.slice(0, 1);
      }
      return;
    }
    if (target || attacker) { follow(); return; }
  } else if (hero && tame.healingHits && !hero[LAYER]?.structure && !isDead(world, hero)) {
    moveTo(hero[POSITION]);
    return;
  } else if (target) {
    memory.idle = 0;
    if (
      tick >= (memory.refuseUntil ?? 0) &&
      tame.attributes.moody === true &&
      random(1, 32) === 1
    ) {
      setPetDialog(world, pet, blocked);
      memory.refuseUntil = tick + 3;
    }
    if (tick < (memory.refuseUntil ?? 0)) return;
    if (
      tame.skills.includes("disc") &&
      distance(position, target[POSITION]) > 1 &&
      shootPetDisc(world, pet, target)
    )
      return;
    if (tame.skills.includes("attack")) moveTo(target[POSITION]);
    return;
  }

  if (!hero) {
    if (observer && runPetForaging(world, pet, observer, moveTo)) return;
    if (tame.owner !== undefined || (observer && distance(position, observer[POSITION]) <= 1)) return;
    const patterns = pet[BEHAVIOUR].patterns;
    memory.walkSpots ??= visible.filter(p => distance(position, p) <= 5 && canStep(p));
    if (tick >= (memory.nextWalk ?? 0)) {
      const walk = patterns.findIndex(pattern => pattern.name === "move");
      if (walk !== -1) patterns.splice(walk, 1);
      const spots = memory.walkSpots.filter(p => distance(position, p) > 1 && canStep(p) &&
        !(waterShy && isImmersible(world, p)));
      if (spots.length) patterns.push({ name: "move", memory: { targetPosition: choice(...spots) } });
      memory.nextWalk = tick + random(9, 20);
      return;
    }
    return true;
  }
  if (waitOutside()) return;

  if (runPetForaging(world, pet, hero, moveTo)) return;
  memory.nextSpeech ??= tick + random(15, 45);
  if (tick >= memory.nextSpeech) {
    const quiet = tame.attributes.vocal === false;
    const chatty = tame.attributes.vocal === true;
    memory.nextSpeech =
      tick +
      random(quiet ? 90 : chatty ? 28 : 55, quiet ? 180 : chatty ? 75 : 140);
    if (
      (stats.hp < stats.maxHp * (quiet ? 0.25 : 0.5) ||
        (!quiet && random(1, 5) === 1)) &&
      tame.favourites.length
    ) {
      const thirst = tame.attributes.thirst === true
        ? 2
        : tame.attributes.thirst === false
        ? 9
        : 5;
      tame.thirsty = random(1, thirst) === 1;
      setPetDialog(
        world,
        pet,
        petFoodSprite(
          tame.thirsty
            ? { consume: "bucket", material: "iron", element: "water" }
            : choice(...tame.favourites).item
        )
      );
    } else if (!quiet && random(1, chatty ? 2 : 5) === 1) {
      setPetDialog(world, pet, choice<string | Sprite>(heart, "...", "!", "?"));
    } else {
      setPetDialog(world, pet);
    }
  }
  const gap = stepsBetween(position, hero[POSITION]);
  if (gap > preference + Number(!!memory.circle)) {
    memory.circle = undefined;
    follow();
    return;
  }
  const plants = (p: Position) =>
    orientations
      .map((side) => getHarvestable(world, around(p, side)))
      .filter(
        (plant) => plant && plantResources.has(plant[HARVESTABLE].resource)
      );
  if (
    tame.attributes.aggression === true &&
    tame.attributes.plants !== true &&
    random(1, 14) === 1
  ) {
    const plant = plants(position)[0];
    if (plant?.[POSITION] && pet[BUMPABLE]) {
      const side = relativeOrientations(world, position, plant[POSITION], 1)[0];
      bumpEntity(world, pet, side);
      harvestResource(world, plant, 1);
      return;
    }
  }
  const surroundings = (p: Position) =>
    Number(tame.attributes.water === true && isImmersible(world, p)) +
    (tame.attributes.plants === true
      ? 1
      : tame.attributes.plants === false
      ? -1
      : 0) *
      Number(plants(p).length > 0);
  if (
    tame.attributes.water === true ||
    tame.attributes.plants === true ||
    tame.attributes.plants === false
  ) {
    const best = near
      .filter(
        (p) =>
          canStep(p) &&
          (!waterShy || !isImmersible(world, p)) &&
          Math.abs(stepsBetween(p, hero[POSITION]) - preference) <= 1
      )
      .sort((a, b) => surroundings(b) - surroundings(a))[0];
    const score = surroundings(position);
    if (best && surroundings(best) > score) {
      moveTo(best);
      return;
    }
    if (score > 0) return;
  }
  if (
    tame.attributes.movement === true &&
    (memory.circle || random(1, 24) === 1)
  ) {
    const index = memory.circle ?? 0;
    const side = orientations[index];
    if (
      canStep(around(position, side)) &&
      !(waterShy && isImmersible(world, around(position, side)))
    ) {
      pet[MOVABLE].orientations = [side];
      memory.circle = index === 3 ? undefined : index + 1;
      return;
    }
    memory.circle = undefined;
  }
  follow();
}
