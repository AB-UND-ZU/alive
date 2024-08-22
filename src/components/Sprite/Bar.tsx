import { Entity } from "ecs";
import { animated, useSpring } from "@react-spring/three";
import * as colors from "../../game/assets/colors";
import { ATTACKABLE } from "../../engine/components/attackable";
import { pixels, stack, stackHeight } from "./utils";
import { useDimensions } from "../Dimensions";
import { particleHeight } from "../Camera";

export default function Bar({
  entity,
  isVisible,
}: {
  entity: Entity;
  isVisible: boolean;
}) {
  const dimensions = useDimensions();
  const hp = entity[ATTACKABLE].hp;
  const max = entity[ATTACKABLE].max;
  const spring = useSpring({
    scaleX: hp / max,
    translateX:
      (((hp - max) / max) * dimensions.aspectRatio) / 2 - 0.5 / pixels,
    opacity: isVisible ? 1 : 0,
    config: { duration: 75 },
  });

  if (hp <= 0) return null;

  return (
    <animated.mesh
      position-x={spring.translateX}
      position-y={-5.5 / pixels}
      position-z={stackHeight * particleHeight}
      scale-x={spring.scaleX}
    >
      <boxGeometry
        args={[dimensions.aspectRatio - 1 / pixels, 1 / pixels, 1 / stack]}
      />
      <animated.meshBasicMaterial
        color={entity[ATTACKABLE].enemy ? colors.red : colors.lime}
        opacity={spring.opacity}
        transparent
      />
    </animated.mesh>
  );
}
