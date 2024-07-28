import { Text3D } from "@react-three/drei";
import { ThreeElements } from "@react-three/fiber";
import { useDimensions } from "../Dimensions";
import { Position, POSITION } from "../../engine/components/position";
import { SPRITE, Sprite } from "../../engine/components/sprite";
import { Light, LIGHT } from "../../engine/components/light";

function Box(props: ThreeElements["mesh"]) {
  const dimensions = useDimensions();

  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={[dimensions.aspectRatio, 1, 1]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

export default function Entity({
  entity,
}: {
  entity: { [POSITION]: Position; [SPRITE]: Sprite; [LIGHT]?: Light };
}) {
  const dimensions = useDimensions();
  return (
    <>
      {entity[SPRITE].layers.map((layer, index) => {
        if (layer === "█") {
          return (
            <Box
              key={index}
              position={[
                entity[POSITION].x * dimensions.aspectRatio,
                -entity[POSITION].y,
                0,
              ]}
            />
          );
        }
        return (
          <Text3D
            key={index}
            font="/fonts/MostPerfectDOSVGA.json"
            receiveShadow
            size={1}
            position={[
              (entity[POSITION].x - 0.5) * dimensions.aspectRatio,
              -entity[POSITION].y - 0.5,
              index * 0.1 - 0.5,
            ]}
          >
            {layer}
          </Text3D>
        );
      })}
      {(entity[LIGHT]?.brightness || 0) > 0 && (
        <pointLight
          position={[entity[POSITION].x * dimensions.aspectRatio, -entity[POSITION].y, 1.02]}
          decay={0}
          intensity={Math.PI * 100}
          castShadow
        />
      )}
    </>
  );
}
