import { Text3D } from "@react-three/drei";
import { ThreeElements } from "@react-three/fiber";
import { useDimensions } from "../Dimensions";
import {
  Layer as LayerType,
  Sprite as SpriteType,
} from "../../engine/components/sprite";
import { Light } from "../../engine/components/light";
import * as colors from "../../game/assets/colors";

const textSize = 18 / 25;
const stack = 20;
const height = 2;

function Box({
  color,
  height,
  offset = 0,
  ...props
}: ThreeElements["mesh"] & { height: number; offset?: number; color: string }) {
  const dimensions = useDimensions();

  return (
    <mesh castShadow {...props} position={[0, 0, height / 2 + offset]}>
      <boxGeometry args={[dimensions.aspectRatio, 1, height]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Layer({ layer, offset, darkness }: { layer: LayerType; offset: number, darkness: boolean }) {
  const dimensions = useDimensions();

  if (layer.char === "█") {
    return <Box color={layer.color} height={height / stack} offset={offset} />;
  }

  return (
    <Text3D
      font="/fonts/MostPerfectDOSVGA.json"
      receiveShadow={!darkness}
      size={textSize}
      position={[-0.5 * dimensions.aspectRatio, -0.25, offset]}
      height={height / stack}
    >
      <meshPhongMaterial color={layer.color} />
      {layer.char}
    </Text3D>
  );
}

export default function Sprite({
  sprite,
  light,
}: {
  sprite: SpriteType;
  light?: Light;
}) {
  const darkness = !!light && light.darkness > 0;
  return (
    <>
      {darkness && <Box color={colors.black} height={height} />}
      {sprite.layers.map((layer, index) => (
        <Layer
          darkness={darkness}
          layer={layer}
          key={index}
          offset={((index + (darkness ? stack : 0)) * height) / stack}
        />
      ))}
    </>
  );
}
