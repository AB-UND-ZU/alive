import { collectScene as collectEntities } from "./scene";
import type { Entity } from "ecs";
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
import { ORIENTABLE } from "../../engine/components/orientable";
import { PARTICLE } from "../../engine/components/particle";
import { STICKY } from "../../engine/components/sticky";
import { STATS } from "../../engine/components/stats";
import { ATTACKABLE } from "../../engine/components/attackable";
import { BUILDABLE } from "../../engine/components/buildable";
import { BREWABLE } from "../../engine/components/brewable";
import { isOutside } from "../../engine/systems/enter";
import { getParticles } from "../../engine/systems/sequence";
import { isCollecting, isLootable } from "../../engine/systems/collect";
import { isEnemy, isNeutral } from "../../engine/systems/damage";
import {
  getCameraMotion,
  getMotion,
  getBumpMotion,
  sampleMotion,
} from "../../engine/motion";
import { getDistance, signedDistance } from "../../game/math/std";
import { getFacingLayers } from "../../game/assets/ui";
import { fogOfWar } from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import {
  getSegments,
  fogHeight,
  lootHeight,
  oreHeight,
  particleHeight,
} from "./segments";

export type SceneSprite = {
  key: string;
  x: number;
  y: number;
  z: number;
  layers: Layer[];
  sprite: Sprite;
  amount?: number;
  entity: Entity;
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

export type SceneState = { stickyCastables: Record<number, Position> };

export const getSceneFrame = (
  world: World,
  columns: number,
  rows: number,
  state: SceneState = { stickyCastables: {} }
): SceneSprite[] => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const hero = world.getEntities([PLAYER, POSITION])[0];
  const viewable = world
    .getEntities([VIEWABLE, POSITION])
    .filter((entity) => entity[VIEWABLE].active)
    .sort(
      (left, right) => right[VIEWABLE].priority - left[VIEWABLE].priority
    )[0];
  const cameraMotion = getCameraMotion(world);
  const camera = cameraMotion
    ? sampleMotion(cameraMotion, world.metadata.renderTime)
    : {
        x:
          (viewable?.[POSITION].x || 0) +
          (viewable?.[VIEWABLE].fraction?.x || 0),
        y:
          (viewable?.[POSITION].y || 0) +
          (viewable?.[VIEWABLE].fraction?.y || 0),
      };
  const structure = hero?.[LAYER]?.structure;
  const scene: SceneSprite[] = [];
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
    state.stickyCastables
  );
  for (const [x, y, inside, , entity] of entities) {
    const id = world.getEntityId(entity);
    const visibility = entity[FOG]?.visibility;
    const air = entity[FOG]?.type === "air";
    const visible = visibility === "visible" || !!entity[PROJECTILE];
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
    const motion = !entity[STICKY] && getMotion(entity);
    if (motion) {
      const point = sampleMotion(motion, world.metadata.renderTime);
      px += point.x - motion.x;
      py += point.y - motion.y;
    }
    const bump = getBumpMotion(entity);
    if (bump) {
      const point = sampleMotion(bump, world.metadata.renderTime);
      px += point.x;
      py += point.y;
    }
    const add = (
      sprite: Sprite,
      key: string,
      z: number,
      sx = 0,
      sy = 0,
      amount?: number,
      facing = entity[ORIENTABLE]?.facing
    ) => {
      const entry: SceneSprite = {
        key: `${id}:${x}:${y}:${key}`,
        x: px + sx,
        y: py + sy,
        z,
        layers: getFacingLayers(sprite, facing, amount),
        sprite,
        amount,
        entity,
      };
      scene.push(entry);
      return entry;
    };
    if (!hidden) {
      for (const [index, segment] of getSegments(
        world,
        entity,
        { isTransparent: false, receiveShadow: false },
        inside
      ).entries()) {
        add(
          segment.sprite,
          `body${index}`,
          segment.offsetZ + index / 1000,
          segment.offsetX,
          segment.offsetY,
          segment.amount,
          segment.facing
        );
      }
    }
    const lootVisible =
      (isLootable(world, entity) || isCollecting(world, entity)) &&
      (opaque ? inRadius : visible) &&
      !outside;
    if (lootVisible) {
      const items: Entity[] = (entity[INVENTORY]?.items || [])
        .map((itemId: number) =>
          world.getEntityByIdAndComponents(itemId, [ITEM, SPRITE])
        )
        .flatMap((item) => (item ? [item] : []));
      items.forEach((item, index) => {
        const entry = add(
          item![SPRITE],
          `loot${index}`,
          (opaque ? oreHeight : lootHeight) + index / 1000,
          0,
          0,
          item![ITEM].amount,
          item![ORIENTABLE]?.facing
        );
        if (index === 0) {
          const amount = entity[BREWABLE] ? items.length : item![ITEM].amount;
          if (
            entity[BREWABLE] ||
            (amount > 1 && !(amount <= 3 && entry.sprite.amounts?.multiple))
          )
            entry.dots = Math.min(10, amount);
        }
      });
    }
    for (const [index, particle] of getParticles(world, entity).entries()) {
      if (!particle?.[SPRITE]) continue;
      const motion = getMotion(particle);
      const point = motion
        ? sampleMotion(motion, world.metadata.renderTime)
        : particle[PARTICLE];
      add(
        particle[SPRITE],
        `particle${index}`,
        particle[PARTICLE].offsetZ,
        motion ? point.x : particle[PARTICLE].offsetX,
        motion ? point.y : particle[PARTICLE].offsetY,
        particle[PARTICLE].amount,
        particle[ORIENTABLE]?.facing
      );
    }
    if (
      visibility === "fog" &&
      !entity[LIQUID] &&
      !(
        entity[LAYER]?.structure &&
        entity[FOG]?.type !== "float" &&
        inRadius
      ) &&
      !((opaque || entity[FOG]?.type === "float") && inRadius) &&
      !hidden &&
      !lootVisible
    )
      add(fogOfWar, "fog", fogHeight);
    if (visible && entity[STATS] && (entity[ATTACKABLE] || entity[BUILDABLE])) {
      const stats = entity[STATS];
      const neutral = entity[BUILDABLE] || isNeutral(world, entity);
      if (
        stats.scale !== 0 &&
        stats.maxHp > 0 &&
        !(neutral && stats.hp >= stats.maxHp)
      ) {
        add({ name: "health", layers: [] }, "hp", particleHeight + 0.01).hp = {
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
