import {
  CSSProperties,
  ReactNode,
  isValidElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Pixels,
  Text,
  textSprites,
  NativeRule,
  TableContext,
  TextColorContext,
  Count,
} from "./visuals";
import { ReferenceContext, ReferenceText } from "./references";
import { colors } from "../game/assets/colors";
import "./GridTable.css";
const edgeSprite = {
  name: "table rule",
  layers: [{ char: "│", color: colors.silver }],
};
const emptyCell = (value: ReactNode): boolean => {
  if (value === null || value === undefined || value === false || value === 0)
    return true;
  if (typeof value === "string")
    return !value.trim() || value.trim() === "None" || value.trim() === "0";
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
  rowHeaders = true,
}: {
  headers: ReactNode[];
  rows: ReactNode[][];
  compact?: boolean;
  rowHeaders?: boolean;
}) {
  const { decorations = {} } = useContext(ReferenceContext);
  const visibleRows = rows.filter((row) =>
    (row.length > 1 ? row.slice(1) : row).some((value) => !emptyCell(value))
  );
  const container = useRef<HTMLDivElement>(null),
    table = useRef<HTMLTableElement>(null);
  const [rowLines, setRowLines] = useState<number[]>([]);
  const [widths, setWidths] = useState(() => headers.map(() => 6));
  const layout = useCallback(() => {
    if (!container.current || !table.current) return;
    const nextRowLines = Array.from(table.current.rows).map((row) =>
      Math.max(1, Math.ceil(row.clientHeight / 32))
    );
    setRowLines((previous) =>
      previous.join() === nextRowLines.join() ? previous : nextRowLines
    );
    const headerText = headers.map((header, column) =>
      typeof header === "string"
        ? header
        : table.current!.querySelector(`thead [data-column="${column}"]`)
            ?.textContent || ""
    );
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
          .querySelectorAll(".SpriteState:not(.StateIdle), .Pixels")
          .forEach((state) => state.remove());
        return visible.textContent || "";
      })
    );
    const minima = content.map((values, column) =>
      Math.max(
        compact ? 1 : 6,
        ...cells[column].flatMap((cell) =>
          cell.querySelector(".Key")
            ? [
                Math.ceil(
                  (cell.firstElementChild as HTMLElement)?.scrollWidth / 18
                ) + (compact ? 0 : 2),
              ]
            : []
        ),
        ...cells[column].flatMap((cell) =>
          Array.from(cell.querySelectorAll(".Pixels > .Row")).map(
            (row) =>
              Math.ceil(row.getBoundingClientRect().width / 18) +
              (compact ? 0 : 2)
          )
        ),
        ...cells[column].flatMap((cell) =>
          Array.from(cell.querySelectorAll(".Item, .RichMention"))
            .filter((mention) => mention.querySelector(".Pixels"))
            .map(
              (mention) =>
                Math.ceil(mention.getBoundingClientRect().width / 18) +
                (compact ? 0 : 2) +
                (mention.closest(".FrameScroll") ? 2 : 0)
            )
        ),
        ...[headerText[column], ...values].flatMap((value) =>
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
            headerText[column].length + (compact ? 0 : 2),
            ...values.map((value) => value.length + (compact ? 0 : 2))
          )
        )
      )
    );
    const available =
      Math.floor(container.current.clientWidth / 18) - headers.length + 1;
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
  }, [headers, compact]);
  useLayoutEffect(layout, [layout, visibleRows]);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(layout);
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, [layout]);
  const rule = (kind: "header" | "row", key: string) => {
    const [middle, line] = kind === "header" ? ["╪", "═"] : ["┼", "─"];
    const rest = widths
      .slice(1)
      .map((width) => line.repeat(width))
      .join(middle);
    return (
      <tr className="GridRule" key={key} aria-hidden="true">
        <td className="GridFrozenRule">
          <Pixels rows={[textSprites(line.repeat(widths[0]), colors.silver)]} />
        </td>
        {widths.length > 1 && (
          <>
            <td className="GridFrozenEdge">
              <Pixels rows={[textSprites(middle, colors.silver)]} />
            </td>
            <td colSpan={headers.length * 2 - 3}>
              <Pixels rows={[textSprites(rest, colors.silver)]} />
            </td>
          </>
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
  const cells = (values: ReactNode[], header = false, rowIndex = 0) => {
    return [
      ...values.flatMap((value, column) => {
        const Tag = header || (rowHeaders && column === 0) ? "th" : "td";
        return [
          ...(column
            ? [
                <td
                  className={`GridEdge${column === 1 ? " GridFrozenEdge" : ""}`}
                  key={`edge-${column}`}
                  aria-hidden="true"
                >
                  <NativeRule
                    sprite={edgeSprite}
                    lines={rowLines[rowIndex] || 1}
                  />
                </td>,
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
              ...(column === 0 ? { left: 0 } : {}),
            }}
          >
            <div>
              {emptyCell(value) ? null : typeof value === "string" ? (
                header ? (
                  <Text color={colors.white}>{value}</Text>
                ) : (
                  cellText(value)
                )
              ) : typeof value === "number" ? (
                <Count value={value} />
              ) : header ? (
                <TextColorContext.Provider value={colors.white}>
                  {value}
                </TextColorContext.Provider>
              ) : (
                value
              )}
            </div>
          </Tag>,
        ];
      }),
    ];
  };
  return (
    <TableContext.Provider value>
      <div className="TableScroll" ref={container}>
        <table
          ref={table}
          className={`GridTable ${compact ? "CompactGrid" : ""}`}
          style={
            {
              "--frozen-left": `${widths[0] * 18}px`,
              width:
                (widths.reduce((sum, width) => sum + width, 0) +
                  headers.length -
                  1) *
                18,
            } as CSSProperties
          }
        >
          <colgroup>
            {widths.flatMap((width, index) => [
              ...(index
                ? [<col key={`edge-${index}`} style={{ width: 18 }} />]
                : []),
              <col key={index} style={{ width: width * 18 }} />,
            ])}
          </colgroup>
          <thead>
            <tr>{cells(headers, true)}</tr>
            {rule("header", "header")}
          </thead>
          <tbody>
            {visibleRows.flatMap((row, index) => [
              <tr key={index}>{cells(row, false, index * 2 + 2)}</tr>,
              ...(index < visibleRows.length - 1
                ? [rule("row", `line-${index}`)]
                : []),
            ])}
          </tbody>
        </table>
      </div>
    </TableContext.Provider>
  );
}
