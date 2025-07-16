import { Entity } from "ecs";
import { animated } from "@react-spring/three";
import * as colors from "../../game/assets/colors";
import { dotsHeight, stack, stackHeight } from "./utils";
import { Segment } from "./Stack";
import { STACK_SIZE } from "../../engine/components/item";
import { pixels } from "../Dimensions/sizing";

const dotColor = colors.silver;

export default function Dots({
  entity,
  isVisible,
  segment,
}: {
  entity: Entity;
  isVisible: boolean;
  segment: Segment;
}) {
  const amount = segment.amount || 0;

  if (amount <= 1 || !isVisible) return null;

  return (
    <>
      {Array.from({ length: Math.min(amount, 10) }).map((_, index) => (
        <mesh
          key={index}
          position-x={((index % (STACK_SIZE / 2)) * 2 - 4) / pixels}
          position-y={(-5.5 + (index >= STACK_SIZE / 2 ? -2 : 0)) / pixels}
          position-z={stackHeight * dotsHeight}
        >
          <boxGeometry args={[1 / pixels, 1 / pixels, 1 / stack]} />
          <animated.meshBasicMaterial
            color={dotColor}
            opacity={segment.layerProps.opacity}
            transparent
          />
        </mesh>
      ))}
    </>
  );
}
