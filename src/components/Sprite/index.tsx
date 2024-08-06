import { Text3D } from "@react-three/drei";
import { ThreeElements } from "@react-three/fiber";
import { useDimensions } from "../Dimensions";
import {
  Layer as LayerType,
  Sprite as SpriteType,
} from "../../engine/components/sprite";

function Box(props: ThreeElements["mesh"]) {
  const dimensions = useDimensions();

  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={[dimensions.aspectRatio, 1, 1]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

const textSize = 18 / 25;

function Layer({ layer, index }: { layer: LayerType; index: number }) {
  const dimensions = useDimensions();
  if (layer.char === "█") {
    return <Box />;
  }

  return (
    <Text3D
      font="/fonts/MostPerfectDOSVGA.json"
      receiveShadow
      size={textSize}
      position={[-0.5 * dimensions.aspectRatio, -0.25, index * 0.1 - 0.5]}
    >
      {layer.char}
    </Text3D>
  );
}

export default function Sprite({ sprite }: { sprite: SpriteType }) {
  return (
    <>
      {sprite.layers.map((layer, index) => (
        <Layer layer={layer} key={index} index={index} />
      ))}
    </>
  );
}
