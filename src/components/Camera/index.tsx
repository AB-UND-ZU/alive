import { OrthographicCamera } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { useViewable } from "../../bindings/hooks";
import { POSITION } from "../../engine/components/position";

const AnimatedOrthographicCamera = animated(OrthographicCamera);

export const terrainHeight = 0;
export const unitHeight = 1;
export const effectHeight = 2;
export const lightHeight = 3;
export const wallHeight = 4;
export const particleHeight = 5;
export const fogHeight = 6;
export const shadowHeight = 7;
export const cameraHeight = 10;

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
