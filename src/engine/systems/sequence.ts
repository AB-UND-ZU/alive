import { spriteRef } from "../../game/assets/spriteIds";
import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import {
  Sequence,
  Sequencable,
  SEQUENCABLE,
  SequenceState,
} from "../components/sequencable";
import { REFERENCE } from "../components/reference";
import * as sequences from "../../game/assets/sequences";
import { rerenderEntity } from "./renderer";
import { hasComponent, requireComponent, TypedEntity } from "../entities";
import { disposeFrame, disposeParticles, disposeSequence } from "./map";
import { entities } from "..";
import { PARTICLE } from "../components/particle";
import { lootHeight } from "../../renderers/interface/segments";
import { SPRITE } from "../components/sprite";
import { shotHit } from "../../game/assets/sprites";
import { SHOOTABLE } from "../components/shootable";

export const getSequences: (
  world: World,
  entity: TypedEntity
) => SequenceState<unknown>[] = (world, entity) =>
  hasComponent(entity, SEQUENCABLE) ? Object.values(entity[SEQUENCABLE].states) : [];

const shotParticle: ReturnType<typeof entities.createParticle> = {
  [PARTICLE]: {
    offsetX: 0,
    offsetY: 0,
    offsetZ: lootHeight,
  },
  [RENDERABLE]: { generation: 0 },
  [SPRITE]: spriteRef(shotHit),
};

export const getParticles = (world: World, entity: TypedEntity) => {
  const particles: (typeof shotParticle)[] = [];
  for (const sequence of getSequences(world, entity)) {
    for (const id of Object.values(sequence.particles)) {
      const particle = world.getEntityById(id);
      if (particle) particles.push(particle);
    }
  }
  if ((entity[SHOOTABLE]?.shots ?? 0) > 0) particles.push(shotParticle);
  return particles;
};

const SEQUENCE_DEBUG = false;

export const getSequence = <T extends keyof Sequencable["states"]>(
  world: World,
  entity: TypedEntity,
  type: T
): Sequencable["states"][T] => entity[SEQUENCABLE]?.states[type];

export const createSequence = <T extends keyof Sequencable["states"], A>(
  world: World,
  entity: TypedEntity,
  type: T,
  name: SequenceState<A>["name"],
  args: A,
  sequenceEntity?: ReturnType<typeof entities.createFrame>
) => {
  if (SEQUENCE_DEBUG) console.info(Date.now(), `${name}: created`);

  if (!sequenceEntity) {
    sequenceEntity = entities.createFrame(world, {
      [REFERENCE]: {
        tick: -1,
        delta: 0,
        suspended: false,
        suspensionCounter: -1,
      },
      [RENDERABLE]: { generation: 1 },
    });
  }

  const states = requireComponent(entity, SEQUENCABLE).states;
  if (states[type]) {
    console.warn(
      `Aborting previous sequence "${type}" of following entity:`,
      entity
    );
    disposeSequence(world, entity, type);
  }

  (states[type] as SequenceState<A>) = {
    name,
    reference: world.getEntityId(sequenceEntity),
    elapsed: 0,
    args,
    particles: {},
  };
};

export const replaceSequence: typeof createSequence = (
  world,
  entity,
  type,
  name,
  args,
  sequenceEntity
) => {
  if (getSequence(world, entity, type)) disposeSequence(world, entity, type);
  createSequence(world, entity, type, name, args, sequenceEntity);
};

const hasStates = (sequencable: Sequencable) => {
  for (const _ in sequencable.states) return true;
  return false;
};

export default function setupSequence(world: World) {
  const onUpdate = (delta: number) => {
    // frames created during this update have higher IDs and are kept
    const firstNewId = world.metadata.ecs.nextId;

    // to keep track of expired sequences, by frame and sequencable entity
    const sequenceFrames = new Map<number, Map<number, boolean>>();

    for (const entity of world.getEntities([SEQUENCABLE, RENDERABLE])) {
      const sequencable = entity[SEQUENCABLE] as Sequencable;
      if (!hasStates(sequencable)) continue;

      const states = { ...sequencable.states };

      for (const sequenceName in states) {
        const sequenceType = sequenceName as keyof Sequencable["states"];
        const sequenceState = states[sequenceType]!;
        const sequenceEntity = world.assertByIdAndComponents(
          sequenceState.reference,
          [RENDERABLE]
        );
        sequenceState.elapsed += delta;
        const sequence = sequences[sequenceState.name] as Sequence<unknown>;
        const result = sequence(world, entity, sequenceState);

        // ignore newly added sequence frames
        if (
          sequenceState.reference < firstNewId &&
          hasComponent(sequenceEntity, REFERENCE)
        ) {
          let frameSequences = sequenceFrames.get(sequenceState.reference);
          if (!frameSequences) {
            frameSequences = new Map();
            sequenceFrames.set(sequenceState.reference, frameSequences);
          }
          frameSequences.set(world.getEntityId(entity), result.finished);
        }

        if (result.updated || result.finished) {
          if (SEQUENCE_DEBUG)
            console.info(
              Date.now(),
              `${sequenceState.name}: ${
                result.finished ? "finished" : "updated"
              }`
            );
          rerenderEntity(world, sequenceEntity);
        }

        if (result.finished) {
          disposeParticles(world, sequenceState);

          delete sequencable.states[sequenceType];
          entity[RENDERABLE].generation +=
            sequenceEntity[RENDERABLE].generation;
        }
      }
    }

    // delete finished sequence frames in ascending order
    const frameIds = [...sequenceFrames.keys()].sort((a, b) => a - b);
    for (const frameId of frameIds) {
      const frame = world.assertByIdAndComponents(frameId, [RENDERABLE]);
      const entitySequences = [...sequenceFrames.get(frameId)!.values()];

      if (entitySequences.every((finished) => finished)) {
        disposeFrame(world, frame);
      }
    }
  };

  return { onUpdate };
}
