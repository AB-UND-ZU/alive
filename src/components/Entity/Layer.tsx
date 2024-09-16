import { Text3D } from "@react-three/drei";
import { useDimensions } from "../Dimensions";
import { Layer as LayerType } from "../../engine/components/sprite";
import { animated, SpringValue } from "@react-spring/three";
import { stack, stackHeight, textSize } from "./utils";
import Box from "./Box";

export type LayerProps = {
  isTransparent: boolean;
  animateTransparency: boolean;
  animateOffset: boolean;
  receiveShadow: boolean;
};

export default function Layer({
  layer,
  offsetZ,
  props,
  opacity,
}: {
  props: LayerProps;
  layer: LayerType;
  offsetZ: number;
  opacity?: SpringValue<number>;
}) {
  const dimensions = useDimensions();

  const Material = props.receiveShadow
    ? "meshLambertMaterial"
    : "meshBasicMaterial";
  const AnimatedMaterial = animated[Material];
  const materialElement = opacity ? (
    <AnimatedMaterial color={layer.color} transparent opacity={opacity} />
  ) : (
    <Material color={layer.color} />
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
