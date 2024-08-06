import { Text3D } from "@react-three/drei";
import { ThreeElements } from "@react-three/fiber";
import { useSpring, animated, SpringConfig } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { Position, POSITION } from "../../engine/components/position";
import { SPRITE, Sprite } from "../../engine/components/sprite";
import { Light, LIGHT } from "../../engine/components/light";
import { Movable, MOVABLE } from "../../engine/components/movable";
import { Vector3Tuple } from "three";

function Box(props: ThreeElements["mesh"]) {
  const dimensions = useDimensions();

  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={[dimensions.aspectRatio, 1, 1]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

function Animated({
  position,
  spring,
  ...props
}: React.PropsWithChildren<{ position: Vector3Tuple; spring?: SpringConfig }>) {
  const values = useSpring({
    x: position[0],
    y: position[1],
    z: position[2],
    config: spring,
  });

  return (
    <animated.group
      position-x={values.x}
      position-y={values.y}
      position-z={values.z}
      {...props}
    />
  );
}

export default function Entity({
  entity,
}: {
  entity: {
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [LIGHT]?: Light;
    [MOVABLE]?: Movable;
  };
}) {
  const dimensions = useDimensions();

  const spring = entity[MOVABLE]?.spring;
  const Container = spring ? Animated : "group";

  return (
    <Container
      position={[
        entity[POSITION].x * dimensions.aspectRatio,
        -entity[POSITION].y,
        0,
      ]}
      spring={spring}
    >
      {entity[SPRITE].layers.map((layer, index) => {
        if (layer === "█") {
          return <Box key={index} />;
        }
        return (
          <Text3D
            key={index}
            font="/fonts/MostPerfectDOSVGA.json"
            receiveShadow
            size={1}
            position={[-0.5 * dimensions.aspectRatio, -0.5, index * 0.1 - 0.5]}
          >
            {layer}
          </Text3D>
        );
      })}
      {(entity[LIGHT]?.brightness || 0) > 0 && (
        <pointLight
          position={[0, 0, 1.02]}
          decay={0}
          intensity={Math.PI * 100}
          castShadow
        />
      )}
    </Container>
  );
}
