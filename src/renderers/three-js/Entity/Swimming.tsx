import { lightSprite } from "./CoveredLight";
import { colors } from "../../../game/assets/colors";
import { requireComponent, TypedEntity } from "../../../engine/entities";
import { useDimensions } from "../../../components/Dimensions";
import { useEffect, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/three";
import { immersibleHeight, stack, stackHeight } from "../../interface/segments";
import { ORIENTABLE } from "../../../engine/components/orientable";
import { POSITION } from "../../../engine/components/position";
import { MOVABLE } from "../../../engine/components/movable";

export default function Swimming({
  active,
  entity,
  isVisible,
}: {
  active: boolean;
  entity: TypedEntity;
  isVisible: boolean;
}) {
  const dimensions = useDimensions();
  const facing = entity[ORIENTABLE]?.facing;
  const { x, y } = requireComponent(entity, POSITION);
  const lastWaterCell = useRef({ x, y });
  const moved = lastWaterCell.current.x !== x || lastWaterCell.current.y !== y;
  const activeRef = useRef(false);
  const [black, setBlack] = useState(!isVisible && !active);
  const [spring, api] = useSpring(
    () => ({
      opacity: isVisible ? 1 : 0,
      scaleY: active ? 1 : 0,
      translateX: active || !moved
        ? 0
        : facing === "left"
        ? dimensions.aspectRatio
        : facing === "right"
        ? -dimensions.aspectRatio
        : 0,
      translateY: active ? (dimensions.aspectRatio - 1) / 2 : -0.5,
      config:
        (!active && moved && facing === "down") || !entity[MOVABLE]
          ? { duration: 0 }
          : entity[MOVABLE].spring,
      delay: active ? 100 : 0,
      onRest: (result) => {
        setBlack(result.value.opacity === 0 || result.value.scaleY === 0);
      },
    }),
    [active, entity, isVisible, facing, moved]
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
    if (active) lastWaterCell.current = { x, y };
    activeRef.current = active;
  }, [active, api, dimensions.aspectRatio, facing, x, y]);

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
        color={colors.navy}
        opacity={spring.opacity}
        transparent
        onBeforeCompile={lightSprite}
      />
    </animated.mesh>
  );
}
