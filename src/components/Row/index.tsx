import { STACK_SIZE } from "../../engine/components/item";
import { Layer, Sprite } from "../../engine/components/sprite";
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
          {Array.from({ length: stackableAmount }).map((_, index) => (
            <span
            key={index}
              className="Dot"
              style={{
                top: `calc(var(--pixel-size) * (13 + ${
                  index >= STACK_SIZE / 2 ? 2 : 0
                }))`,
                left: `calc(0.95 * var(--pixel-size) * ${
                  (index % (STACK_SIZE / 2)) * 2
                })`,
              }}
            ></span>
          ))}
        </>
      )}
      {/* 
          position-x={((index % (STACK_SIZE / 2)) * 2 - 4) / pixels}
          position-y={(-4.5 + (index >= STACK_SIZE / 2 ? -2 : 0)) / pixels}
       */}
    </div>
  );
}

export default function Row({ cells = [] }: { cells?: CellSprite[] }) {
  return (
    <div className="Row">
      {cells.map((cell, index) => (
        <Cell
          key={index}
          layers={cell.amounts?.multiple || cell.layers}
          stackableAmount={cell.stackableAmount}
        />
      ))}
    </div>
  );
}
