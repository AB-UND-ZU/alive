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
import { Fog, FOG } from "../../engine/components/fog";

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

function CoveredLight({ brightness, shadow }: { brightness: number, shadow: number}) {
  return (
        <>
          <pointLight
            position={[0, 0, 1.5]}
            decay={-1}
            intensity={Math.PI * 0.58}
            castShadow
            shadow-mapSize-width={256}
            shadow-mapSize-height={256}
            shadow-camera-near={0.1}
            shadow-camera-far={brightness - 0.056}
          />
          <mesh position={[0, 0, 3]}>
            <ringGeometry args={[brightness - 0.25, shadow, 128]} />
            <meshBasicMaterial color="black" opacity={0.64} transparent />
          </mesh>
        </>

  )
}

function Entity({
  entity,
  x,
  y,
}: {
  entity: {
    [FOG]?: Fog;
    [POSITION]: Position;
    [SPRITE]: SpriteType;
    [LIGHT]?: Light;
    [MOVABLE]?: Movable;
    [RENDERABLE]: Renderable;
  };
  generation: number;
  x: number;
  y: number;
}) {
  const dimensions = useDimensions();

  const spring = entity[MOVABLE]?.spring;
  const Container = spring ? Animated : "group";

  return (
    <Container position={[x * dimensions.aspectRatio, -y, 0]} spring={spring}>
      <Sprite entity={entity} />

      {!!entity[LIGHT] && entity[LIGHT].brightness > 0 && (
        <CoveredLight brightness={entity[LIGHT].brightness} shadow={dimensions.renderedDiagonal} />
      )}
    </Container>
  );
}

const MemoizedEntity = React.memo(
  Entity,
  (prevProps, nextProps) => prevProps.generation === nextProps.generation
);

export default MemoizedEntity;
