import { CSSProperties } from "react";
import { Sprite } from "../../engine/components/sprite";
import { getFacingLayers } from "../../game/assets/ui";
import { characterMarkup } from "./characters";
import "./index.css";

export type CellSprite = Sprite & { stackableAmount?: number };
type FontCell = {
  text: string;
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
  if (
    !selectable &&
    layers.length === 2 &&
    layers[0].char === "▀" &&
    layers[1].char === "▄"
  )
    return {
      text: "▀",
      color: layers[0].color,
      background: layers[1].color,
      selectable: false,
    };
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
  return {
    text: glyph?.char || " ",
    color: glyph?.color || "transparent",
    background: solid >= 0 ? base[solid].color : undefined,
    selectable,
    underlay,
    mask,
  };
}

function FontRun({ cell, count }: { cell: FontCell; count: number }) {
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
          background: cell.background,
          userSelect: cell.selectable ? "text" : "none",
        } as CSSProperties
      }
    >
      {cell.selectable ? cell.text : null}
    </span>
  );
}

export function Cell({ sprite }: { sprite: CellSprite }) {
  const native = fontCell(sprite);
  if (native) return <FontRun cell={native} count={1} />;
  const layers = getFacingLayers(sprite, undefined, sprite.stackableAmount);
  return (
    <span className="Cell SpriteCell" aria-hidden="true">
      <svg
        aria-hidden="true"
        viewBox="0 0 9 16"
        shapeRendering="crispEdges"
        dangerouslySetInnerHTML={{
          __html: characterMarkup(layers, sprite.stackableAmount),
        }}
      />
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
  for (const sprite of cells) {
    const cell = fontCell(sprite);
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
  return (
    <span className={`Row${className ? " " + className : ""}`}>
      {runs.map((run, index) =>
        run.cell ? (
          <FontRun key={index} cell={run.cell} count={run.count} />
        ) : (
          <Cell key={index} sprite={run.sprite} />
        )
      )}
    </span>
  );
}
