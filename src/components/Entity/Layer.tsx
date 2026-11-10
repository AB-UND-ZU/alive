import * as THREE from "three";
import { useFont } from "@react-three/drei";
import { useDimensions } from "../Dimensions";
import { Layer as LayerType } from "../../engine/components/sprite";
import { colors } from "../../game/assets/colors";
import { animated, SpringValue } from "@react-spring/three";
import { stack, stackHeight } from "./utils";
import Box from "./Box";
import { Point } from "../../game/math/std";
import { fontUrl, getBoxGeometry, getGlyphGeometry } from "./geometries";
import { updateLocalMatrix } from "./matrixUpdates";
import { Instance } from "./Instances";

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
  // opaque layers are drawn as instances, fading units keep their own material
  if (!props.opacity) {
    if (layer.char === "█") {
      const height = stackHeight / stack;
      return (
        <Instance
          batchKey={`box${dimensions.aspectRatio}`}
          geometry={getBoxGeometry(dimensions.aspectRatio, 1, height)}
          lambert={props.receiveShadow}
          color={color}
          darkness={props.darkness}
          position={[0, 0, height / 2 + offsetZ]}
        />
      );
    }

    return (
      <InstancedGlyph
        char={layer.char}
        lambert={props.receiveShadow}
        color={color}
        darkness={props.darkness}
        position={[-0.5 * dimensions.aspectRatio, -0.25, offsetZ]}
      />
    );
  }

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
    <Glyph
      char={layer.char}
      receiveShadow={props.receiveShadow}
      position={[-0.5 * dimensions.aspectRatio, -0.25, offsetZ]}
    >
      {materialElement}
    </Glyph>
  );
}

function Glyph({
  char,
  receiveShadow,
  position,
  children,
}: {
  char: string;
  receiveShadow: boolean;
  position: [number, number, number];
  children: React.ReactNode;
}) {
  const font = useFont(fontUrl);

  return (
    <mesh
      matrixAutoUpdate={false}
      onUpdate={updateLocalMatrix}
      geometry={getGlyphGeometry(font, char)}
      receiveShadow={receiveShadow}
      position={position}
      userData={{ char }}
    >
      {children}
    </mesh>
  );
}

function InstancedGlyph({
  char,
  lambert,
  color,
  darkness,
  position,
}: {
  char: string;
  lambert: boolean;
  color: THREE.Color;
  darkness?: SpringValue<number>;
  position: [number, number, number];
}) {
  const font = useFont(fontUrl);

  return (
    <Instance
      batchKey={`glyph${char}`}
      geometry={getGlyphGeometry(font, char)}
      lambert={lambert}
      color={color}
      darkness={darkness}
      position={position}
      userData={{ char }}
    />
  );
}
