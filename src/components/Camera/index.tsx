import { OrthographicCamera } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { useViewpoint, useWorld } from "../../bindings/hooks";
import { cameraHeight } from "../Entity/utils";

const AnimatedOrthographicCamera = animated(OrthographicCamera);
const initialCamera = {
  x: 0,
  y: 0,
  z: cameraHeight,
};

export default function Camera() {
  const { paused } = useWorld();
  const dimensions = useDimensions();
  const { position, fraction, config } = useViewpoint();

  const zoom = dimensions.cellHeight;
  const spring = useSpring({
    from: initialCamera,
    to: {
      x: (position.x + fraction.x) * dimensions.aspectRatio,
      y: -(position.y + fraction.y),
      z: cameraHeight,
    },
    pause: paused,
    config,
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
