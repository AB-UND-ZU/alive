import type { CSSProperties, ReactNode } from "react";
import { Layer, Sprite } from "../../engine/components/sprite";
import { getFacingLayers } from "../../game/assets/ui";
import { characterImage } from "./characters";
import "./index.css";

export type CellSprite = Sprite & { stackableAmount?: number };

export function Cell({
  layers,
  name,
  dots,
  className = "",
  style,
  children,
}: {
  layers: Layer[];
  name?: string;
  dots?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const text = name === "text_generic" || name === "button_generic";
  const last = layers[layers.length - 1];
  const backedText = text && layers.length === 2 && layers[0].char === "█";
  const glyph = layers.length === 1 || backedText ? last : undefined;
  // Box and block glyphs meet their neighbours at the edge of the font bitmap.
  const graphic = !!dots || (last && (!glyph || /[─-▟]/u.test(glyph.char)));
  return (
    <span
      className={className ? `Cell ${className}` : "Cell"}
      data-glyph={graphic ? last?.char : undefined}
      style={
        backedText ? { ...style, backgroundColor: layers[0].color } : style
      }
    >
      {glyph && (!graphic || text) && (
        <span
          className="Layer"
          style={{ color: graphic ? "transparent" : glyph.color }}
        >
          {glyph.char}
        </span>
      )}
      {graphic && (
        <img
          alt=""
          decoding="sync"
          draggable={false}
          src={characterImage(layers, dots)}
        />
      )}
      {children}
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
          name={cell.name}
          layers={getFacingLayers(cell, undefined, cell.stackableAmount)}
          dots={
            (cell.stackableAmount ?? 0) > 1 ? cell.stackableAmount : undefined
          }
        />
      ))}
    </span>
  );
}
