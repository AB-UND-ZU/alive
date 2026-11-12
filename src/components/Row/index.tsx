import { Layer, Sprite } from "../../engine/components/sprite";
import { dotCount } from "../Entity/Dots";
import { getFacingLayers } from "../../game/assets/ui";
import { characterMarkup } from "./characters";
import "./index.css";

export type CellSprite = Sprite & { stackableAmount?: number };

function Cell({
  layers,
  stackableAmount,
}: {
  layers: Layer[];
  stackableAmount?: number;
}) {
  return (
    <span
      className="Cell"
      data-glyph={
        layers.length > 1 ? layers[layers.length - 1].char : undefined
      }
    >
      &nbsp;
      {layers.length > 1 ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 9 16"
          shapeRendering="crispEdges"
          dangerouslySetInnerHTML={{ __html: characterMarkup(layers) }}
        />
      ) : (
        layers.map((layer, index) => (
          <span key={index} style={{ color: layer.color }} className="Layer">
            {layer.char}
          </span>
        ))
      )}
      {stackableAmount !== undefined && stackableAmount > 1 && (
        <>
          {Array.from({ length: Math.min(stackableAmount, 10) }).map(
            (_, index) => (
              <span
                key={index}
                className="Dot"
                style={{
                  top: `calc(var(--pixel-size) * (13 + ${
                    index >= dotCount ? 2 : 0
                  }))`,
                  left: `calc(0.95 * var(--pixel-size) * ${
                    (index % dotCount) * 2
                  })`,
                }}
              ></span>
            )
          )}
        </>
      )}
    </span>
  );
}

export default function Row({
  cells = [],
  className = "",
}: {
  cells?: CellSprite[];
  className?: string;
}) {
  return (
    <span className={`Row${className ? ` ${className}` : ""}`}>
      {cells.map((cell, index) => (
        <Cell
          key={index}
          layers={getFacingLayers(cell, undefined, cell.stackableAmount)}
          stackableAmount={cell.stackableAmount}
        />
      ))}
    </span>
  );
}
