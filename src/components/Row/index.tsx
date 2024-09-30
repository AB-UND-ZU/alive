import { Layer, Sprite } from "../../engine/components/sprite";
import "./index.css";

function Cell({ layers }: { layers: Layer[] }) {
  return (
    <div className="Cell">
      &nbsp;
      {layers.map((layer, index) => (
        <span key={index} style={{ color: layer.color }} className="Layer">
          {layer.char}
        </span>
      ))}
    </div>
  );
}

export default function Row({ cells }: { cells: Sprite[] }) {
  return (
    <div className="Row">
      {cells.map((cell, index) => (
        <Cell key={index} layers={cell.amounts?.multiple || cell.layers} />
      ))}
    </div>
  );
}
