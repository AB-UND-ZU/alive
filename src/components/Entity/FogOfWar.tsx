import Sprite from "./Sprite";
import { fogOfWar } from "../../game/assets/sprites";
import { fogHeight } from "./utils";

export default function FogOfWar() {
  return (
    <Sprite
      offsetX={0}
      offsetY={0}
      offsetZ={fogHeight}
      sprite={fogOfWar}
      layerProps={{ isTransparent: false, receiveShadow: false }}
    />
  );
}
