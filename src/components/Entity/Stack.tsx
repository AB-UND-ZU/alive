import { Sprite as SpriteType } from "../../engine/components/sprite";
import { getFacingLayers, stack, stackHeight } from "./utils";
import { useWorld } from "../../bindings/hooks";
import { Orientation } from "../../engine/components/orientable";
import Sprite, { AnimatedSprite } from "./Sprite";
import { LayerProps } from "./Layer";

export type Segment = {
  sprite: SpriteType;
  facing?: Orientation;
  offsetX: number;
  offsetY: number;
  layerProps: LayerProps;
};

export default function Stack({
  offsetZ,
  segments,
}: {
  offsetZ: number;
  segments: Segment[];
}) {
  const { ecs } = useWorld();
  const sprites: JSX.Element[] = [];
  let layerCount = 0;

  if (!ecs) return null;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];

    const layers = getFacingLayers(ecs, segment.sprite, segment.facing);
    layerCount += layers.length;

    if (
      segment.layerProps.animateOffset ||
      segment.layerProps.animateTransparency
    ) {
      sprites.push(
        <AnimatedSprite
          key={i}
          layerProps={segment.layerProps}
          sprite={segment.sprite}
          facing={segment.facing}
          offsetX={segment.offsetX}
          offsetY={segment.offsetY}
          offsetZ={offsetZ + (layerCount * stackHeight) / stack}
        />
      );
      continue;
    }

    sprites.push(
      <Sprite
        key={i}
        layerProps={segment.layerProps}
        sprite={segment.sprite}
        facing={segment.facing}
        offsetZ={offsetZ + (layerCount * stackHeight) / stack}
      />
    );
  }

  return <>{sprites}</>;
}
