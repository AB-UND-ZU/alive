import {
  ReactNode,
  isValidElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Pixels, Text, textSprites } from "./visuals";
import { ReferenceContext, ReferenceText } from "./references";
import { colors } from "../game/assets/colors";
import { characterMarkup } from "../components/Row/characters";
import "./GridTable.css";
const edgeImage = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 16">${characterMarkup(
    [{ char: "│", color: colors.silver }]
  )}</svg>`
)}")`;
const emptyCell = (value: ReactNode): boolean => {
  if (value === null || value === undefined || value === false) return true;
  if (typeof value === "string")
    return !value.trim() || value.trim() === "None";
  if (isValidElement<{ children?: ReactNode; text?: string }>(value)) {
    if (value.type === Text) return emptyCell(value.props.children);
    if (value.type === ReferenceText) return emptyCell(value.props.text);
  }
  return false;
};
export function GridTable({
  headers,
  rows,
  compact = false,
  framed = false,
  rowHeaders = true,
}: {
  headers: string[];
  rows: ReactNode[][];
  compact?: boolean;
  framed?: boolean;
  rowHeaders?: boolean;
}) {
  const { decorations = {} } = useContext(ReferenceContext);
  const visibleRows = rows.filter((row) =>
    (row.length > 1 ? row.slice(1) : row).some((value) => !emptyCell(value))
  );
  const container = useRef<HTMLDivElement>(null),
    table = useRef<HTMLTableElement>(null);
  const [widths, setWidths] = useState(() => headers.map(() => 6));
  const layout = useCallback(() => {
    if (!container.current || !table.current) return;
    const cells = headers.map((_, column) =>
      Array.from(
        table.current!.querySelectorAll<HTMLElement>(
          `tbody [data-column="${column}"]`
        )
      )
    );
    const content = cells.map((column) =>
      column.map((cell) => {
        const texts = Array.from(cell.querySelectorAll(".Text"));
        if (texts.length)
          return texts.map((text) => text.textContent || "").join(" ");
        const visible = cell.cloneNode(true) as HTMLElement;
        visible
          .querySelectorAll(".SpriteState:not(.StateIdle), .LargePreview")
          .forEach((state) => state.remove());
        return visible.textContent || "";
      })
    );
    const minima = content.map((values, column) =>
      Math.max(
        compact ? 1 : 6,
        ...cells[column].flatMap((cell) =>
          Array.from(cell.querySelectorAll(".LargePreview .Row")).map(
            (row) => row.querySelectorAll(".Cell").length + (compact ? 0 : 2)
          )
        ),
        ...cells[column].flatMap((cell) =>
          Array.from(cell.querySelectorAll(".Item, .RichMention"))
            .filter((mention) => mention.querySelector(".Pixels"))
            .map(
              (mention) =>
                (mention.textContent || "").length + (compact ? 0 : 2)
            )
        ),
        ...[headers[column], ...values].flatMap((value) =>
          (value.match(/\S+/g) || []).map(
            (word) => word.length + (compact ? 0 : 2)
          )
        )
      )
    );
    const preferred = content.map((values, column) =>
      Math.max(
        minima[column],
        Math.min(
          24,
          Math.max(
            headers[column].length + (compact ? 0 : 2),
            ...values.map((value) => value.length + (compact ? 0 : 2))
          )
        )
      )
    );
    const available =
      Math.floor(container.current.clientWidth / 18) -
      headers.length +
      1 -
      (framed ? 2 : 0);
    const next = [...minima];
    let extra = Math.max(
      0,
      Math.min(
        available,
        preferred.reduce((sum, width) => sum + width, 0)
      ) - minima.reduce((sum, width) => sum + width, 0)
    );
    while (extra > 0) {
      const column = preferred.reduce(
        (best, width, index) =>
          width - next[index] > preferred[best] - next[best] ? index : best,
        0
      );
      if (next[column] === preferred[column]) break;
      next[column]++;
      extra--;
    }
    setWidths((previous) =>
      previous.join() === next.join() ? previous : next
    );
  }, [headers, compact, framed]);
  useLayoutEffect(layout, [layout, visibleRows]);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(layout);
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, [layout]);
  const rule = (kind: "header" | "row" | "top" | "bottom", key: string) => {
    const [left, middle, right, line] =
      kind === "header"
        ? ["╞", "╪", "╡", "═"]
        : kind === "top"
        ? ["┌", "┬", "┐", "─"]
        : kind === "bottom"
        ? ["└", "┴", "┘", "─"]
        : ["├", "┼", "┤", "─"];
    const first = (framed ? left : "") + line.repeat(widths[0]);
    const rest =
      (widths.length > 1
        ? middle +
          widths
            .slice(1)
            .map((width) => line.repeat(width))
            .join(middle)
        : "") + (framed ? right : "");
    const firstSpan = framed ? 2 : 1;
    const totalSpan = headers.length * 2 - 1 + (framed ? 2 : 0);
    return (
      <tr className="GridRule" key={key} aria-hidden="true">
        <td className="GridFrozenRule" colSpan={firstSpan}>
          <Pixels rows={[textSprites(first, colors.silver)]} />
        </td>
        {rest && (
          <td colSpan={totalSpan - firstSpan}>
            <Pixels rows={[textSprites(rest, colors.silver)]} />
          </td>
        )}
      </tr>
    );
  };
  const cellText = (value: string) => {
    const items = value.split(/,\s*|\s+(?:and|\+)\s+/);
    if (
      items.length > 1 &&
      items.every((item) => decorations[item.toLowerCase()]?.sprite)
    ) {
      return items.map((item, index) => (
        <div key={index}>
          <ReferenceText text={item} />
        </div>
      ));
    }
    return <ReferenceText text={value} />;
  };
  const cells = (values: ReactNode[], header = false) => {
    return [
      ...values.flatMap((value, column) => {
        const Tag = header || (rowHeaders && column === 0) ? "th" : "td";
        return [
          ...(column || framed
            ? [
                <td
                  className="GridEdge"
                  key={`edge-${column}`}
                  aria-hidden="true"
                  style={{ backgroundImage: edgeImage }}
                />,
              ]
            : []),
          <Tag
            key={column}
            className="GridValue"
            data-column={column}
            scope={
              header ? "col" : rowHeaders && column === 0 ? "row" : undefined
            }
            style={{
              width: widths[column] * 18,
              ...(column === 0 ? { left: framed ? 18 : 0 } : {}),
            }}
          >
            <div>
              {emptyCell(value) ? null : typeof value === "string" ? (
                header ? (
                  <Text color={colors.white}>{value}</Text>
                ) : (
                  cellText(value)
                )
              ) : (
                value
              )}
            </div>
          </Tag>,
        ];
      }),
      ...(framed
        ? [
            <td
              key="end"
              className="GridEdge"
              aria-hidden="true"
              style={{ backgroundImage: edgeImage }}
            />,
          ]
        : []),
    ];
  };
  return (
    <div className="TableScroll" ref={container}>
      <table
        ref={table}
        className={`GridTable ${compact ? "CompactGrid" : ""} ${
          framed ? "FramedGrid" : ""
        }`}
        style={{
          width:
            (widths.reduce((sum, width) => sum + width, 0) +
              headers.length -
              1 +
              (framed ? 2 : 0)) *
            18,
        }}
      >
        <colgroup>
          {widths.flatMap((width, index) => [
            ...(index || framed
              ? [<col key={`edge-${index}`} style={{ width: 18 }} />]
              : []),
            <col key={index} style={{ width: width * 18 }} />,
          ])}
          {framed && <col style={{ width: 18 }} />}
        </colgroup>
        <thead>
          {framed && rule("top", "top")}
          <tr>{cells(headers, true)}</tr>
          {rule("header", "header")}
        </thead>
        <tbody>
          {visibleRows.flatMap((row, index) => [
            <tr key={index}>{cells(row)}</tr>,
            ...(index < visibleRows.length - 1
              ? [rule("row", `line-${index}`)]
              : []),
          ])}
          {framed && rule("bottom", "bottom")}
        </tbody>
      </table>
    </div>
  );
}
