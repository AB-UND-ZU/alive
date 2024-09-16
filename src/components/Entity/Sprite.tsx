import { Sprite as SpriteType } from "../../engine/components/sprite";
import { getFacingLayers, stack, stackHeight } from "./utils";
import { useWorld } from "../../bindings/hooks";
import { Orientation } from "../../engine/components/orientable";
import { animated, useSpring } from "@react-spring/three";
import Layer, { LayerProps } from "./Layer";
import { useDimensions } from "../Dimensions";

export function AnimatedSprite({
  sprite,
  facing,
  offsetX,
  offsetY,
  offsetZ,
  layerProps,
}: {
  sprite: SpriteType;
  facing?: Orientation;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  layerProps: LayerProps;
}) {
  const { ecs } = useWorld();
  const dimensions = useDimensions();

  // animate opacity and particle offset
  const spring = useSpring({
    from: {
      opacity: layerProps.animateTransparency ? 0 : 1,
      offsetX: undefined,
      offsetY: undefined,
    },
    to: {
      opacity:
        layerProps.animateTransparency && layerProps.isTransparent ? 0 : 1,
      offsetX: layerProps.animateOffset ? offsetX * dimensions.aspectRatio : 0,
      offsetY: layerProps.animateOffset ? -offsetY : 0,
    },
    config: { duration: 200 },
  });

  if (!ecs) return null;

  const layers = getFacingLayers(ecs, sprite, facing);

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
          opacity={spring.opacity}
        />
      ))}
    </animated.group>
  );
}

export default function Sprite({
  sprite,
  facing,
  offsetZ,
  layerProps,
}: {
  sprite: SpriteType;
  facing?: Orientation;
  offsetZ: number;
  layerProps: LayerProps;
}) {
  const { ecs } = useWorld();

  if (!ecs) return null;

  const layers = getFacingLayers(ecs, sprite, facing);

  return (
    <group position-z={offsetZ}>
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
