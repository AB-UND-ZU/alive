import { Sprite as SpriteType } from "../../../engine/components/sprite";
import { stack, stackHeight } from "../../interface/segments";
import { getFacingLayers } from "../../../game/assets/ui";
import { useWorld } from "../../interface/hooks";
import { Orientation } from "../../../engine/components/orientable";
import { memo, useRef } from "react";
import { useMotionPosition } from "./useMotionPosition";
import { updateLocalMatrix } from "./matrixUpdates";
import Layer, { LayerProps } from "./Layer";

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
  const { ecs } = useWorld();

  const initialPosition = useRef<[number, number, number]>([
    offsetX,
    offsetY,
    offsetZ,
  ]);
  const group = useMotionPosition(
    layerProps.particle,
    offsetX,
    offsetY,
    offsetZ,
    true
  );

  if (!ecs) return null;

  const layers = getFacingLayers(sprite, facing, amount);

  return (
    <group
      ref={group}
      position={initialPosition.current}
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
  prev.duration === next.duration &&
  prev.particle === next.particle;

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
