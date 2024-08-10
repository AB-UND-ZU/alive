import { useSpring, animated, SpringConfig } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { Position, POSITION } from "../../engine/components/position";
import { SPRITE, Sprite as SpriteType } from "../../engine/components/sprite";
import { Light, LIGHT } from "../../engine/components/light";
import { Movable, MOVABLE } from "../../engine/components/movable";
import { Vector3Tuple } from "three";
import Sprite from "../Sprite";
import { Renderable, RENDERABLE } from "../../engine/components/renderable";
import React from "react";

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

function Entity({
  entity,
}: {
  entity: {
    [POSITION]: Position;
    [SPRITE]: SpriteType;
    [LIGHT]?: Light;
    [MOVABLE]?: Movable;
    [RENDERABLE]: Renderable;
  };
  generation: number;
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
      <Sprite sprite={entity[SPRITE]} light={entity[LIGHT]} />

      {(entity[LIGHT]?.brightness || 0) > 0 && (
        <pointLight
          position={[0, 0, 1.5]}
          decay={-1}
          intensity={Math.PI * 0.7}
          castShadow
          shadow-mapSize-width={128}
          shadow-mapSize-height={128}
          shadow-camera-near={0.1}
          shadow-camera-far={dimensions.renderedDiagonal}
        />
      )}
    </Container>
  );
}

const MemoizedEntity = React.memo(
  Entity,
  (prevProps, nextProps) => prevProps.generation === nextProps.generation
);

export default MemoizedEntity;
