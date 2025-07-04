import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { ATTACKABLE } from "../components/attackable";
import { isDead } from "./damage";
import {
  PerishSequence,
  PointerSequence,
  ReviveSequence,
  SEQUENCABLE,
  VisionSequence,
} from "../components/sequencable";
import { entities } from "..";
import { disposeEntity, getCell, registerEntity } from "./map";
import { DROPPABLE } from "../components/droppable";
import { Entity } from "ecs";
import { FOG } from "../components/fog";
import { INVENTORY } from "../components/inventory";
import { Position, POSITION } from "../components/position";
import { SPRITE } from "../components/sprite";
import { TOOLTIP } from "../components/tooltip";
import { none, tombstone1 } from "../../game/assets/sprites";
import { ITEM } from "../components/item";
import { SWIMMABLE } from "../components/swimmable";
import { removeFromInventory } from "./trigger";
import { copy } from "../../game/math/std";
import { PLAYER } from "../components/player";
import { LIGHT } from "../components/light";
import { VIEWABLE } from "../components/viewable";
import { SPAWNABLE } from "../components/spawnable";
import { EQUIPPABLE } from "../components/equippable";
import { MOVABLE } from "../components/movable";
import { isDecayed } from "./drop";
import { REVIVABLE } from "../components/revivable";
import { ACTIONABLE } from "../components/actionable";
import { COLLECTABLE } from "../components/collectable";
import { MELEE } from "../components/melee";
import { ORIENTABLE } from "../components/orientable";
import { SOUL } from "../components/soul";
import { questSequence } from "../../game/assets/utils";
import { TRACKABLE } from "../components/trackable";
import { createSequence } from "./sequence";
import { BELONGABLE } from "../components/belongable";
import { SHOOTABLE } from "../components/shootable";
import { getClassData } from "../../game/balancing/classes";
import { emptyStats, STATS } from "../components/stats";
import { getHasteInterval } from "./movement";
import { PUSHABLE } from "../components/pushable";
import { AFFECTABLE } from "../components/affectable";
import { defaultLight } from "./consume";
import { LAYER } from "../components/layer";
import {
  abortQuest,
  getIdentifier,
  getIdentifierAndComponents,
  setHighlight,
  setIdentifier,
  setNeedle,
} from "../utils";

export const isGhost = (world: World, entity: Entity) => entity[PLAYER]?.ghost;

export const isSoulReady = (world: World, entity: Entity) =>
  isGhost(world, entity) && entity[SOUL]?.ready;

export const isRevivable = (world: World, entity: Entity) =>
  entity[REVIVABLE]?.available;

export const getRevivable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((target) =>
    isRevivable(world, target)
  ) as Entity | undefined;

export const canRevive = (world: World, entity: Entity, target: Entity) =>
  isRevivable(world, entity) && isGhost(world, target) && SOUL in target;

export const reviveEntity = (world: World, entity: Entity, target: Entity) => {
  entity[REVIVABLE].available = false;
  entity[TOOLTIP].dialogs = [];
  entity[TOOLTIP].changed = true;
  entity[TOOLTIP].override = undefined;

  // trigger vision and respawn on halo
  createSequence<"vision", VisionSequence>(
    world,
    target,
    "vision",
    "changeRadius",
    { fast: true }
  );
  createSequence<"revive", ReviveSequence>(
    world,
    target,
    "revive",
    "soulRespawn",
    {
      tombstoneId: world.getEntityId(entity),
      target: target[SPAWNABLE].position,
      viewable: target[SPAWNABLE].viewable,
      light: target[SPAWNABLE].light,
      compassId: target[SPAWNABLE].compassId,
    }
  );
};

export default function setupFate(world: World) {
  let referencesGeneration = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    // initiate respawn sequence before decaying
    for (const entity of world.getEntities([
      PLAYER,
      BELONGABLE,
      DROPPABLE,
      RENDERABLE,
      POSITION,
      LAYER,
      LIGHT,
      VIEWABLE,
      SPAWNABLE,
      EQUIPPABLE,
    ])) {
      if (isDead(world, entity) && isDecayed(world, entity)) {
        // abort any pending quest and focus
        abortQuest(world, entity);
        setNeedle(world);
        setHighlight(world);

        const defaultVision =
          entity[LIGHT].visibility === defaultLight.visibility &&
          entity[LIGHT].brightness === defaultLight.brightness;

        // create tombstone and play RIP animation
        const tombstoneEntity = entities.createTombstone(world, {
          [FOG]: { visibility: "visible", type: "terrain" },
          [LAYER]: { structure: entity[LAYER].structure },
          [POSITION]: copy(entity[POSITION]),
          [RENDERABLE]: { generation: 0 },
          [REVIVABLE]: { available: false },
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: tombstone1,
          [SWIMMABLE]: { swimming: false },
          [TOOLTIP]: { dialogs: [], nextDialog: -1, persistent: false },
        });
        createSequence<"perish", PerishSequence>(
          world,
          tombstoneEntity,
          "perish",
          "tragicDeath",
          { fast: defaultVision }
        );
        registerEntity(world, tombstoneEntity);

        // create halo and reduce vision radius
        const frameId = world.getEntityId(
          entities.createFrame(world, {
            [REFERENCE]: {
              tick: getHasteInterval(world, -1),
              delta: 0,
              suspended: true,
              suspensionCounter: -1,
            },
            [RENDERABLE]: { generation: 0 },
          })
        );
        const haloEntity = entities.createHalo(world, {
          [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
          [BELONGABLE]: { faction: entity[BELONGABLE].faction },
          [EQUIPPABLE]: {},
          [INVENTORY]: { items: [], size: 10 },
          [LAYER]: { structure: entity[LAYER].structure },
          [LIGHT]: { ...entity[SPAWNABLE].light },
          [MOVABLE]: {
            orientations: [],
            reference: frameId,
            spring: {
              mass: 5,
              friction: 100,
              tension: 200,
            },
            lastInteraction: 0,
            flying: false,
          },
          [PLAYER]: {
            ghost: true,
            damageReceived: 0,
            healingReceived: 0,
          },
          [POSITION]: copy(entity[POSITION]),
          [RENDERABLE]: { generation: 0 },
          [SEQUENCABLE]: {
            states: {},
          },
          [SOUL]: {
            ready: false,
            tombstoneId: world.getEntityId(tombstoneEntity),
          },
          [SPAWNABLE]: {
            classKey: entity[SPAWNABLE].classKey,
            position: copy(entity[SPAWNABLE].position),
            light: { ...entity[SPAWNABLE].light },
            viewable: { ...entity[VIEWABLE] },
            compassId: entity[SPAWNABLE].compassId,
          },
          [SPRITE]: none,
          [VIEWABLE]: {
            active: entity[VIEWABLE].active,
            priority: 10,
            spring: {
              mass: 1,
              friction: 30,
              tension: 200,
            },
          },
        });
        createSequence<"vision", VisionSequence>(
          world,
          haloEntity,
          "vision",
          "changeRadius",
          {
            light: { visibility: 1.5, brightness: 1.5, darkness: 0 },
            fast: defaultVision,
          }
        );
        registerEntity(world, haloEntity);
      }
    }

    // grant souls a new life
    for (const entity of world.getEntities([
      BELONGABLE,
      SEQUENCABLE,
      RENDERABLE,
      SOUL,
      LIGHT,
      POSITION,
      VIEWABLE,
      SPAWNABLE,
      PLAYER,
    ])) {
      if (!isSoulReady(world, entity)) continue;

      // spawn new hero
      const { stats, sprite } = getClassData(entity[SPAWNABLE].classKey);
      const frameId = world.getEntityId(
        entities.createFrame(world, {
          [REFERENCE]: {
            tick: getHasteInterval(world, stats.haste),
            delta: 0,
            suspended: true,
            suspensionCounter: -1,
          },
          [RENDERABLE]: { generation: 0 },
        })
      );

      const heroEntity = entities.createHero(world, {
        [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
        [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
        [ATTACKABLE]: {},
        [BELONGABLE]: { faction: entity[BELONGABLE].faction },
        [COLLECTABLE]: {},
        [DROPPABLE]: { decayed: false },
        [EQUIPPABLE]: {},
        [FOG]: { visibility: "visible", type: "unit" },
        [INVENTORY]: { items: [], size: 24 },
        [LAYER]: {},
        [LIGHT]: { visibility: 1, brightness: 1, darkness: 0 },
        [MELEE]: { bumpGeneration: 0 },
        [MOVABLE]: {
          orientations: [],
          reference: frameId,
          spring: {
            mass: 0.1,
            friction: 50,
            tension: 1000,
          },
          lastInteraction: 0,
          flying: false,
        },
        [ORIENTABLE]: {},
        [PLAYER]: { ghost: false, damageReceived: 0, healingReceived: 0 },
        [POSITION]: copy(entity[POSITION]),
        [PUSHABLE]: {},
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SHOOTABLE]: { hits: 0 },
        [SPAWNABLE]: {
          classKey: entity[SPAWNABLE].classKey,
          position: copy(entity[SPAWNABLE].position),
          light: entity[SPAWNABLE].light,
          viewable: entity[SPAWNABLE].viewable,
        },
        [SPRITE]: sprite,
        [STATS]: { ...emptyStats, ...stats },
        [SWIMMABLE]: { swimming: false },
        [VIEWABLE]: entity[SPAWNABLE].viewable,
      });
      createSequence<"vision", VisionSequence>(
        world,
        heroEntity,
        "vision",
        "changeRadius",
        { light: entity[SPAWNABLE].light, fast: true }
      );
      createSequence<"pointer", PointerSequence>(
        world,
        heroEntity,
        "pointer",
        "pointerArrow",
        {}
      );
      setIdentifier(world, heroEntity, "hero");

      const heroId = world.getEntityId(heroEntity);
      const compassEntity = getIdentifierAndComponents(world, "compass", [
        ITEM,
        TRACKABLE,
      ]);
      const entityId = world.getEntityId(entity);

      if (compassEntity && compassEntity[ITEM].carrier === entityId) {
        const compassId = world.getEntityId(compassEntity);

        // transfer compass to player
        removeFromInventory(world, entity, compassEntity);
        compassEntity[ITEM].carrier = heroId;
        heroEntity[INVENTORY].items.push(compassId);
        heroEntity[EQUIPPABLE].compass = compassId;

        // set waypoint quest to tombstone
        const tombstoneEntity = world.getEntityById(entity[SOUL].tombstoneId);
        if (tombstoneEntity) {
          questSequence(
            world,
            heroEntity,
            "waypointQuest",
            { distance: 3, highlight: "tombstone" },
            tombstoneEntity
          );
        }

        // set needle to spawn
        const spawnEntity = getIdentifier(world, "spawn");
        if (spawnEntity) {
          setNeedle(world, spawnEntity);
        }
      } else if (compassEntity) {
        // only update needle
        compassEntity[TRACKABLE].target = heroId;
      }

      registerEntity(world, heroEntity);

      // dispose soul
      entity[SOUL].ready = false;
      disposeEntity(world, entity);
    }
  };

  return { onUpdate };
}
