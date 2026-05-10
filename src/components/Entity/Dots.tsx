import { Entity } from "ecs";
import { animated } from "@react-spring/three";
import { colors } from "../../game/assets/colors";
import { dotsHeight, stack, stackHeight } from "./utils";
import { Segment } from "./Stack";
import { pixels } from "../Dimensions/sizing";
import { HARVESTABLE } from "../../engine/components/harvestable";

const dotColor = colors.silver;
export const dotCount = 5;

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
  const isHarvestable = !!entity[HARVESTABLE];

  if (
    !isHarvestable &&
    (amount <= 1 ||
      !isVisible ||
      (amount <= 3 && segment.sprite.amounts?.multiple))
  )
    return null;

  return (
    <>
      {Array.from({ length: Math.min(amount, 10) }).map((_, index) => (
        <mesh
          key={index}
          position-x={((index % dotCount) * 2 - 4) / pixels}
          position-y={(-5.5 + (index >= dotCount ? -2 : 0)) / pixels}
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
