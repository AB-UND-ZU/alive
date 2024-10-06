import * as THREE from "three";
import { Text3D } from "@react-three/drei";
import { useDimensions } from "../Dimensions";
import { Layer as LayerType } from "../../engine/components/sprite";
import { animated, SpringValue } from "@react-spring/three";
import { stack, stackHeight, textSize } from "./utils";
import Box from "./Box";
import { Point } from "../../game/math/std";

export type LayerProps = {
  isTransparent: boolean;
  opacity?: SpringValue<number>;
  animatedOrigin?: Point;
  receiveShadow: boolean;
};

export default function Layer({
  layer,
  offsetZ,
  props,
}: {
  props: LayerProps;
  layer: LayerType;
  offsetZ: number;
}) {
  const dimensions = useDimensions();

  const Material = props.receiveShadow
    ? "meshLambertMaterial"
    : "meshBasicMaterial";
  const color = props.receiveShadow && offsetZ === 1
    ? new THREE.Color(layer.color).multiplyScalar(1.41)
    : layer.color;
  const AnimatedMaterial = animated[Material];
  const materialElement = props.opacity ? (
    <AnimatedMaterial color={color} transparent opacity={props.opacity} />
  ) : (
    <Material color={color} />
  );

  if (layer.char === "█") {
    return (
      <Box
        receiveShadow={props.receiveShadow}
        height={stackHeight / stack}
        offset={offsetZ}
      >
        {materialElement}
      </Box>
    );
  }

  return (
    <Text3D
      font="/fonts/MostPerfectDOSVGA.json"
      receiveShadow={props.receiveShadow}
      size={textSize}
      position={[-0.5 * dimensions.aspectRatio, -0.25, offsetZ]}
      height={stackHeight / stack}
    >
      {materialElement}
      {layer.char}
    </Text3D>
  );
}
