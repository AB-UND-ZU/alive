import { Vector3Tuple } from "three";
import { useSpring, animated, SpringConfig } from "@react-spring/three";
import { useWorld } from "../../bindings/hooks";
import { useEffect, useRef } from "react";
import {
  Orientation,
  orientationPoints,
} from "../../engine/components/orientable";
import { aspectRatio } from "../Dimensions/sizing";

const bumpIntensity = 0.225;
const bumpSpring = { duration: 50 };

export default function Animated({
  position,
  spring,
  bumpOrientation,
  bumpGeneration,
  ...props
}: {
  position: Vector3Tuple;
  spring?: SpringConfig;
  bumpOrientation?: Orientation;
  bumpGeneration?: number;
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

  // keep spring and paused in sync
  useEffect(() => {
    api.start({
      config: spring,
      pause: paused,
    });
  }, [spring, paused, api]);

  // perform bump if generation has changed
  useEffect(() => {
    if (
      bumpGeneration !== undefined &&
      bumpGeneration !== bumpRef.current &&
      bumpOrientation
    ) {
      bumpRef.current = bumpGeneration;

      const offset = orientationPoints[bumpOrientation];
      const bumpX = offset.x * bumpIntensity * aspectRatio;
      const bumpY = offset.y * bumpIntensity * -1;

      api.start({
        to: async (next) => {
          await next({
            immediate: true,
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
  }, [bumpOrientation, bumpGeneration, position, api, spring]);

  return (
    <animated.group
      position-x={values.x}
      position-y={values.y}
      position-z={values.z}
      {...props}
    />
  );
}
