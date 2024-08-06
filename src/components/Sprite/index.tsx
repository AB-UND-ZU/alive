import { Text3D } from "@react-three/drei";
import { ThreeElements } from "@react-three/fiber";
import { useDimensions } from "../Dimensions";
import {
  Layer as LayerType,
  Sprite as SpriteType,
} from "../../engine/components/sprite";
import { Light } from "../../engine/components/light";

function Box({ color, ...props }: ThreeElements["mesh"] & { color: string }) {
  const dimensions = useDimensions();

  return (
    <mesh castShadow {...props} position={[0, 0, 1]}>
      <boxGeometry args={[dimensions.aspectRatio, 1, 2]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

const textSize = 18 / 25;

function Layer({
  layer,
  index,
  light,
}: {
  layer: LayerType;
  index: number;
  light?: Light;
}) {
  const dimensions = useDimensions();

  if (light && light.darkness > 0) {
    return <Box color={layer.color} />;
  }

  return (
    <Text3D
      font="/fonts/MostPerfectDOSVGA.json"
      receiveShadow
      size={textSize}
      position={[-0.5 * dimensions.aspectRatio, -0.25, index * 0.1]}
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
  return (
    <>
      {sprite.layers.map((layer, index) => (
        <Layer layer={layer} key={index} index={index} light={light} />
      ))}
    </>
  );
}
