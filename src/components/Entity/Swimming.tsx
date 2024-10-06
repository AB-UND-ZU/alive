import * as THREE from "three";
import * as colors from "../../game/assets/colors";
import { Entity } from "ecs";
import { useDimensions } from "../Dimensions";
import { useEffect, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/three";
import { immersibleHeight, stack, stackHeight } from "./utils";
import { ORIENTABLE } from "../../engine/components/orientable";
import { MOVABLE } from "../../engine/components/movable";

const swimmingColor = new THREE.Color(colors.navy).multiplyScalar(2.4);

export default function Swimming({
  active,
  entity,
  isVisible,
}: {
  active: boolean;
  entity: Entity;
  isVisible: boolean;
}) {
  const dimensions = useDimensions();
  const facing = entity[ORIENTABLE]?.facing;
  const activeRef = useRef(false);
  const [black, setBlack] = useState(!isVisible && !active);
  const [spring, api] = useSpring(
    () => ({
      opacity: isVisible ? 1 : 0,
      scaleY: active ? 1 : 0,
      translateX: active
        ? 0
        : facing === "left"
        ? dimensions.aspectRatio
        : facing === "right"
        ? -dimensions.aspectRatio
        : 0,
      translateY: active ? (dimensions.aspectRatio - 1) / 2 : -0.5,
      config:
        (!active && facing === "down") || !entity[MOVABLE]
          ? { duration: 0 }
          : entity[MOVABLE].spring,
      delay: active ? 100 : 0,
      onRest: (result) => {
        setBlack(result.value.opacity === 0 || result.value.scaleY === 0);
      },
    }),
    [active, entity, isVisible, facing]
  );

  useEffect(() => {
    if (active && !activeRef.current) {
      api.set({
        translateX:
          facing === "left"
            ? -dimensions.aspectRatio
            : facing === "right"
            ? dimensions.aspectRatio
            : 0,
      });
      api.start({ translateX: 0 });
    }
    activeRef.current = active;
  }, [active, api, dimensions.aspectRatio, facing]);

  if (black && !active) return null;

  return (
    <animated.mesh
      receiveShadow
      position-x={spring.translateX}
      position-y={spring.translateY}
      position-z={stackHeight * immersibleHeight}
      scale-y={spring.scaleY}
    >
      <boxGeometry
        args={[dimensions.aspectRatio, dimensions.aspectRatio, 1 / stack]}
      />
      <animated.meshLambertMaterial
        color={swimmingColor}
        opacity={spring.opacity}
        transparent
      />
    </animated.mesh>
  );
}
