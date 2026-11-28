import { spriteRef } from "../assets/spriteIds";
import { createRng } from "../math/rng";
import createWorld, { createLevel, World } from "../../engine/ecs";
import {
  createSnapshot,
  restoreSnapshot,
  WorldSnapshot,
} from "../../engine/snapshot";
import { ClassKey, getClassData } from "../balancing/classes";
import { LevelName, LEVEL } from "../../engine/components/level";
import { TAMEABLE } from "../../engine/components/tameable";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { iterateMatrixFromCenter } from "../math/matrix";
import { isWalkable } from "../../engine/systems/movement";
import { MOVABLE } from "../../engine/components/movable";
import { REFERENCE } from "../../engine/components/reference";
import { INVENTORY } from "../../engine/components/inventory";
import {
  SEQUENCABLE,
  Sequencable,
  VisionSequence,
} from "../../engine/components/sequencable";
import { POSITION } from "../../engine/components/position";
import { VIEWABLE } from "../../engine/components/viewable";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { ORIENTABLE } from "../../engine/components/orientable";
import { SPRITE, Sprite } from "../../engine/components/sprite";
import { STATS } from "../../engine/components/stats";
import { SWIMMABLE } from "../../engine/components/swimmable";
import { TypedEntity } from "../../engine/entities";
import {
  assertIdentifier,
  assertIdentifierAndComponents,
  TEST_MODE,
} from "../../engine/utils";
import {
  disposeEntity,
  disposeSequence,
  registerEntity,
} from "../../engine/systems/map";
import {
  getSequence,
  getParticles,
  replaceSequence,
} from "../../engine/systems/sequence";
import { rerenderEntity } from "../../engine/systems/renderer";
import { getChangedClassStats } from "../../engine/systems/leveling";
import { calculateVision } from "../../engine/systems/visibility";
import { levelConfig } from ".";

export type LevelDestination = {
  level: LevelName;
  classKey?: ClassKey;
  hairColor?: string;
};
export type Destination = LevelDestination | { saveId: string };
export type GenerationRequest = LevelDestination & {
  source?: WorldSnapshot;
  seed?: number;
};
export type GenerationMessage =
  | { line: Sprite[] }
  | { snapshot: WorldSnapshot };

function* generateArrival(
  world: World,
  { level: levelName, classKey, hairColor }: LevelDestination
) {
  const entity = assertIdentifierAndComponents(world, "hero", [
    MOVABLE,
    SEQUENCABLE,
    VIEWABLE,
    POSITION,
    SPAWNABLE,
    ORIENTABLE,
    STATS,
    SPRITE,
    SWIMMABLE,
  ]);
  const reference = world.assertByIdAndComponents(entity[MOVABLE].reference, [
    REFERENCE,
  ]);
  // tag hero and related entities to new world
  const { size, vision } = levelConfig[levelName];
  const light = calculateVision(vision);

  // Quests belong to the departing level, unlike the hero and inventory.
  if (getSequence(world, entity, "quest")) {
    disposeSequence(world, entity, "quest");
  }

  const inspectEntity = assertIdentifier(world, "inspect");
  const useEntity = assertIdentifier(world, "use");
  const spawnEntity = assertIdentifier(world, "spawn");
  const focusEntity = assertIdentifierAndComponents(world, "focus", [
    MOVABLE,
    SEQUENCABLE,
    POSITION,
  ]);
  const inventory = (entity[INVENTORY]?.items || []).map((id: number) =>
    world.assertById(id)
  );
  const entityFrames = Object.values(
    (entity[SEQUENCABLE].states || {}) as Sequencable["states"]
  ).map((state) => world.assertById(state.reference));
  const focusFrames = Object.values(
    (focusEntity[SEQUENCABLE].states || {}) as Sequencable["states"]
  ).map((state) => world.assertById(state.reference));
  const pets = world
    .getEntities([TAMEABLE, POSITION, MOVABLE, SEQUENCABLE, BEHAVIOUR, INVENTORY])
    .filter((pet) => pet[TAMEABLE].owner === world.getEntityId(entity));
  const petBelongings = pets.flatMap((pet) => {
    for (const name of Object.keys(pet[SEQUENCABLE].states)) {
      disposeSequence(world, pet, name as keyof Sequencable["states"]);
    }
    pet[BEHAVIOUR].patterns = [{ name: "pet", memory: {} }];
    pet[MOVABLE].orientations = [];
    delete pet[MOVABLE].pendingOrientation;
    return [pet[MOVABLE].reference, ...pet[INVENTORY].items].map((id) =>
      world.assertById(id)
    );
  });
  const transferredEntities = [
    entity,
    ...inventory,
    ...pets,
    ...petBelongings,
    inspectEntity,
    useEntity,
    spawnEntity,
    focusEntity,
    reference,
    ...getParticles(world, entity),
    ...entityFrames,
    ...getParticles(world, focusEntity),
    ...focusFrames,
  ];
  transferredEntities.forEach((target) => {
    world.addComponentToEntity(target, levelName, {});
    world.removeComponentFromEntity(
      target as TypedEntity<LevelName>,
      world.metadata.gameEntity[LEVEL].name
    );
  });

  // remove old world for now
  world.getEntities([]).forEach((target) => {
    if (transferredEntities.includes(target)) return;

    disposeEntity(world, target);
  });

  // generate new world
  const level = createLevel(world, levelName, size);
  yield* levelConfig[levelName].generator(world);

  // reregister positioned entities
  transferredEntities.forEach((target) => {
    if (!target[POSITION]) return;

    if (target[TAMEABLE]) {
      const spawn = entity[POSITION];
      target[POSITION] = iterateMatrixFromCenter(level[LEVEL].cells, spawn, (x, y) =>
        (x !== spawn.x || y !== spawn.y) && isWalkable(world, { x, y })
      ) ?? { ...spawn };
    }
    registerEntity(world, target);
    rerenderEntity(world, target);
  });

  // reset hero
  const spawn = entity[POSITION];
  rerenderEntity(world, entity);
  focusEntity[MOVABLE].reference = world.getEntityId(level);
  entity[VIEWABLE].active = true;
  entity[SPAWNABLE].position = { ...spawn };
  entity[SPAWNABLE].light = light;
  entity[ORIENTABLE].facing = undefined;

  const { stats, sprite, swimming } = getClassData(
    classKey ?? entity[SPAWNABLE].classKey,
    hairColor ?? entity[SPAWNABLE].hairColor
  );

  if (hairColor) {
    entity[SPAWNABLE].hairColor = hairColor;
  }

  if (classKey) {
    entity[STATS] = TEST_MODE
      ? getChangedClassStats(entity[STATS], entity[SPAWNABLE].classKey, classKey)
      : { ...stats, hp: stats.maxHp, mp: 0, xp: 0 };
    entity[SPAWNABLE].classKey = classKey;
  }

  if (hairColor || classKey) {
    entity[SPRITE] = spriteRef(sprite);
    entity[SWIMMABLE] = { swimming: false, sprite: swimming };
  }

  replaceSequence<"vision", VisionSequence>(
    world,
    entity,
    "vision",
    "changeRadius",
    { light, fast: false }
  );
}

export function* generateLevel(
  request: GenerationRequest
): Generator<Sprite[], WorldSnapshot> {
  const world = request.source
    ? restoreSnapshot(request.source)
    : createWorld();
  if (request.source) {
    yield* generateArrival(world, request);
  } else {
    createLevel(world, request.level, levelConfig[request.level].size);
    yield* levelConfig[request.level].generator(world);
  }
  world.cleanup();
  return createSnapshot(world);
}

export const runGeneration = (
  request: GenerationRequest,
  send: (message: GenerationMessage) => void
) => {
  const random = Math.random;
  try {
    if (request.seed !== undefined) Math.random = createRng(request.seed);
    const steps = generateLevel(request);
    let step = steps.next();
    while (!step.done) {
      send({ line: step.value });
      step = steps.next();
    }
    send({ snapshot: step.value });
  } finally {
    Math.random = random;
  }
};
