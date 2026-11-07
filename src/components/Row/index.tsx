import { Sprite } from "../../engine/components/sprite";
import { getFacingLayers } from "../../game/assets/ui";
import { characterMarkup } from "./characters";
import "./index.css";

export type CellSprite = Sprite & { stackableAmount?: number };

export function Cell({ sprite }: { sprite: CellSprite }) {
  const layers = getFacingLayers(sprite, undefined, sprite.stackableAmount);
  const text = layers[layers.length - 1]?.char || " ";
  return (
    <span className="Cell">
      <svg
        aria-hidden="true"
        viewBox="0 0 9 16"
        shapeRendering="crispEdges"
        dangerouslySetInnerHTML={{
          __html: characterMarkup(layers, sprite.stackableAmount),
        }}
      />
      {text}
    </span>
  );
}
export default function Row({ cells = [] }: { cells?: CellSprite[] }) {
  return (
    <span className="Row">
      {cells.map((sprite, index) => (
        <Cell key={index} sprite={sprite} />
      ))}
    </span>
  );
}
