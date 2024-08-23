import { Group, Vector3Tuple } from "three";
import { useSpring, animated, SpringConfig } from "@react-spring/three";
import React, { forwardRef, useCallback, useRef } from "react";
import { useDimensions } from "../Dimensions";
import { Position, POSITION } from "../../engine/components/position";
import { SPRITE, Sprite as SpriteType } from "../../engine/components/sprite";
import { Light, LIGHT } from "../../engine/components/light";
import { Movable, MOVABLE } from "../../engine/components/movable";
import Sprite from "../Sprite";
import { Renderable, RENDERABLE } from "../../engine/components/renderable";
import { Fog, FOG } from "../../engine/components/fog";
import { Swimmable, SWIMMABLE } from "../../engine/components/swimmable";
import { lightHeight, shadowHeight, wallHeight } from "../Camera";

const Animated = forwardRef<
  Group,
  { position: Vector3Tuple; spring?: SpringConfig }
>(({ position, spring, ...props }, ref) => {
  const values = useSpring({
    x: position[0],
    y: position[1],
    z: position[2],
    config: spring,
  });

  return (
    <animated.group
      ref={ref}
      position-x={values.x}
      position-y={values.y}
      position-z={values.z}
      {...props}
    />
  );
});

function CoveredLight({
  brightness,
  shadow,
}: {
  brightness: number;
  shadow: number;
}) {
  return (
    <>
      <pointLight
        position={[0, 0, lightHeight]}
        decay={-0.96}
        intensity={Math.PI * 0.24}
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        shadow-camera-near={0.1}
        shadow-camera-far={brightness + wallHeight - lightHeight + 0.09}
      />
      <mesh position={[0, 0, shadowHeight]}>
        <ringGeometry args={[brightness - 0.25, shadow, 128]} />
        <meshBasicMaterial color="black" opacity={0.64} transparent />
      </mesh>
    </>
  );
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
    [SWIMMABLE]?: Swimmable;
  };
  generation: number;
  x: number;
  y: number;
}) {
  const dimensions = useDimensions();
  const containerRef = useRef<Group>(null);
  const hide = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.visible = false;
  }, []);

  const spring = entity[MOVABLE]?.spring;
  const Container = spring ? Animated : "group";

  return (
    <Container
      ref={containerRef}
      position={[x * dimensions.aspectRatio, -y, 0]}
      spring={spring}
    >
      <Sprite entity={entity} hide={hide} />

      {!!entity[LIGHT] && entity[LIGHT].brightness > 0 && (
        <CoveredLight
          brightness={entity[LIGHT].brightness}
          shadow={dimensions.renderedDiagonal}
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
