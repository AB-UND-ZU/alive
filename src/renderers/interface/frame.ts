import { customSprite, resolveSprite } from "../../game/assets/spriteIds";
import { collectScene as collectEntities } from "./scene";
import { requireComponent, TypedEntity } from "../../engine/entities";
import { World } from "../../engine";
import { Layer, Sprite, SPRITE } from "../../engine/components/sprite";
import { Position, POSITION } from "../../engine/components/position";
import { FOG } from "../../engine/components/fog";
import { LEVEL } from "../../engine/components/level";
import { PLAYER } from "../../engine/components/player";
import { VIEWABLE } from "../../engine/components/viewable";
import { LAYER } from "../../engine/components/layer";
import { LIGHT } from "../../engine/components/light";
import { LIQUID } from "../../engine/components/liquid";
import { PROJECTILE } from "../../engine/components/projectile";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { Orientation, ORIENTABLE } from "../../engine/components/orientable";
import { HOMING } from "../../engine/components/homing";
import { POPUP } from "../../engine/components/popup";
import { PARTICLE } from "../../engine/components/particle";
import { SWIMMABLE } from "../../engine/components/swimmable";
import { MOVABLE } from "../../engine/components/movable";
import { BUMPABLE } from "../../engine/components/bumpable";
import { STATS } from "../../engine/components/stats";
import { ATTACKABLE } from "../../engine/components/attackable";
import { BUILDABLE } from "../../engine/components/buildable";
import { TAMEABLE } from "../../engine/components/tameable";
import { BREWABLE } from "../../engine/components/brewable";
import { isOutside } from "../../engine/systems/enter";
import {
  getParticles,
  getSequence,
  getSequences,
} from "../../engine/systems/sequence";
import { isCollecting, isLootable } from "../../engine/systems/collect";
import { isEnemy, isNeutral } from "../../engine/systems/damage";
import {
  getCameraMotion,
  getMotion,
  getBumpMotion,
  sampleMotion,
} from "../../engine/motion";
import { getDistance, normalize, signedDistance } from "../../game/math/std";
import { discovery, getFacingLayers } from "../../game/assets/ui";
import { colors } from "../../game/assets/colors";
import {
  getSegments,
  getFogOverlay,
  dotsHeight,
  lootHeight,
  oreHeight,
  particleHeight,
  immersibleHeight,
  transientHeight,
  tooltipHeight,
} from "./segments";

const visibilitySprite = customSprite({ name: "visibility", layers: [] });
const swimmingSprite = customSprite({ name: "swimming", layers: [] });
const stackDots = customSprite({ name: "stack dots", layers: [] });
const healthSprite = customSprite({ name: "health", layers: [] });

export type SceneSprite = {
  key: string;
  x: number;
  y: number;
  z: number;
  layers: Layer[];
  terminalLayers?: Layer[];
  sprite: Sprite;
  amount?: number;
  entity: TypedEntity;
  particle?: TypedEntity;
  particleName?: string;
  particleSequence?: string;
  hidden?: boolean;
  fog?: boolean;
  loot?: boolean;
  swimming?: boolean;
  dots?: number;
  hp?: {
    value: number;
    maximum: number;
    color: string;
    scale: number;
    x: number;
    y: number;
  };
};

export type SceneState = { castableQuadrants: Record<number, Position> };

export const getSceneFrame = (
  world: World,
  columns: number,
  rows: number,
  state: SceneState = { castableQuadrants: {} },
  {
    includeHidden = false,
    instant = false,
    fogCells = false,
  }: { includeHidden?: boolean; instant?: boolean; fogCells?: boolean } = {}
): SceneSprite[] => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const hero = world.getEntities([PLAYER, POSITION])[0];
  const heroCell = hero && {
    x: normalize(hero[POSITION].x, size),
    y: normalize(hero[POSITION].y, size),
  };
  const viewable = world
    .getEntities([VIEWABLE, POSITION])
    .filter((entity) => entity[VIEWABLE].active)
    .sort(
      (left, right) => right[VIEWABLE].priority - left[VIEWABLE].priority
    )[0];
  const cameraMotion = getCameraMotion(world);
  const sampledCamera = cameraMotion
    ? sampleMotion(cameraMotion, world.metadata.renderTime)
    : viewable?.[POSITION] || { x: 0, y: 0 };
  const targetCamera = {
    x:
      (viewable?.[POSITION].x || 0) +
      Math.round((sampledCamera.x - (viewable?.[POSITION].x || 0)) / size) *
        size +
      (viewable?.[VIEWABLE].fraction?.x || 0),
    y:
      (viewable?.[POSITION].y || 0) +
      Math.round((sampledCamera.y - (viewable?.[POSITION].y || 0)) / size) *
        size +
      (viewable?.[VIEWABLE].fraction?.y || 0),
  };
  const camera = !instant && cameraMotion ? sampledCamera : targetCamera;
  const structure = hero?.[LAYER]?.structure;
  const scene: SceneSprite[] = [];
  if (fogCells) {
    const snap = instant ? Math.floor : Math.round;
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < columns; x++) {
        const mapX = normalize(snap(x + camera.x - (columns - 1) / 2), size);
        const mapY = normalize(snap(y + camera.y - (rows - 1) / 2), size);
        scene.push({
          key: `fog-cell:${x}:${y}`,
          x,
          y,
          z: -Infinity,
          layers: [],
          sprite: visibilitySprite,
          entity: world.metadata.gameEntity,
          fog:
            !(instant && heroCell?.x === mapX && heroCell?.y === mapY) &&
            !world.metadata.visibleCells.has(mapX * size + mapY),
        });
      }
  }
  const position = {
    x: Math.round(
      camera.x + signedDistance(camera.x, viewable?.[POSITION].x || 0, size)
    ),
    y: Math.round(
      camera.y + signedDistance(camera.y, viewable?.[POSITION].y || 0, size)
    ),
  };
  const entities = collectEntities(
    world,
    {
      position,
      fraction: viewable?.[VIEWABLE].fraction || { x: 0, y: 0 },
      overscan: {
        x: Math.round(position.x - camera.x),
        y: Math.round(position.y - camera.y),
      },
      columns: columns + 4,
      rows: rows + 4,
      viewable,
      structure,
    },
    state.castableQuadrants
  );
  for (const [x, y, inside, , entity] of entities) {
    const id = world.getEntityId(entity);
    const visibility = entity[FOG]?.visibility;
    const air = entity[FOG]?.type === "air";
    const ownCell =
      instant &&
      heroCell?.x === normalize(x, size) &&
      heroCell?.y === normalize(y, size);
    const visible = ownCell || visibility === "visible" || !!entity[PROJECTILE];
    const fog =
      !ownCell && (visibility === "fog" || (air && visibility === "hidden"));
    const outside = !inside && isOutside(world, entity, structure);
    const opaque = (entity[LIGHT]?.darkness || 0) > 0;
    const inRadius =
      getDistance(hero?.[POSITION] || camera, entity[POSITION], size) <
      (hero?.[LIGHT]?.brightness || Infinity);
    const hidden =
      (visibility === "hidden" && !air) ||
      (visibility !== "hidden" && air) ||
      ((entity[FOG]?.type === "unit" || entity[PROJECTILE]) && !visible) ||
      (outside && !(entity[FOG]?.fixed && visible));
    let px = x - camera.x + (columns - 1) / 2;
    let py = y - camera.y + (rows - 1) / 2;
    const animated =
      !instant &&
      (entity[MOVABLE]?.spring || entity[BUMPABLE]);
    const motion = animated && getMotion(entity);
    let movingFacing: Orientation | undefined;
    if (motion) {
      const point = sampleMotion(motion, world.metadata.renderTime);
      px += point.x - motion.x;
      py += point.y - motion.y;
      if (entity[HOMING]) {
        const dx = motion.x - point.x;
        const dy = motion.y - point.y;
        if (Math.abs(dx) + Math.abs(dy) > 0.001)
          movingFacing =
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? "right"
                : "left"
              : dy > 0
              ? "down"
              : "up";
      }
    }
    const bump = animated && getBumpMotion(entity);
    if (bump) {
      const point = sampleMotion(bump, world.metadata.renderTime);
      px += point.x;
      py += point.y;
    }
    const origin = motion || entity[POSITION];
    const copyX = Math.round(
      (x - camera.x - signedDistance(camera.x, origin.x, size)) / size
    );
    const copyY = Math.round(
      (y - camera.y - signedDistance(camera.y, origin.y, size)) / size
    );
    const add = (
      sprite: Sprite,
      key: string,
      z: number,
      sx = 0,
      sy = 0,
      amount?: number,
      facing?: Orientation
    ) => {
      const entry: SceneSprite = {
        key: `${id}:${copyX}:${copyY}:${key}`,
        x: px + sx,
        y: py + sy,
        z,
        layers: getFacingLayers(sprite, facing, amount),
        terminalLayers: sprite.terminal
          ? getFacingLayers(sprite.terminal, facing, amount)
          : undefined,
        sprite,
        amount,
        entity,
      };
      scene.push(entry);
      return entry;
    };
    if (!hidden || includeHidden) {
      for (const [index, segment] of getSegments(
        world,
        entity,
        { isTransparent: false, receiveShadow: false },
        inside
      ).entries()) {
        const entry = add(
          segment.sprite,
          `body${index}`,
          segment.offsetZ + index / 1000,
          segment.offsetX,
          segment.offsetY,
          segment.amount,
          segment.sprite.id === entity[SPRITE]?.id
            ? movingFacing || segment.facing
            : segment.facing
        );
        entry.hidden = hidden;
        entry.fog = fog;
      }
    }
    if (
      entity[SWIMMABLE] &&
      !entity[MOVABLE]?.flying &&
      (entity[SWIMMABLE].swimming || includeHidden)
    ) {
      const entry = add(swimmingSprite, "swimming", immersibleHeight);
      entry.swimming = true;
      entry.hidden = hidden || !entity[SWIMMABLE].swimming;
    }
    const hasLoot = isLootable(world, entity) || isCollecting(world, entity);
    const lootVisible =
      hasLoot && !hidden && (opaque ? inRadius : visible) && !outside;
    if (hasLoot && (lootVisible || includeHidden)) {
      const items: TypedEntity[] = (entity[INVENTORY]?.items || [])
        .map((itemId: number) =>
          world.getEntityByIdAndComponents(itemId, [ITEM, SPRITE])
        )
        .flatMap((item) => (item ? [item] : []));
      items.forEach((item, index) => {
        const entry = add(
          resolveSprite(requireComponent(item!, SPRITE)),
          `loot${world.getEntityId(item)}`,
          (opaque ? oreHeight : lootHeight) + index / 1000,
          0,
          0,
          requireComponent(item!, ITEM).amount,
          item![ORIENTABLE]?.facing
        );
        entry.fog = fog;
        entry.loot = true;
        entry.hidden = !lootVisible;
        if (index === 0) {
          const amount = entity[BREWABLE] ? items.length : requireComponent(item!, ITEM).amount;
          if (
            entity[BREWABLE] ||
            (amount > 1 && !(amount <= 3 && entry.sprite.amounts?.multiple))
          ) {
            const dots = add(
              stackDots,
              `loot${world.getEntityId(item)}:dots`,
              dotsHeight
            );
            dots.dots = Math.min(10, amount);
            dots.loot = true;
            dots.hidden = !lootVisible || (!entity[BREWABLE] && !visible);
          }
        }
      });
    }
    const closingPopup =
      instant && entity[POPUP] && !entity[POPUP].active
        ? getSequence(world, entity, "popup")
        : undefined;
    const closingParticles =
      closingPopup && new Set(Object.values(closingPopup.particles));
    const particleNames = instant
      ? new Map(
          getSequences(world, entity).flatMap((sequence) =>
            Object.entries(sequence.particles).map(
              ([name, id]) => [id, { name, sequence: sequence.name }] as const
            )
          )
        )
      : undefined;
    const message = instant && getSequence(world, entity, "message");
    const messageRows = message
      ? [
          ...new Set(
            Object.entries(message.particles)
              .filter(
                ([, id]) =>
                  resolveSprite(world.getEntityById(id)?.[SPRITE])?.terminal
                    ?.layers.length !== 0
              )
              .map(([key]) => key.split("-")[1])
          ),
        ]
          .map(Number)
          .sort((a, b) => b - a)
      : [];
    const messageParticles = new Map(
      message
        ? Object.entries(message.particles).map(([key, id]) => [
            id,
            messageRows.indexOf(Number(key.split("-")[1])),
          ])
        : []
    );
    for (const [index, particle] of getParticles(world, entity).entries()) {
      if (
        !particle?.[SPRITE] ||
        closingParticles?.has(world.getEntityId(particle))
      )
        continue;
      const motion = particle[PARTICLE].animatedOrigin && getMotion(particle);
      const point = motion
        ? sampleMotion(motion, world.metadata.renderTime)
        : undefined;
      const entry = add(
        resolveSprite(particle[SPRITE]),
        `particle${index}`,
        particle[PARTICLE].offsetZ,
        particle[PARTICLE].offsetX + (point && motion ? point.x - motion.x : 0),
        particle[PARTICLE].offsetY + (point && motion ? point.y - motion.y : 0),
        particle[PARTICLE].amount,
        particle[ORIENTABLE]?.facing
      );
      entry.particle = particle;
      const particleInfo = particleNames?.get(world.getEntityId(particle));
      entry.particleName = particleInfo?.name;
      entry.particleSequence = particleInfo?.sequence;
      if (
        instant &&
        entry.particleSequence === "discoveryIdle" &&
        entry.layers.length
      ) {
        const revealed =
          visible && !hidden && particle[SPRITE]?.id !== discovery.id;
        entry.y = hidden ? py : py - 1;
        entry.terminalLayers = revealed
          ? getFacingLayers(entry.sprite.terminal || entry.sprite)
          : [{ char: "°", color: colors.lime }];
      }
      const messageRow = messageParticles.get(world.getEntityId(particle));
      if (message && messageRow !== undefined && entry.z === transientHeight)
        entry.y =
          py +
          (message.args.messages[0]?.orientation === "down" ? 1 : -1) *
            (1 + messageRow);
      if (
        instant &&
        getSequence(world, entity, "focus")?.particles[
          entry.particleName || ""
        ] === world.getEntityId(particle)
      )
        entry.z = tooltipHeight - 0.001;
    }
    const needsFog =
      visibility === "fog" &&
      !entity[LIQUID] &&
      !(
        entity[LAYER]?.structure &&
        entity[FOG]?.type !== "float" &&
        inRadius
      ) &&
      !((opaque || entity[FOG]?.type === "float") && inRadius) &&
      !hidden &&
      !lootVisible;
    if (needsFog || includeHidden) {
      const overlay = getFogOverlay(needsFog ? entity[SPRITE] : undefined);
      add(overlay.sprite, "fog", overlay.offsetZ).hidden = !needsFog;
    }
    if (
      (visible || includeHidden) &&
      entity[STATS] &&
      (entity[ATTACKABLE] || entity[BUILDABLE])
    ) {
      const stats = entity[STATS];
      const neutral = entity[BUILDABLE] || isNeutral(world, entity);
      if (
        stats.scale !== 0 &&
        stats.maxHp > 0 &&
        (!neutral || entity[TAMEABLE] || stats.hp < stats.maxHp)
      ) {
        const entry = add(healthSprite, "hp", particleHeight + 0.01);
        entry.hidden = !visible;
        entry.hp = {
          value: Math.max(0, Math.floor(stats.hp)),
          maximum: stats.maxHp,
          color: neutral
            ? colors.silver
            : isEnemy(world, entity)
            ? colors.red
            : colors.lime,
          scale: stats.scale ?? 1,
          x: stats.offsetX || 0,
          y: stats.offsetY || 0,
        };
      }
    }
  }
  return scene.sort((left, right) => left.z - right.z);
};
