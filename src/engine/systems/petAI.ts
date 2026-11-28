import { getIdentifierAndComponents } from "../utils";
import { boardPet } from "./vessel";
import { getPrecipitation } from "./water";
import { PLAYER } from "../components/player";
import { getItemSprite } from "../../game/assets/utils";
import { blocked, heart } from "../../game/assets/sprites";
import {
  createText,
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
import { isDead, isEnemy, isFightable, isFriendlyFire, isNeutral } from "./damage";
import { getEnterable, getFragment } from "./enter";
import { getHarvestable, getRefillElement } from "./harvest";
import { isImmersible } from "./immersion";
import { getBurning } from "./burn";
import { CASTABLE } from "../components/castable";
import { SEQUENCABLE } from "../components/sequencable";
import { getCellEntities } from "./map";
import { canSwimToBoat, isFloatable, isFlyable, isPathable, isWalkable } from "./movement";
import { ensurePetWeapon, petSkillSprite, setPetDialog } from "./petCare";
import { getPetCombatTarget, runPetForaging, shootPetDisc, startPetAura, providePetSupplies } from "./petSkills";
import { rerenderEntity } from "./renderer";
import { getEntityVision, getSightCells } from "./visibility";

type Pet = TypedEntity<
  "BEHAVIOUR" | "TAMEABLE" | "POSITION" | "MOVABLE" | "STATS" | "TOOLTIP" | "INVENTORY"
>;
type Memory = {
  target?: number;
  attacker?: number;
  hp?: number;
  fleeUntil?: number;
  heal?: number;
  landing?: boolean;
  door?: Position;
  structure?: number;
  position?: Position;
  neighbors?: string;
  idle?: number;
  sleeping?: number;
  nextRecovery?: number;
  circle?: number;
  refuseUntil?: number;
  playSince?: number;
  nextSpeech?: number;
  requested?: number;
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
  const inside = hero?.[LAYER]?.structure;
  const rain = inside && getIdentifierAndComponents(world, "storm", ["SEQUENCABLE"])?.SEQUENCABLE.states.weather?.args;
  const shelter = hero && rain && rain.type === "rain" && getPrecipitation(world, rain, hero[POSITION]) > 0;
  const allowedLayer = (p: Position) => {
    const interior = getEnterable(world, p);
    if (!interior) return true;
    const structure = interior[FRAGMENT]?.structure;
    return !!structure && (structure === pet[LAYER]?.structure || (!!shelter && structure === inside));
  };
  const swimmingToBoat = canSwimToBoat(world, pet);
  const dry = (p: Position) => getRefillElement(world, p) !== "water";
  const safe = (p: Position) => !getBurning(world, p) && allowedLayer(p);
  const canTraverse = (p: Position, walkable: boolean) =>
    tame.ghost ? isFlyable(world, p) : walkable || (swimmingToBoat && isFloatable(world, p));
  const canStep = (p: Position) => safe(p) && canTraverse(p, isPathable(world, p));
  const moveTo = (target: Position, following = false, mustReach = false, stopAt = 0) => {
    if (distance(position, target) === 0) return false;
    const directions = relativeOrientations(world, position, target, 1);
    const direct = directions.find((side) => {
      const next = around(position, side);
      return (
        distance(next, target) === 0 &&
        safe(next) &&
        (!waterShy || dry(next) || following) &&
        (!following || canStep(next))
      );
    });
    if (direct) {
      if (stopAt >= 1) return false;
      pet[MOVABLE].orientations = [direct];
      return true;
    }
    const path = findPath(
      walkable,
      position,
      target,
      true,
      mustReach,
      undefined,
      (x, y, terrain) => {
        const p = { x, y };
        if (!canTraverse(p, !!terrain) || !safe(p)) return 0;
        if (tame.ghost && hero && !distance(p, hero[POSITION])) return 0;
        if (!tame.ghost && waterShy && !dry(p))
          return following ? size * size : 0;
        return 1;
      }
    );
    if (path.length <= stopAt) return false;
    const next = path[0];
    if (
      next &&
      (canStep(next) ||
        (!following && distance(next, target) === 0 && safe(next)))
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
  const preference = Number(!!tame.ghost) + (tame.attributes.distance === true
    ? 2
    : tame.attributes.distance === false
    ? 4
    : 3);
  const stepsBetween = (a: Position, b: Position) =>
    Math.abs(signedDistance(a.x, b.x, size)) + Math.abs(signedDistance(a.y, b.y, size));
  const follow = () => {
    if (!hero || (stepsBetween(position, hero[POSITION]) <= preference &&
      getSightCells(hero).some(p => p.x === position.x && p.y === position.y))) return;
    moveTo(hero[POSITION], true, false, preference);
  };
  const openStep = (side: Orientation) => {
    const next = around(position, side);
    return safe(next) && (tame.ghost ? isFlyable(world, next) : isWalkable(world, next)) &&
      (!waterShy || dry(next));
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
  const boat = world.getEntityByIdAndComponents(hero?.[PLAYER]?.mount, ["MOUNTABLE", POSITION]);
  if (boat?.MOUNTABLE.medium === "water") {
    if (stepsBetween(position, boat[POSITION]) <= 1) boardPet(world, pet);
    else moveTo(boat[POSITION], true);
    return;
  }
  if (hero && memory.landing) {
    if (isImmersible(world, position)) {
      const shore = [hero[POSITION], ...orientations.map(side => around(hero[POSITION], side))]
        .filter(p => !isImmersible(world, p) && canStep(p))
        .sort((a, b) => distance(position, a) - distance(position, b));
      if (shore.some(p => moveTo(p, true, true))) return;
    } else {
      delete memory.landing;
    }
  }
  const observer = hero ?? world.getEntity([PLAYER, POSITION, STATS]);
  if (tame.expressionUntil !== undefined && tick >= tame.expressionUntil)
    setPetDialog(world, pet);
  const besideHero = observer && distance(position, observer[POSITION]) <= 1;
  if ((tame.owner === undefined || tame.ghost) && tame.expressionUntil === undefined) {
    if (!besideHero) {
      delete memory.requested;
      delete memory.nextSpeech;
      setPetDialog(world, pet);
    } else if (tame.ghost) {
      if (memory.requested === undefined || tick >= (memory.nextSpeech ?? 0)) {
        setPetDialog(world, pet, tame.favourites.map(({ item }) => getItemSprite(item)), 5);
        memory.requested = 0;
        memory.nextSpeech = tick + random(8, 12);
      }
    } else {
      const favourite = tame.favourites[0];
      const remaining = Math.ceil((stats.maxXp - stats.xp) / favourite.xp);
      if (memory.requested !== remaining || !pet[TOOLTIP].dialogs.length) {
        setPetDialog(world, pet, [
          ...createText(String(remaining)),
          getItemSprite(favourite.item),
        ]);
        pet[TOOLTIP].override = "visible";
        memory.requested = remaining;
      }
    }
  }
  const showingExpression = tame.expressionUntil !== undefined ||
    (tame.owner === undefined && besideHero);
  const waitOutside = () => {
    const structure = hero?.[LAYER]?.structure;
    if (structure) {
      if (shelter) {
        if (pet[LAYER]?.structure !== structure) {
          moveTo(hero[POSITION], true);
          return true;
        }
        return false;
      }
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
            (p) => !getEnterable(world, p) && (canStep(p) || !distance(p, position))
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
    if (observer && runPetForaging(world, pet, observer, moveTo, "resting")) return;
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
  const needsHealing = hero && tame.healingHits && hero[STATS].hp < hero[STATS].maxHp;
  const farFromOwner = hero && (!inside || shelter) &&
    stepsBetween(position, hero[POSITION]) > preference + 2;
  const napAfter =
    (tame.attributes.movement === false ? 12 : 36) *
    (tame.attributes.moody === false ? 2 : 1);
  const vision = getEntityVision(world, pet).visibility;
  const visible = traceCircularVisiblity(world, position, vision);
  const inSight = visible.flatMap((cell) => getCellEntities(world, cell));
  const enemies = inSight
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
    );
  const nearest = enemies[0];
  const fairy = enemies.find(unit => unit[NPC]?.type === "fairy");
  const combat = tame.skills.includes("attack") || tame.skills.includes("disc");
  const current = world.getEntityByIdAndComponents(memory.target, [POSITION]);
  const target =
    fairy ?? (combat && hero
      ? current && isFightable(world, current)
        ? current
        : getPetCombatTarget(world, pet, hero) ??
          (tame.attributes.aggression === true ? nearest : undefined)
      : undefined);
  memory.target = target && world.getEntityId(target);
  const hit = stats.hp < (memory.hp ?? stats.hp);
  memory.hp = stats.hp;
  if (stats.hp >= stats.maxHp) delete memory.attacker;
  const attacker = world.getEntityByIdAndComponents(memory.attacker, [POSITION]);
  if (tame.owner !== undefined) delete memory.attacker;
  const threat = attacker ?? target ?? nearest;
  const retreatAt = tame.attributes.survival === true
    ? 0
    : tame.attributes.survival === false
    ? 0.5
    : 0.25;
  // Look at active spell origins; individual effect cells appear only when hit.
  const incoming = world.getEntities([CASTABLE, SEQUENCABLE, POSITION]).filter(spell => {
    const cast = spell[SEQUENCABLE].states.spell;
    const { melee, magic, burn, freeze, knock } = spell[CASTABLE];
    return (cast?.name === "castWave1" || cast?.name === "castBeam1") &&
      (melee || magic || burn || freeze || knock || spell[CASTABLE].true) &&
      !isFriendlyFire(world, spell, pet) && distance(position, spell[POSITION]) <= cast.args.range;
  });
  const exposure = (p: Position) => incoming.reduce((risk, spell) => {
    const cast = spell[SEQUENCABLE].states.spell!;
    const dx = signedDistance(spell[POSITION].x, p.x, size);
    const dy = signedDistance(spell[POSITION].y, p.y, size);
    if (cast.name === "castBeam1") {
      const direction = orientationPoints[spell[ORIENTABLE]?.facing ?? "up"];
      const ahead = dx * direction.x + dy * direction.y;
      return risk + Number(dx * direction.y === dy * direction.x && ahead > 0 && ahead <= cast.args.range);
    }
    // Wave corners extend one cell beyond the diamond's sides.
    const radius = Math.abs(dx) + Math.abs(dy) - Number(!!dx && !!dy);
    return risk + Math.max(0, cast.args.range - radius);
  }, 0);
  const burning = !!getBurning(world, position);
  const dodge = exposure(position) || burning || hit;
  const danger =
    dodge || attacker || target || (nearest && distance(position, nearest[POSITION]) <= 3);
  const supporting = !dodge && hero && inside === pet[LAYER]?.structure && !isDead(world, hero) &&
    (!danger || stats.hp > stats.maxHp * retreatAt) &&
    ((needsHealing && moveTo(hero[POSITION])) || providePetSupplies(world, pet, hero, moveTo));
  const offering = !supporting && memory.sleeping !== undefined && !danger && observer &&
    runPetForaging(world, pet, observer, moveTo, "resting");
  if (memory.sleeping !== undefined && (stirred || moved || farFromOwner || danger || offering || supporting || needsHealing)) {
    memory.idle = 0;
    memory.sleeping = undefined;
    if (!showingExpression) setPetDialog(world, pet);
  }
  if (supporting || offering) return;
  if (memory.sleeping === undefined && !farFromOwner && !danger && !needsHealing && memory.idle >= napAfter) {
    memory.sleeping = tick;
    memory.nextRecovery = tick + 3;
  }
  if (memory.sleeping !== undefined) {
    const elapsed = tick - memory.sleeping;
    const idle = elapsed % 2 ? sleep2 : sleep1;
    if (!showingExpression && pet[TOOLTIP].idle !== idle) {
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
  if (dodge) {
    const avoid = (p: Position) => attacker && hit ? getDistance(p, attacker[POSITION], size, 1) : 0;
    const safer = [position, ...orientations.filter(openStep).map(side => around(position, side))]
      .sort((a, b) => exposure(a) - exposure(b) || avoid(b) - avoid(a) ||
        (burning || hit ? Number(a === position) - Number(b === position) : 0))[0];
    if (safer !== position && moveTo(safer)) return;
  }
  if (!dodge && danger && hero && !isDead(world, hero) && inside === pet[LAYER]?.structure) {
    const sight = stats.hp <= stats.maxHp * retreatAt ? [position, ...near] : getSightCells(hero);
    if (runPetForaging(world, pet, hero, moveTo, "combat", sight)) return;
  }
  if (threat && !fairy && (!target || stats.hp <= stats.maxHp * retreatAt)) {
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
  } else if (target) {
    memory.idle = 0;
    if (fairy) {
      ensurePetWeapon(world, pet);
      moveTo(fairy[POSITION]);
      return;
    }
    if (
      tick >= (memory.refuseUntil ?? 0) &&
      tame.attributes.moody === true &&
      random(1, 32) === 1
    ) {
      if (!showingExpression) setPetDialog(world, pet, blocked, 4);
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

  if (stats.hp < stats.maxHp && !hero?.[LAYER]?.structure) {
    const fountain = inSight.find(unit => unit[SEQUENCABLE]?.states.fountain);
    if (fountain) {
      if (distance(position, fountain[POSITION]) <= 1) return;
      if (moveTo(fountain[POSITION], true, true)) return;
    }
  }

  // A pet will occasionally scratch a chick beside it, even before taming.
  if (random(1, 1000) === 1) {
    const chick = inSight.find(unit => unit[NPC]?.type === "chick" &&
      unit[LAYER]?.structure === pet[LAYER]?.structure &&
      stepsBetween(position, unit[POSITION]) === 1 && isFightable(world, unit));
    if (chick && moveTo(chick[POSITION])) {
      ensurePetWeapon(world, pet);
      memory.target = world.getEntityId(chick);
      return;
    }
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
        (!waterShy || dry(p)));
      if (spots.length) patterns.push({ name: "move", memory: { targetPosition: choice(...spots) } });
      memory.nextWalk = tick + random(9, 20);
      return;
    }
    return true;
  }
  if (waitOutside()) return;

  if (runPetForaging(world, pet, hero, moveTo)) return;
  if (memory.refuseUntil !== undefined && tick < memory.refuseUntil) return;
  memory.nextSpeech ??= tick + random(15, 45);
  if (!showingExpression && tick >= memory.nextSpeech) {
    const quiet = tame.attributes.vocal === false;
    const chatty = tame.attributes.vocal === true;
    memory.nextSpeech =
      tick +
      random(quiet ? 90 : chatty ? 28 : 55, quiet ? 180 : chatty ? 75 : 140);
    if (
      (tame.thirsty || stats.hp < stats.maxHp * (quiet ? 0.25 : 0.5) ||
        (!quiet && random(1, 5) === 1)) &&
      tame.favourites.length
    ) {
      const thirst = tame.attributes.thirst === true
        ? 2
        : tame.attributes.thirst === false
        ? 9
        : 5;
      tame.thirsty ||= random(1, thirst) === 1;
      if (tame.thirsty) memory.nextSpeech = tick + random(quiet ? 15 : 8, quiet ? 24 : 14);
      setPetDialog(
        world,
        pet,
        getItemSprite(
          tame.thirsty
            ? { consume: "bucket", material: "iron", element: "water" }
            : choice(...tame.favourites).item
        )
      );
    } else if (memory.playSince !== undefined || random(1, 8) === 1) {
      memory.playSince ??= tick;
      if (tick - memory.playSince >= 120 && random(1, 4) === 1) {
        memory.refuseUntil = tick + 5;
        setPetDialog(world, pet, blocked, 5);
        return;
      }
      setPetDialog(world, pet, getItemSprite({ stackable: "stick" }), 5);
    } else if (!quiet && random(1, chatty ? 2 : 5) === 1) {
      const skills = tame.skills.map(petSkillSprite);
      setPetDialog(world, pet, choice<string | Sprite | Sprite[]>(
        heart, "...", "!", "?", ...(skills.length ? [skills] : [])
      ), 4);
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
      return;
    }
  }
  const surroundings = (p: Position) =>
    Number(tame.attributes.water === true && !dry(p)) +
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
          (!waterShy || dry(p)) &&
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
      (!waterShy || dry(around(position, side)))
    ) {
      pet[MOVABLE].orientations = [side];
      memory.circle = index === 3 ? undefined : index + 1;
      return;
    }
    memory.circle = undefined;
  }
  follow();
}
