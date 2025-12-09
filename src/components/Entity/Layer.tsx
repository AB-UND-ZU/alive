import * as THREE from "three";
import { Text3D } from "@react-three/drei";
import { useDimensions } from "../Dimensions";
import { Layer as LayerType } from "../../engine/components/sprite";
import { colors } from "../../game/assets/colors";
import { animated, SpringValue } from "@react-spring/three";
import { stack, stackHeight, textSize } from "./utils";
import Box from "./Box";
import { Point } from "../../game/math/std";

export type LayerProps = {
  isTransparent: boolean;
  opacity?: SpringValue<number>;
  darkness?: SpringValue<number>;
  animatedOrigin?: Point;
  receiveShadow: boolean;
  colorFactor?: number;
  duration?: number;
};

const colorObjects = Object.fromEntries(
  [...Object.values(colors), "#2e2e2e", "#606060"].map((color) => [
    color,
    new THREE.Color(color),
  ])
);

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

  const color = props.colorFactor
    ? colorObjects[layer.color].clone().multiplyScalar(props.colorFactor)
    : colorObjects[layer.color];
  if (!color) debugger;
  const Material = props.receiveShadow
    ? "meshLambertMaterial"
    : "meshBasicMaterial";

  let materialElement;
  if (props.opacity) {
    const AnimatedMaterial = animated[Material];
    materialElement = (
      <AnimatedMaterial color={color} transparent opacity={props.opacity} />
    );
  } else if (props.darkness) {
    // interpolate color to black
    const interpolatedColor = props.darkness.to((darkness) =>
      color.clone().multiplyScalar(darkness).getHex()
    );
    const AnimatedMaterial = animated[Material];
    materialElement = <AnimatedMaterial color={interpolatedColor} />;
  } else {
    materialElement = <Material color={color} />;
  }

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
      font={`${process.env.PUBLIC_URL}/fonts/MostPerfectDOSVGA.json`}
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
