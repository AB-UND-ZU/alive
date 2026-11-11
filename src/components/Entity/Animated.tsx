import { useRef } from "react";
import { ThreeElements } from "@react-three/fiber";
import { Vector3Tuple } from "three";
import type { Entity } from "ecs";
import { useMotionPosition } from "./useMotionPosition";
import { updateLocalMatrix } from "./matrixUpdates";

export default function Animated({
  entity,
  position,
  ...props
}: {
  entity?: Entity;
  position: Vector3Tuple;
} & Omit<ThreeElements["group"], "position">) {
  const initialPosition = useRef(position);
  const group = useMotionPosition(
    entity,
    position[0],
    position[1],
    position[2]
  );
  return (
    <group
      ref={group}
      position={initialPosition.current}
      matrixAutoUpdate={false}
      onUpdate={updateLocalMatrix}
      {...props}
    />
  );
}
