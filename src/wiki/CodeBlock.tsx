import { Fragment, useState, useContext, useLayoutEffect, useRef } from "react";
import { Sprite } from "../engine/components/sprite";
import { Orientation } from "../engine/components/orientable";
import { popupCorner, popupSide } from "../game/assets/sprites";
import { createTab, getFacingLayers } from "../game/assets/ui";
import { colors } from "../game/assets/colors";
import { Button, Pixels, Text } from "./visuals";
import { ReferenceContext } from "./references";
import { WikiToken } from "./types";
import "./CodeBlock.css";
const facing = (sprite: Sprite, orientation: Orientation): Sprite => ({
  ...sprite,
  layers: getFacingLayers(sprite, orientation),
});
const syntaxColors = {
  plain: colors.white,
  keyword: colors.aqua,
  string: colors.lime,
  number: colors.yellow,
  comment: colors.grey,
  type: colors.teal,
};
export function CodeBlock({
  text,
  language = "",
  source,
  syntax,
}: {
  text: string;
  language?: string;
  source: string;
  syntax?: WikiToken["syntax"];
}) {
  const [copied, setCopied] = useState(false);
  const { link } = useContext(ReferenceContext);
  const [lang, explicit] = language.split(/\s+/, 2);
  const filename =
    explicit?.replace(/^file=/, "") ||
    (source.startsWith("src/")
      ? source.replace(/\.md$/, "") +
        (/^(tsx?|jsx?)$/.test(lang) ? `.${lang}` : ".ts")
      : source.replace(/^wiki\//, "").replace(/\.md$/, "") +
        `.${!lang || lang === "text" ? "txt" : lang}`);
  const basename = filename.split("/").pop() || filename;
  const lines = text.split("\n"),
    digits = String(lines.length).length;
  const width = Math.max(
    1,
    ...lines.map((line) => line.replace(/\t/g, "  ").length)
  );
  const gutter = digits * 18;
  const container = useRef<HTMLElement>(null);
  const [available, setAvailable] = useState(30);
  useLayoutEffect(() => {
    const measure = (width: number) => {
      if (width > 0)
        setAvailable(Math.max(6, Math.floor(width / 18) - digits - 2));
    };
    measure(container.current?.clientWidth || 0);
    const observer = new ResizeObserver(([entry]) =>
      measure(entry.contentRect.width)
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, [digits]);
  const columns = Math.min(available, Math.max(8, width, basename.length + 2));
  const tab =
    basename.length > columns - 2
      ? "." + basename.slice(-(columns - 3))
      : basename;
  let nextPart = 0;
  const tokenLines = lines.map((line, index) =>
    (syntax?.[index] || [{ text: line, kind: "plain" as const }]).map(
      (part) => ({
        ...part,
        href:
          part.kind === "plain" || part.kind === "type" ? part.href : undefined,
        id: nextPart++,
      })
    )
  );
  const border = (top: boolean) => [
    facing(popupCorner, top ? "up" : "left"),
    ...(top ? createTab(tab, tab.length + 2, true) : []),
    ...Array.from({ length: top ? columns - tab.length - 2 : columns }, () =>
      facing(popupSide, top ? "up" : "down")
    ),
    facing(popupCorner, top ? "right" : "down"),
  ];
  const wall = (side: Orientation) =>
    Array.from({ length: lines.length }, () => [facing(popupSide, side)]);
  return (
    <section
      className="CodeBlock"
      aria-label={filename}
      title={filename}
      ref={container}
    >
      <div>
        <div className="CodeChrome" style={{ marginLeft: gutter }}>
          <Pixels rows={[border(true)]} />
        </div>
        <div
          className="CodeBody"
          style={{ width: (digits + columns + 2) * 18 }}
        >
          <div
            className="CodeNumbers"
            style={{ width: gutter }}
            aria-hidden="true"
          >
            {lines.map((_, index) => (
              <div key={index}>
                <Text color={colors.grey}>
                  {String(index + 1).padStart(digits)}
                </Text>
              </div>
            ))}
          </div>
          <div className="CodeChrome">
            <Pixels rows={wall("left")} />
          </div>
          <div className="CodeScroll" key={source + "\n" + text}>
            <div className="CodeSurface" style={{ width: width * 18 }}>
              <pre className="CodeSemantic" aria-label={text}>
                <code>
                  {tokenLines.map((line, index) => (
                    <Fragment key={index}>
                      {index > 0 && "\n"}
                      {line.map((part) => (
                        <span
                          key={part.id}
                          className={`CodePart${part.id} CellGlyph`}
                          style={{ color: syntaxColors[part.kind] }}
                        >
                          {part.href
                            ? link(part.href, part.text, true)
                            : part.text}
                        </span>
                      ))}
                    </Fragment>
                  ))}
                </code>
              </pre>
            </div>
          </div>
          <div className="CodeChrome">
            <Pixels rows={wall("right")} />
          </div>
        </div>
        <div className="CodeFooter CodeChrome" style={{ marginLeft: gutter }}>
          <Pixels rows={[border(false)]} />
          <Button
            palette="lime"
            onClick={() =>
              navigator.clipboard.writeText(text).then(() => setCopied(true))
            }
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    </section>
  );
}
