import { ThreeElements } from "@react-three/fiber";
import { useDimensions } from "../Dimensions";
import { Orientation } from "../../engine/components/orientable";
import { getBoxGeometry } from "./geometries";

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

  const width =
    orientation === "right"
      ? (dimensions.aspectRatio * 5) / 9
      : orientation === "left"
      ? (dimensions.aspectRatio * 4) / 9
      : dimensions.aspectRatio;
  const depth = orientation === "up" || orientation === "down" ? 0.5 : 1;

  return (
    <mesh
      {...props}
      geometry={getBoxGeometry(width, depth, height)}
      position={[
        orientation === "right"
          ? (dimensions.aspectRatio * 4) / 18
          : orientation === "left"
          ? (dimensions.aspectRatio * -5) / 18
          : 0,
        orientation === "down" ? -0.25 : orientation === "up" ? 0.25 : 0,
        height / 2 + offset,
      ]}
    >
      {children}
    </mesh>
  );
}
