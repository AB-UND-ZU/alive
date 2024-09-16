import { Vector3Tuple } from "three";
import { useSpring, animated, SpringConfig } from "@react-spring/three";

export default function Animated({
  position,
  spring,
  ...props
}: {
  position: Vector3Tuple;
  spring?: SpringConfig;
}) {
  const values = useSpring({
    x: position[0],
    y: position[1],
    z: position[2],
    config: spring,
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
