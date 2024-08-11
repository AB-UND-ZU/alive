import { OrthographicCamera } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { useHero } from "../../bindings/hooks";
import { POSITION } from "../../engine/components/position";

const AnimatedOrthographicCamera = animated(OrthographicCamera);

export default function Camera() {
  const dimensions = useDimensions();
  const hero = useHero();

  const position = hero?.[POSITION] || { x: 0, y: 0 };
  const spring = useSpring({
    x:
      (position.x + dimensions.leftOffset / dimensions.cellWidth / 2) *
      dimensions.aspectRatio,
    y: (position.y + dimensions.topOffset / dimensions.cellHeight / 2) * -1,
    z: dimensions.cellHeight,
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
      zoom={spring.z}
      near={0.1}
      far={64}
    />
  );
}
