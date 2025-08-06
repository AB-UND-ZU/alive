import { Layer, Sprite } from "../../engine/components/sprite";
import { dotCount } from "../Entity/Dots";
import { getFacingLayers } from "../Entity/utils";
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
    <div className="Cell">
      &nbsp;
      {layers.map((layer, index) => (
        <span key={index} style={{ color: layer.color }} className="Layer">
          {layer.char}
        </span>
      ))}
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
    </div>
  );
}

export default function Row({ cells = [] }: { cells?: CellSprite[] }) {
  return (
    <div className="Row">
      {cells.map((cell, index) => (
        <Cell
          key={index}
          layers={getFacingLayers(cell, undefined, cell.stackableAmount)}
          stackableAmount={cell.stackableAmount}
        />
      ))}
    </div>
  );
}
