import { Vector3Tuple } from "three";
import { useSpring, animated, SpringConfig } from "@react-spring/three";
import { useWorld } from "../../bindings/hooks";
import { Melee } from "../../engine/components/melee";
import { useEffect, useRef } from "react";
import { orientationPoints } from "../../engine/components/orientable";
import { aspectRatio } from "../Dimensions/sizing";

const bumpIntensity = 0.225;
const bumpSpring = { duration: 50 };

export default function Animated({
  position,
  spring,
  bump,
  ...props
}: {
  position: Vector3Tuple;
  spring?: SpringConfig;
  bump?: Melee;
}) {
  const { paused } = useWorld();
  const bumpRef = useRef(0);
  const [values, api] = useSpring(() => ({
    x: position[0],
    y: position[1],
    z: position[2],
    config: spring,
    pause: paused,
  }));

  // perform bump if generation has changed
  useEffect(() => {
    if (bump && bump.bumpGeneration !== bumpRef.current && bump.facing) {
      bumpRef.current = bump.bumpGeneration;

      const offset = orientationPoints[bump.facing];
      const bumpX = offset.x * bumpIntensity * aspectRatio;
      const bumpY = offset.y * bumpIntensity * -1;

      api.start({
        to: async (next) => {
          await next({
            x: position[0] + bumpX,
            y: position[1] + bumpY,
            z: position[2],
            config: bumpSpring,
          });
          await next({
            x: position[0],
            y: position[1],
            z: position[2],
            config: spring,
          });
        },
      });
    } else {
      api.start({ x: position[0], y: position[1], z: position[2] });
    }
  }, [bump, position, api, spring]);

  return (
    <animated.group
      position-x={values.x}
      position-y={values.y}
      position-z={values.z}
      {...props}
    />
  );
}
