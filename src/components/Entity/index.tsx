import { useSpring, animated, SpringConfig } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { Position, POSITION } from "../../engine/components/position";
import { SPRITE, Sprite as SpriteType } from "../../engine/components/sprite";
import { Light, LIGHT } from "../../engine/components/light";
import { Movable, MOVABLE } from "../../engine/components/movable";
import { Vector3Tuple } from "three";
import Sprite from "../Sprite";

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
    [SPRITE]: SpriteType;
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
      <Sprite sprite={entity[SPRITE] }/>

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
