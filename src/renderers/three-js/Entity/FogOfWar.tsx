import Sprite from "./Sprite";
import type { Sprite as EntitySprite } from "../../../engine/components/sprite";
import { getFogOverlay } from "../../interface/segments";

export default function FogOfWar({ surface }: { surface: EntitySprite }) {
  const overlay = getFogOverlay(surface);
  return (
    <Sprite
      offsetX={0}
      offsetY={0}
      offsetZ={overlay.offsetZ}
      sprite={overlay.sprite}
      layerProps={{ isTransparent: false, receiveShadow: false }}
    />
  );
}
