import { Sprite as SpriteType } from "../../engine/components/sprite";
import { getFacingLayers, offsetFactors, stack, stackHeight } from "./utils";
import { useWorld } from "../../bindings/hooks";
import { Orientation } from "../../engine/components/orientable";
import Sprite, { AnimatedSprite } from "./Sprite";
import { LayerProps } from "./Layer";
import { useDimensions } from "../Dimensions";

export type Segment = {
  id: number;
  sprite: SpriteType;
  facing?: Orientation;
  amount?: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  layerProps: LayerProps;
};

export default function Stack({
  segments,
  layerCount,
}: {
  segments: Segment[];
  layerCount: number;
}) {
  const { ecs } = useWorld();
  const dimensions = useDimensions();
  const sprites: JSX.Element[] = [];

  if (!ecs) return null;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const layers = getFacingLayers(
      segment.sprite,
      segment.facing,
      segment.amount
    );

    let layerProps = segment.layerProps;
    const colorFactor = offsetFactors[segment.offsetZ];
    if (colorFactor && layerProps.receiveShadow) {
      layerProps = { ...layerProps, colorFactor };
    }

    const SpriteComponent = segment.layerProps.animatedOrigin
      ? AnimatedSprite
      : Sprite;
    sprites.push(
      <SpriteComponent
        key={segment.id}
        layerProps={layerProps}
        sprite={segment.sprite}
        facing={segment.facing}
        amount={segment.amount}
        offsetX={segment.offsetX * dimensions.aspectRatio}
        offsetY={-segment.offsetY}
        offsetZ={segment.offsetZ + (layerCount * stackHeight) / stack}
      />
    );

    layerCount += layers.length;
  }

  return <>{sprites}</>;
}
