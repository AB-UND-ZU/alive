import { offsetFactors, stack, stackHeight } from "../../interface/segments";
import { getFacingLayers } from "../../../game/assets/ui";
import { useWorld } from "../../interface/hooks";
import Sprite, { AnimatedSprite } from "./Sprite";
import { LayerProps } from "./Layer";
import { useDimensions } from "../../../components/Dimensions";

export type Segment = import("../../interface/segments").Segment<LayerProps>;

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
