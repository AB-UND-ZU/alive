import { CSSProperties } from "react";
import { Layer, Sprite } from "../../engine/components/sprite";
import { getFacingLayers } from "../../game/assets/ui";
import { rowImage } from "./characters";
import "./index.css";

export type CellSprite = Sprite & { stackableAmount?: number };
type FontCell = {
  text: string;
  backgroundLayers: Layer[];
  color: string;
  background?: string;
  selectable: boolean;
  underlay?: { char: string; color: string };
  mask?: { char: string; color: string };
};

function fontCell(sprite: CellSprite): FontCell | undefined {
  if (sprite.stackableAmount && sprite.stackableAmount > 1) return;
  const layers = getFacingLayers(sprite);
  const selectable = sprite.name === "text_generic";
  if (!selectable && sprite.name !== "button_generic" && layers.length > 1)
    return;
  const foreground = selectable ? layers[layers.length - 1] : undefined;
  const base = selectable ? layers.slice(0, -1) : layers;
  const solid = base.map((layer) => layer.char).lastIndexOf("█");
  const visible = (solid >= 0 ? base.slice(solid + 1) : base).filter((layer) =>
    layer.char.trim()
  );
  const underlay =
    selectable &&
    visible[0] &&
    ["_", "▄", "▀", "░", "▒", "▓"].includes(visible[0].char)
      ? visible[0]
      : undefined;
  const mask =
    underlay && visible.length === 2 && visible[1].char === "▀"
      ? visible[1]
      : undefined;
  if (
    selectable
      ? visible.length > (mask ? 2 : underlay ? 1 : 0)
      : visible.length > 1
  )
    return;
  const glyph = foreground || visible[visible.length - 1];
  if (glyph && /^[\u2500-\u259f]$/.test(glyph.char)) return;
  return {
    text: glyph?.char || " ",
    color: glyph?.color || "transparent",
    background: solid >= 0 ? base[solid].color : undefined,
    backgroundLayers: [
      ...(solid >= 0 ? [base[solid]] : []),
      ...(underlay ? [underlay] : []),
      ...(mask ? [mask] : []),
    ],
    selectable,
    underlay,
    mask,
  };
}

function FontRun({
  cell,
  count,
  paint = true,
}: {
  cell: FontCell;
  count: number;
  paint?: boolean;
}) {
  const background = paint
    ? rowImage(
        Array.from({ length: count }, () => ({ layers: cell.backgroundLayers }))
      )
    : undefined;
  return (
    <span
      className="Cell CellGlyph CellRun"
      data-cells={count}
      data-underlay={cell.underlay?.char.repeat(count)}
      data-mask={cell.mask?.char.repeat(count)}
      data-glyph={cell.selectable ? undefined : cell.text}
      aria-hidden={cell.selectable ? undefined : true}
      style={
        {
          "--glyph-color": cell.color,
          "--underlay-color": cell.underlay?.color,
          "--mask-color": cell.mask?.color,
          width: `calc(var(--cell-width) * ${count})`,
          flexBasis: `calc(var(--cell-width) * ${count})`,
          "--cell-background": cell.background,
          userSelect: cell.selectable ? "text" : "none",
          WebkitUserSelect: cell.selectable ? "text" : "none",
        } as CSSProperties
      }
    >
      {background && (
        <img
          className="CellBackground"
          src={background}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}
      {cell.selectable ? cell.text : null}
    </span>
  );
}

export function Cell({
  sprite,
  paint = true,
}: {
  sprite: CellSprite;
  paint?: boolean;
}) {
  const native = fontCell(sprite);
  if (native) return <FontRun cell={native} count={1} paint={paint} />;
  const layers = getFacingLayers(sprite, undefined, sprite.stackableAmount);
  const selectable = sprite.name === "text_generic";
  return (
    <span
      className="Cell SpriteCell"
      aria-hidden={selectable ? undefined : true}
      data-glyph={
        sprite.name === "button_generic"
          ? layers[layers.length - 1]?.char
          : undefined
      }
      style={{
        userSelect: selectable ? "text" : "none",
        WebkitUserSelect: selectable ? "text" : "none",
      }}
    >
      {selectable ? layers[layers.length - 1]?.char : null}
      {paint && (
        <img
          aria-hidden="true"
          alt=""
          draggable={false}
          src={rowImage([{ layers, amount: sprite.stackableAmount }])}
        />
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
  const runs: { cell?: FontCell; sprite: CellSprite; count: number }[] = [];
  const graphics: { layers: Layer[]; amount?: number }[] = [];
  for (const sprite of cells) {
    const cell = fontCell(sprite);
    graphics.push({
      layers: cell
        ? cell.backgroundLayers
        : getFacingLayers(sprite, undefined, sprite.stackableAmount),
      amount: cell ? undefined : sprite.stackableAmount,
    });
    const previous = runs[runs.length - 1];
    if (
      cell &&
      previous?.cell &&
      cell.color === previous.cell.color &&
      cell.background === previous.cell.background &&
      cell.underlay?.char === previous.cell.underlay?.char &&
      cell.underlay?.color === previous.cell.underlay?.color &&
      cell.mask?.char === previous.cell.mask?.char &&
      cell.mask?.color === previous.cell.mask?.color &&
      cell.selectable === previous.cell.selectable
    ) {
      previous.cell.text += cell.text;
      previous.count++;
    } else runs.push({ cell, sprite, count: 1 });
  }
  const image = rowImage(graphics);
  return (
    <span className={`Row${className ? " " + className : ""}`}>
      {image && (
        <img
          className="RowPixels"
          alt=""
          aria-hidden="true"
          draggable={false}
          src={image}
          style={{
            width: `calc(var(--cell-width) * ${cells.length} + var(--pixel-size) * 2)`,
          }}
        />
      )}
      {runs.map((run, index) =>
        run.cell ? (
          <FontRun
            key={index}
            cell={run.cell}
            count={run.count}
            paint={false}
          />
        ) : (
          <Cell key={index} sprite={run.sprite} paint={false} />
        )
      )}
    </span>
  );
}
