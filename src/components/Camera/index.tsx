import { OrthographicCamera } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { useViewpoint, useWorld } from "../../bindings/hooks";
import { cameraHeight } from "../Entity/utils";
import { useState } from "react";

const AnimatedOrthographicCamera = animated(OrthographicCamera);

export default function Camera() {
  const { paused } = useWorld();
  const dimensions = useDimensions();
  const { position, fraction, config } = useViewpoint();
  const [initial, setInitial] = useState(true);

  const zoom = dimensions.cellHeight;
  const spring = useSpring({
    x: (position.x + fraction.x) * dimensions.aspectRatio,
    y: -(position.y + fraction.y),
    z: cameraHeight,
    pause: paused,
    config,
    onRest: () => {
      if (initial) setInitial(false);
    },
    immediate: initial,
  });

  return (
    <AnimatedOrthographicCamera
      makeDefault
      position-x={spring.x}
      position-y={spring.y}
      position-z={spring.z}
      zoom={zoom}
      near={0.1}
      far={cameraHeight}
    />
  );
}
