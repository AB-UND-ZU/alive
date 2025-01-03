import { ThreeElements } from "@react-three/fiber";
import { useDimensions } from "../Dimensions";
import { Orientation } from "../../engine/components/orientable";

export default function Box({
  height,
  offset = 0,
  children,
  orientation,
  ...props
}: ThreeElements["mesh"] & {
  height: number;
  offset?: number;
  orientation?: Orientation;
}) {
  const dimensions = useDimensions();

  return (
    <mesh
      {...props}
      position={[
        orientation === "right"
          ? dimensions.aspectRatio / 4
          : orientation === "left"
          ? dimensions.aspectRatio / -4
          : 0,
        orientation === "down" ? -0.25 : orientation === "up" ? 0.25 : 0,
        height / 2 + offset,
      ]}
    >
      <boxGeometry
        args={[
          orientation === "left" || orientation === "right"
            ? dimensions.aspectRatio / 2
            : dimensions.aspectRatio,
          orientation === "up" || orientation === "down" ? 0.5 : 1,
          height,
        ]}
      />
      {children}
    </mesh>
  );
}
