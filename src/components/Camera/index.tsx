import { OrthographicCamera } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { useViewpoint } from "../../bindings/hooks";
import { cameraHeight } from "../Entity/utils";

const AnimatedOrthographicCamera = animated(OrthographicCamera);

export default function Camera() {
  const dimensions = useDimensions();
  const { position, config } = useViewpoint();

  const zoom = dimensions.cellHeight;
  const spring = useSpring({
    x: position.x * dimensions.aspectRatio,
    y: -position.y,
    z: cameraHeight,
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
