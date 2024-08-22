import { ThreeElements } from "@react-three/fiber";
import { animated } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { stack, stackHeight } from "./utils";

export default function Box({
  color,
  height,
  offset = 0,
  ...props
}: ThreeElements["mesh"] & {
  height: number;
  offset?: number;
  color: string | any;
}) {
  const dimensions = useDimensions();

  return (
    <mesh
      {...props}
      position={[0, 0, height / 2 + (offset * stackHeight) / stack]}
    >
      <boxGeometry args={[dimensions.aspectRatio, 1, height]} />
      {props.receiveShadow ? (
        <animated.meshLambertMaterial color={color} />
      ) : (
        <animated.meshBasicMaterial color={color} />
      )}
    </mesh>
  );
}
