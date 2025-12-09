import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import {
  Sequencable,
  SEQUENCABLE,
  SequenceState,
} from "../components/sequencable";
import { REFERENCE } from "../components/reference";
import * as sequences from "../../game/assets/sequences";
import { rerenderEntity } from "./renderer";
import { Entity } from "ecs";
import { disposeEntity } from "./map";
import { entities } from "..";
import { ATTACKABLE } from "../components/attackable";
import { PARTICLE } from "../components/particle";
import { lootHeight } from "../../components/Entity/utils";
import { SPRITE } from "../components/sprite";
import { shotHit } from "../../game/assets/sprites";

export const getSequences: (
  world: World,
  entity: Entity
) => SequenceState<any>[] = (world, entity) =>
  SEQUENCABLE in entity ? Object.values(entity[SEQUENCABLE].states) : [];

const shotParticle: ReturnType<typeof entities.createParticle> = {
  [PARTICLE]: {
    offsetX: 0,
    offsetY: 0,
    offsetZ: lootHeight,
  },
  [RENDERABLE]: { generation: 0 },
  [SPRITE]: shotHit,
};

export const getParticles = (world: World, entity: Entity) =>
  getSequences(world, entity)
    .reduce<Entity[]>(
      (all, sequence) =>
        all.concat(
          Object.values(sequence.particles).map((entityId) =>
            world.getEntityById(entityId)
          )
        ),
      []
    )
    .concat((entity[ATTACKABLE]?.shots || 0) > 0 ? shotParticle : []);

const SEQUENCE_DEBUG = false;

export const getSequence = <T extends keyof Sequencable["states"]>(
  world: World,
  entity: Entity,
  type: T
): Sequencable["states"][T] => entity[SEQUENCABLE]?.states[type];

export const createSequence = <T extends keyof Sequencable["states"], A>(
  world: World,
  entity: Entity,
  type: T,
  name: SequenceState<A>["name"],
  args: A
) => {
  if (SEQUENCE_DEBUG) console.info(Date.now(), `${name}: created`);

  const sequenceEntity = entities.createFrame(world, {
    [REFERENCE]: {
      tick: -1,
      delta: 0,
      suspended: false,
      suspensionCounter: -1,
    },
    [RENDERABLE]: { generation: 1 },
  });
  (entity[SEQUENCABLE].states[type] as SequenceState<A>) = {
    name,
    reference: world.getEntityId(sequenceEntity),
    elapsed: 0,
    args,
    particles: {},
  };
};

export default function setupSequence(world: World) {
  const onUpdate = (delta: number) => {
    // to keep track of expired sequences
    const sequenceFrames = world
      .getEntities([REFERENCE, RENDERABLE])
      .reduce((frames, entity) => {
        frames[world.getEntityId(entity)] = {};
        return frames;
      }, {} as Record<number, { [sequencableId: number]: boolean }>);

    for (const entity of world.getEntities([SEQUENCABLE, RENDERABLE])) {
      const sequencable = entity[SEQUENCABLE] as Sequencable;

      for (const sequenceName in sequencable.states) {
        const sequenceType = sequenceName as keyof Sequencable["states"];
        const sequenceState = sequencable.states[sequenceType]!;
        const sequenceEntity = world.assertByIdAndComponents(
          sequenceState.reference,
          [RENDERABLE]
        );
        sequenceState.elapsed += delta;
        const sequence = sequences[sequenceState.name];
        const result = sequence(world, entity, sequenceState as any); // trust me TypeScript i'm an engineer

        // ignore newly added sequence frames
        if (sequenceState.reference in sequenceFrames) {
          sequenceFrames[sequenceState.reference][world.getEntityId(entity)] =
            result.finished;
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
          // clean up orphaned particles
          for (const particleName in sequenceState.particles) {
            const particleEntity = world.assertById(
              sequenceState.particles[particleName]
            );
            disposeEntity(world, particleEntity);
            delete sequenceState.particles[particleName];
          }

          delete sequencable.states[sequenceType];
          entity[RENDERABLE].generation +=
            sequenceEntity[RENDERABLE].generation;
        }
      }
    }

    // delete finished sequence frames
    for (const sequenceId in sequenceFrames) {
      const frame = world.assertByIdAndComponents(parseInt(sequenceId), [
        RENDERABLE,
      ]);
      const entitySequences = Object.entries(sequenceFrames[sequenceId]);

      if (
        entitySequences.length > 0 &&
        entitySequences.every(([_, finished]) => finished)
      ) {
        // persist last generation in frame and entities to allow safely removing frame immediately and ensuring proper rendering
        const lastGeneration = frame[RENDERABLE].generation;
        world.metadata.sequenceEntity[RENDERABLE].generation += lastGeneration;
        disposeEntity(world, frame, false);
      }
    }
  };

  return { onUpdate };
}
