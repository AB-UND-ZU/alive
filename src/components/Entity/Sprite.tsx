import { Sprite as SpriteType } from "../../engine/components/sprite";
import { stack, stackHeight } from "./utils";
import { getFacingLayers } from "../../game/assets/ui";
import { useWorld } from "../../bindings/hooks";
import { Orientation } from "../../engine/components/orientable";
import { memo } from "react";
import { animated, useSpring } from "@react-spring/three";
import { updateLocalMatrix } from "./matrixUpdates";
import Layer, { LayerProps } from "./Layer";
import { useDimensions } from "../Dimensions";

type SpriteProps = {
  sprite: SpriteType;
  facing?: Orientation;
  amount?: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  layerProps: LayerProps;
};

function AnimatedSpriteComponent({
  sprite,
  facing,
  amount,
  offsetX,
  offsetY,
  offsetZ,
  layerProps,
}: SpriteProps) {
  const { ecs, paused } = useWorld();
  const dimensions = useDimensions();

  // animate particle offset
  const spring = useSpring({
    from: {
      offsetX: (layerProps.animatedOrigin?.x || 0) * dimensions.aspectRatio,
      offsetY: -(layerProps.animatedOrigin?.y || 0),
    },
    to: {
      offsetX,
      offsetY,
    },
    config: { duration: layerProps.duration || 200 },
    pause: paused,
  });

  if (!ecs) return null;

  const layers = getFacingLayers(sprite, facing, amount);

  return (
    <animated.group
      position-x={spring.offsetX}
      position-y={spring.offsetY}
      position-z={offsetZ}
    >
      {layers.map((layer, index) => (
        <Layer
          props={layerProps}
          layer={layer}
          key={index}
          offsetZ={(index * stackHeight) / stack}
        />
      ))}
    </animated.group>
  );
}

function SpriteComponent({
  sprite,
  facing,
  amount,
  offsetX,
  offsetY,
  offsetZ,
  layerProps,
}: SpriteProps) {
  const { ecs } = useWorld();

  if (!ecs) return null;

  const layers = getFacingLayers(sprite, facing, amount);

  return (
    <group
      position={[offsetX, offsetY, offsetZ]}
      matrixAutoUpdate={false}
      onUpdate={updateLocalMatrix}
    >
      {layers.map((layer, index) => (
        <Layer
          props={layerProps}
          layer={layer}
          key={index}
          offsetZ={(index * stackHeight) / stack}
        />
      ))}
    </group>
  );
}

const isSameLayerProps = (prev: LayerProps, next: LayerProps) =>
  prev.isTransparent === next.isTransparent &&
  prev.opacity === next.opacity &&
  prev.darkness === next.darkness &&
  prev.animatedOrigin?.x === next.animatedOrigin?.x &&
  prev.animatedOrigin?.y === next.animatedOrigin?.y &&
  prev.receiveShadow === next.receiveShadow &&
  prev.colorFactor === next.colorFactor &&
  prev.duration === next.duration;

// a changed particle rerenders its whole entity, so skip unchanged siblings
const isSameSprite = (prev: SpriteProps, next: SpriteProps) =>
  prev.sprite === next.sprite &&
  prev.facing === next.facing &&
  prev.amount === next.amount &&
  prev.offsetX === next.offsetX &&
  prev.offsetY === next.offsetY &&
  prev.offsetZ === next.offsetZ &&
  isSameLayerProps(prev.layerProps, next.layerProps);

export const AnimatedSprite = memo(AnimatedSpriteComponent, isSameSprite);

const Sprite = memo(SpriteComponent, isSameSprite);

export default Sprite;
