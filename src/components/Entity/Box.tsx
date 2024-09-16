import { ThreeElements } from "@react-three/fiber";
import { useDimensions } from "../Dimensions";

export default function Box({
  height,
  offset = 0,
  children,
  ...props
}: ThreeElements["mesh"] & {
  height: number;
  offset?: number;
}) {
  const dimensions = useDimensions();

  return (
    <mesh {...props} position={[0, 0, height / 2 + offset]}>
      <boxGeometry args={[dimensions.aspectRatio, 1, height]} />
      {children}
    </mesh>
  );
}
