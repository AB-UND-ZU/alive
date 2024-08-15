import { OrthographicCamera } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { useHero } from "../../bindings/hooks";
import { POSITION } from "../../engine/components/position";

const AnimatedOrthographicCamera = animated(OrthographicCamera);

export default function Camera() {
  const dimensions = useDimensions();
  const hero = useHero();

  const zoom = dimensions.cellHeight;

  const position = hero?.[POSITION] || { x: 0, y: 0 };
  const spring = useSpring({
    x: position.x * dimensions.aspectRatio,
    y: -position.y,
    z: 10,
    config: {
      mass: 1,
      friction: 20,
      tension: 50,
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
      far={10}
    />
  );
}
