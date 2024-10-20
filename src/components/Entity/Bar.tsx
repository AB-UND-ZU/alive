import * as THREE from "three";
import { Entity } from "ecs";
import { animated, useSpring } from "@react-spring/three";
import * as colors from "../../game/assets/colors";
import { ATTACKABLE } from "../../engine/components/attackable";
import { pixels, stack, stackHeight, tooltipHeight } from "./utils";
import { useDimensions } from "../Dimensions";
import { Countable, COUNTABLE } from "../../engine/components/countable";
import { NPC } from "../../engine/components/npc";
import { getMaxCounter } from "../../game/assets/sprites";

const unitColor = colors.silver;
const unitBar = new THREE.Color(unitColor).multiplyScalar(0.075);
const playerColor = colors.lime;
const playerBar = new THREE.Color(playerColor).multiplyScalar(0.075);
const enemyColor = colors.red;
const enemyBar = new THREE.Color(enemyColor).multiplyScalar(0.15);

export default function Bar({
  entity,
  isVisible,
  counter,
}: {
  entity: Entity;
  isVisible: boolean;
  counter: keyof Countable;
}) {
  const dimensions = useDimensions();
  const max = entity[COUNTABLE][getMaxCounter(counter)];
  const value = Math.min(entity[COUNTABLE][counter], max);
  const isEnemy = entity[ATTACKABLE].enemy;
  const isUnit = isEnemy && !entity[NPC];
  const spring = useSpring({
    scaleX: value / max,
    translateX:
      (((value - max) / max) * (dimensions.aspectRatio - 1 / pixels)) / 2 -
      0.5 / pixels,
    opacity: isVisible || isUnit ? 1 : 0,
    config: { duration: 75 },
  });

  if (value === max && isUnit) return null;

  return (
    <>
      <animated.mesh
        position-x={spring.translateX}
        position-y={-5.5 / pixels}
        position-z={stackHeight * tooltipHeight + 1 / stack}
        scale-x={spring.scaleX}
      >
        <boxGeometry
          args={[dimensions.aspectRatio - 1 / pixels, 1 / pixels, 1 / stack]}
        />
        <animated.meshBasicMaterial
          color={isUnit ? unitColor : isEnemy ? enemyColor : playerColor}
          opacity={spring.opacity}
          transparent
        />
      </animated.mesh>

      {max !== value && (
        <mesh
          position-x={-0.5 / pixels}
          position-y={-5.5 / pixels}
          position-z={stackHeight * tooltipHeight}
        >
          <boxGeometry
            args={[dimensions.aspectRatio - 1 / pixels, 1 / pixels, 1 / stack]}
          />
          <animated.meshBasicMaterial
            color={isUnit ? unitBar : isEnemy ? enemyBar : playerBar}
            opacity={spring.opacity}
            transparent
          />
        </mesh>
      )}
    </>
  );
}
