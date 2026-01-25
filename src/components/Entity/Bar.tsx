import * as THREE from "three";
import { Entity } from "ecs";
import { animated, useSpring } from "@react-spring/three";
import { colors } from "../../game/assets/colors";
import { particleHeight, stack, stackHeight } from "./utils";
import { useDimensions } from "../Dimensions";
import { getMaxCounter } from "../../game/assets/sprites";
import { pixels } from "../Dimensions/sizing";
import { Countable, STATS } from "../../engine/components/stats";
import { isEnemy, isNeutral } from "../../engine/systems/damage";
import { World } from "../../engine";
import { clamp } from "../../game/math/std";
import { STRUCTURABLE } from "../../engine/components/structurable";
import { PLAYER } from "../../engine/components/player";

const neutralColor = colors.silver;
const neutralBar = new THREE.Color(neutralColor).multiplyScalar(0.075);
const playerColor = colors.lime;
const playerBar = new THREE.Color(playerColor).multiplyScalar(0.075);
const enemyColor = colors.red;
const enemyBar = new THREE.Color(enemyColor).multiplyScalar(0.15);

export default function Bar({
  world,
  entity,
  isVisible,
  counter,
}: {
  world: World;
  entity: Entity;
  isVisible: boolean;
  counter: keyof Countable;
}) {
  const dimensions = useDimensions();
  const maxCounter = getMaxCounter(counter);
  const actualValue = entity[STATS][counter];
  const max = maxCounter ? entity[STATS][maxCounter] : actualValue;
  const value = actualValue <= 0 ? 0 : clamp(Math.floor(actualValue), 1, max);
  const enemy = isEnemy(world, entity);
  const neutral = isNeutral(world, entity);
  const player = entity[PLAYER];
  const scale = entity[STRUCTURABLE]?.scale || 1;
  const offsetX = entity[STRUCTURABLE]?.offsetX
    ? entity[STRUCTURABLE].offsetX * dimensions.aspectRatio
    : 0;
  const offsetY = entity[STRUCTURABLE]?.offsetY
    ? -entity[STRUCTURABLE].offsetY
    : 0;
  const offsetZ = player ? 2 / stack : 0;
  const spring = useSpring({
    scaleX: value / max,
    translateX:
      ((((value - max) / max) * (dimensions.aspectRatio - 1 / pixels)) / 2 -
        0.5 / pixels) *
        scale +
      offsetX,
    opacity: isVisible ? 1 : 0,
    config: { duration: 75 },
  });

  if (value === max && neutral) return null;

  return (
    <>
      <animated.mesh
        position-x={spring.translateX}
        position-y={-5.5 / pixels + offsetY}
        position-z={stackHeight * particleHeight + 1 / stack + offsetZ}
        scale-x={spring.scaleX}
      >
        <boxGeometry
          args={[
            (dimensions.aspectRatio - 1 / pixels) * scale,
            1 / pixels,
            1 / stack,
          ]}
        />
        <animated.meshBasicMaterial
          color={neutral ? neutralColor : enemy ? enemyColor : playerColor}
          opacity={spring.opacity}
          transparent
        />
      </animated.mesh>

      {max !== value && (
        <mesh
          position-x={-0.5 / pixels + offsetX}
          position-y={-5.5 / pixels + offsetY}
          position-z={stackHeight * particleHeight + offsetZ}
        >
          <boxGeometry
            args={[
              (dimensions.aspectRatio - 1 / pixels) * scale,
              1 / pixels,
              1 / stack,
            ]}
          />
          <animated.meshBasicMaterial
            color={neutral ? neutralBar : enemy ? enemyBar : playerBar}
            opacity={spring.opacity}
            transparent
          />
        </mesh>
      )}
    </>
  );
}
