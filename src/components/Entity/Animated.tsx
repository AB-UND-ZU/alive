import { Vector3Tuple } from "three";
import { useSpring, animated, SpringConfig } from "@react-spring/three";
import { useWorld } from "../../bindings/hooks";

export default function Animated({
  position,
  spring,
  ...props
}: {
  position: Vector3Tuple;
  spring?: SpringConfig;
}) {
  const { paused } = useWorld();
  const values = useSpring({
    x: position[0],
    y: position[1],
    z: position[2],
    config: spring,
    pause: paused,
  });

  return (
    <animated.group
      position-x={values.x}
      position-y={values.y}
      position-z={values.z}
      {...props}
    />
  );
}
