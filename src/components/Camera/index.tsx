import { OrthographicCamera } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { useViewable } from "../../bindings/hooks";
import { POSITION } from "../../engine/components/position";
import { cameraHeight } from "../Entity/utils";

const AnimatedOrthographicCamera = animated(OrthographicCamera);

export default function Camera() {
  const dimensions = useDimensions();
  const viewable = useViewable();

  const zoom = dimensions.cellHeight;
  const position = viewable?.[POSITION] || { x: 0, y: 0 };
  const spring = useSpring({
    x: position.x * dimensions.aspectRatio,
    y: -position.y,
    z: cameraHeight,
    config: {
      mass: 1,
      friction: 25,
      tension: 65,
    },
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
