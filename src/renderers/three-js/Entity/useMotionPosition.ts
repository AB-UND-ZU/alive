import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import type { Entity } from "ecs";
import { useWorld } from "../../interface/hooks";
import { useDimensions } from "../../../components/Dimensions";
import { getBumpMotion, getMotion, sampleMotion } from "../../../engine/motion";
import { PARTICLE } from "../../../engine/components/particle";
import { POSITION } from "../../../engine/components/position";
import { LEVEL } from "../../../engine/components/level";
import { signedDistance } from "../../../game/math/std";

export const useMotionPosition = (
  entity: Entity | undefined,
  x: number,
  y: number,
  z: number,
  particle = false
) => {
  const { ecs, paused, suspended } = useWorld();
  const { aspectRatio } = useDimensions();
  const group = useRef<Group>(null);
  const sample = useRef({ x: 0, y: 0 });

  const updatePosition = () => {
    if (!ecs || !entity || !group.current || paused || suspended) return;
    const time = ecs.metadata.renderTime;
    const motion = getMotion(entity);
    let nextX = x;
    let nextY = y;
    if (particle) {
      nextX = entity[PARTICLE].offsetX * aspectRatio;
      nextY = -entity[PARTICLE].offsetY;
    } else if (entity[POSITION]) {
      const size = ecs.metadata.gameEntity[LEVEL].size;
      nextX +=
        signedDistance(x / aspectRatio, entity[POSITION].x, size) * aspectRatio;
      nextY -= signedDistance(-y, entity[POSITION].y, size);
    }

    if (motion) {
      sampleMotion(motion, time, sample.current);
      nextX += (sample.current.x - motion.x) * aspectRatio;
      nextY -= sample.current.y - motion.y;
    }
    if (!particle) {
      const bump = getBumpMotion(entity);
      if (bump) {
        sampleMotion(bump, time, sample.current);
        nextX += sample.current.x * aspectRatio;
        nextY -= sample.current.y;
      }
    }
    const object = group.current;
    if (
      object.position.x !== nextX ||
      object.position.y !== nextY ||
      object.position.z !== z
    ) {
      object.position.set(nextX, nextY, z);
      object.updateMatrix();
    }
  };
  useFrame(updatePosition, -1);
  useLayoutEffect(updatePosition);
  return group;
};
