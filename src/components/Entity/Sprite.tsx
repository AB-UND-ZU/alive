import { Sprite as SpriteType } from "../../engine/components/sprite";
import { getFacingLayers, stack, stackHeight } from "./utils";
import { useWorld } from "../../bindings/hooks";
import { Orientation } from "../../engine/components/orientable";
import { animated, useSpring } from "@react-spring/three";
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

export function AnimatedSprite({
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

export default function Sprite({
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
    <group position={[offsetX, offsetY, offsetZ]}>
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
