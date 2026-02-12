import { Entity } from "ecs";
import { World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add, choice, combine, copy, random } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { disposeEntity, getCell, registerEntity } from "./map";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { SEQUENCABLE } from "../components/sequencable";
import { entities } from "..";
import { Sprite, SPRITE } from "../components/sprite";
import { hedgeDry1, hedgeDry2 } from "../../game/assets/sprites";
import { INVENTORY } from "../components/inventory";
import { BELONGABLE } from "../components/belongable";
import { isWalkable } from "./movement";
import { emptyUnitStats, STATS } from "../components/stats";
import { ATTACKABLE } from "../components/attackable";
import { Homing, HOMING } from "../components/homing";
import { getOpaque } from "./enter";
import { Castable, CASTABLE, emptyCastable } from "../components/castable";
import { EXERTABLE } from "../components/exertable";
import { FOG } from "../components/fog";
import { iterations } from "../../game/math/tracing";
import { LEVEL } from "../components/level";
import { BURNABLE } from "../components/burnable";
import { DROPPABLE } from "../components/droppable";
import { setIdentifier } from "../utils";
import { createCell } from "../../bindings/creation";
import { relativeOrientations } from "../../game/math/path";
import { SHOOTABLE } from "../components/shootable";
import { IDENTIFIABLE } from "../components/identifiable";
import { BEHAVIOUR } from "../components/behaviour";
import { disc, homing, summon } from "../../game/assets/templates/particles";
import { attemptBubbleAbsorb } from "./magic";

export const decayHoming = (world: World, entity: Entity) => {
  entity[HOMING].decayedGeneration =
    world.metadata.gameEntity[RENDERABLE].generation;
  entity[MOVABLE].orientations = [];
  entity[ORIENTABLE].facing = undefined;
};

export const isHomingActive = (world: World, entity: Entity) =>
  !entity[HOMING].decayedGeneration;

export const isHomingDisposable = (world: World, entity: Entity) =>
  world.metadata.gameEntity[RENDERABLE].generation >
  entity[HOMING].decayedGeneration;

const discConfig: Record<
  Homing["type"],
  { sprite: Sprite } & Partial<Castable>
> = {
  oakTower: { sprite: summon.iron.default, magic: 4, retrigger: 2 },
  oakHedge: { sprite: homing.default.earth },
  oakClover: { sprite: summon.default.earth, magic: 4, retrigger: 2 },
  ironDisc: { sprite: disc.iron.default, magic: 1 },
  goldDisc: { sprite: disc.gold.default, magic: 2 },
};

const HOMING_TTL = 30;

export const shootHoming = (
  world: World,
  caster: Entity,
  homing: Omit<Homing, "generation">
) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const { sprite, ...castable } = discConfig[homing.type];
  const discEntity = entities.createHoming(world, {
    [BELONGABLE]: { faction: "wild" },
    [CASTABLE]: { ...emptyCastable, ...castable, caster: -1, affected: {} },
    [EXERTABLE]: { castable: -1 },
    [HOMING]: {
      ttl: homing.ttl || HOMING_TTL,
      generation: world.metadata.gameEntity[RENDERABLE].generation,
      ...homing,
      positions: homing.positions.map((position) => combine(size, position)),
    },
    [FOG]: { type: "float", visibility: "hidden" },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      lastInteraction: 0,
      spring: { duration: world.metadata.gameEntity[REFERENCE].tick },
      bumpGeneration: 0,
      flying: true,
    },
    [ORIENTABLE]: {},
    [POSITION]: copy(caster[POSITION]),
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: sprite,
  });
  discEntity[CASTABLE].caster = world.getEntityId(discEntity);
  discEntity[EXERTABLE].castable = world.getEntityId(discEntity);
  registerEntity(world, discEntity);
  return discEntity;
};

export default function setupHoming(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    const size = world.metadata.gameEntity[LEVEL].size;
    const worldGeneration = world.metadata.gameEntity[RENDERABLE].generation;
    referenceGenerations = generation;

    // handle disc hits and timeouts
    for (const entity of world.getEntities([CASTABLE, HOMING, POSITION])) {
      if (!isHomingActive(world, entity)) continue;

      // register disc hits
      const affectedId = Object.keys(entity[CASTABLE].affected)[0];
      const hasAffected = !!world.getEntityById(parseInt(affectedId));

      // register waypoint reaches
      const nextPosition = entity[HOMING].positions[0];
      const destination = entity[HOMING].positions.length === 1;
      const reached =
        nextPosition &&
        entity[POSITION].x === nextPosition.x &&
        entity[POSITION].y === nextPosition.y;

      // register timeouts
      const timeout =
        entity[HOMING].ttl &&
        worldGeneration - entity[HOMING].generation > entity[HOMING].ttl;

      if (!hasAffected && !reached && !timeout) continue;

      if (reached && !destination) {
        entity[HOMING].positions.shift();
        continue;
      } else if (!timeout && !(hasAffected && !entity[CASTABLE].retrigger)) {
        // remain only without TTL and retriggering discs
        continue;
      }

      decayHoming(world, entity);
    }

    // handle disc effects
    for (const entity of world.getEntities([CASTABLE, HOMING, POSITION])) {
      if (!isHomingDisposable(world, entity)) continue;

      const affectedId = Object.keys(entity[CASTABLE].affected)[0];
      const affectedEntity = world.getEntityById(parseInt(affectedId));

      // prevent if bubble is active
      let hasAffected = !!affectedEntity;

      if (affectedEntity && attemptBubbleAbsorb(world, affectedEntity)) {
        hasAffected = false;
      }

      const nextPosition = entity[HOMING].positions[0];
      const reached =
        nextPosition &&
        entity[POSITION].x === nextPosition.x &&
        entity[POSITION].y === nextPosition.y;

      if (entity[HOMING].type === "oakTower" && reached) {
        const towerEntity = createCell(
          world,
          copy(entity[POSITION]),
          "oakTower",
          "hidden"
        ).cell;
        setIdentifier(world, towerEntity, "oak:tower");
      } else if (entity[HOMING].type === "oakClover" && reached) {
        // clear bushes
        const cell = getCell(world, entity[POSITION]);
        const bushEntity = Object.values(cell).find(
          (bush) => bush[IDENTIFIABLE]?.name === "oak:bush"
        );

        if (bushEntity) {
          disposeEntity(world, bushEntity);
        }

        const cloverEntity = createCell(
          world,
          copy(entity[POSITION]),
          "oakClover",
          "hidden"
        ).cell;

        // offset clovers to prevent all moving at same time
        if (random(0, 1) === 0 && cloverEntity[BEHAVIOUR]) {
          cloverEntity[BEHAVIOUR].patterns.shift();
        }
      } else if (entity[HOMING].type === "oakHedge" && hasAffected) {
        const targetEntity = world.getEntityByIdAndComponents(
          entity[HOMING].target,
          [POSITION]
        );

        if (targetEntity) {
          // surround target with bushes
          for (const iteration of iterations) {
            const side = combine(
              size,
              targetEntity[POSITION],
              iteration.direction
            );

            if (!isWalkable(world, side)) continue;

            const hedgeEntity = entities.createResource(world, {
              [ATTACKABLE]: {},
              [BELONGABLE]: { faction: "unit" },
              [BURNABLE]: {
                burning: false,
                eternal: false,
                simmer: false,
                combusted: false,
                decayed: false,
              },
              [DROPPABLE]: { decayed: false },
              [FOG]: { visibility: "hidden", type: "object" },
              [INVENTORY]: { items: [] },
              [POSITION]: side,
              [RENDERABLE]: { generation: 0 },
              [SEQUENCABLE]: { states: {} },
              [SHOOTABLE]: { shots: 0 },
              [SPRITE]: choice(hedgeDry1, hedgeDry2),
              [STATS]: { ...emptyUnitStats, hp: 25, maxHp: 25 },
            });
            registerEntity(world, hedgeEntity);
            setIdentifier(world, hedgeEntity, "oak:hedge");
          }
        }
      }
    }

    // orient discs
    for (const entity of world.getEntities([
      HOMING,
      MOVABLE,
      ORIENTABLE,
      POSITION,
    ])) {
      if (!isHomingActive(world, entity)) continue;

      // skip movements when appearing
      const entityId = world.getEntityId(entity);
      if (!(entityId in entityReferences)) continue;

      let orientation: Orientation | undefined;
      if (entity[HOMING].target) {
        const targetEntity = world.getEntityByIdAndComponents(
          entity[HOMING].target,
          [POSITION]
        );

        if (targetEntity) {
          orientation = relativeOrientations(
            world,
            entity[POSITION],
            targetEntity[POSITION]
          )[0];
        }
      } else if (entity[HOMING].positions.length > 0) {
        orientation = relativeOrientations(
          world,
          entity[POSITION],
          entity[HOMING].positions[0]
        )[0];
      }

      if (!orientation) {
        decayHoming(world, entity);
        entity[MOVABLE].orientations = [];
        continue;
      }

      entity[ORIENTABLE].facing = orientation;
      entity[MOVABLE].orientations = [orientation];
    }

    // dispose disc when hitting wall
    for (const entity of world.getEntities([
      HOMING,
      MOVABLE,
      ORIENTABLE,
      POSITION,
    ])) {
      if (!isHomingActive(world, entity)) continue;

      const entityId = world.getEntityId(entity);
      const movableReference = world.assertByIdAndComponents(
        entity[MOVABLE].reference,
        [REFERENCE, RENDERABLE]
      );
      const entityReference = movableReference[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      if (!entity[ORIENTABLE].facing) continue;

      const delta = orientationPoints[entity[ORIENTABLE].facing];
      const target = add(entity[POSITION], delta);

      if (getOpaque(world, target)) {
        decayHoming(world, entity);
        continue;
      }
    }

    // dispose decayed shots
    const selectedHoming = [...world.getEntities([CASTABLE, HOMING, POSITION])];
    for (const entity of selectedHoming) {
      if (!isHomingDisposable(world, entity)) continue;

      const entityId = world.getEntityId(entity);
      disposeEntity(world, entity);
      delete entityReferences[entityId];
    }
  };

  return { onUpdate };
}
