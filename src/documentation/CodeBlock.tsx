import { useState, useContext, useLayoutEffect, useRef } from "react";
import { Sprite } from "../engine/components/sprite";
import { Orientation } from "../engine/components/orientable";
import { popupCorner, popupSide } from "../game/assets/sprites";
import { createTab, getFacingLayers } from "../game/assets/ui";
import { colors } from "../game/assets/colors";
import { Button, Pixels, Text, LinkStyleContext } from "./visuals";
import { ReferenceContext } from "./references";
import { DocToken } from "./types";
const facing = (sprite: Sprite, orientation: Orientation): Sprite => ({
  ...sprite,
  layers: getFacingLayers(sprite, orientation),
});
const referenceClass = (href: string) =>
  "CodeRef" +
  [...href]
    .reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) | 0, 0)
    .toString(36)
    .replace("-", "n");
const syntaxColors = {
  plain: colors.white,
  keyword: colors.aqua,
  string: colors.lime,
  number: colors.yellow,
  comment: colors.grey,
  type: colors.teal,
};
function SemanticCode({ text }: { text: string }) {
  const { entries, pattern, link } = useContext(ReferenceContext);
  return (
    <>
      {text.split(pattern || /([A-Za-z_][A-Za-z_0-9]*)/).map((part, i) => {
        const reference = entries[part] || entries[part.toLowerCase()];
        return (
          <span
            key={i}
            className={reference ? referenceClass(reference.href) : undefined}
          >
            {reference ? link(reference.href, part) : part}
          </span>
        );
      })}
    </>
  );
}
function HighlightedCode({ text, color }: { text: string; color: string }) {
  const { entries, pattern } = useContext(ReferenceContext);
  return (
    <>
      {text.split(pattern || /([A-Za-z_][A-Za-z_0-9]*)/).map((part, index) => {
        const reference = entries[part] || entries[part.toLowerCase()];
        return (
          <span
            key={index}
            className={reference ? referenceClass(reference.href) : undefined}
          >
            <LinkStyleContext.Provider
              value={{
                linked: !!reference,
                hovered: false,
                preserveColor: false,
              }}
            >
              <Text color={color}>{part}</Text>
            </LinkStyleContext.Provider>
          </span>
        );
      })}
    </>
  );
}
export function CodeBlock({
  text,
  language = "",
  source,
  syntax,
}: {
  text: string;
  language?: string;
  source: string;
  syntax?: DocToken["syntax"];
}) {
  const [copied, setCopied] = useState(false);
  const { entries, pattern } = useContext(ReferenceContext);
  const referenced = new Set(
    text
      .split(pattern || /([A-Za-z_][A-Za-z_0-9]*)/)
      .map((part) => (entries[part] || entries[part.toLowerCase()])?.href)
      .filter(Boolean)
  );
  const [lang, explicit] = language.split(/\s+/, 2);
  const filename =
    explicit?.replace(/^file=/, "") ||
    (source.startsWith("src/")
      ? source.replace(/\.md$/, "") +
        (/^(tsx?|jsx?)$/.test(lang) ? `.${lang}` : ".ts")
      : source.replace(/^docs\//, "").replace(/\.md$/, "") +
        `.${!lang || lang === "text" ? "txt" : lang}`);
  const lines = text.split("\n"),
    digits = String(lines.length).length;
  const width = Math.max(
    filename.length + 2,
    ...lines.map((line) => line.replace(/\t/g, "  ").length)
  );
  const gutter = digits * 18;
  const container = useRef<HTMLElement>(null);
  const [columns, setColumns] = useState(30);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setColumns(
        Math.max(6, Math.floor(entry.contentRect.width / 18) - digits - 2)
      )
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, [digits]);
  const tab =
    filename.length > columns - 2
      ? "." + filename.slice(-(columns - 3))
      : filename;
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
    <section className="CodeBlock" aria-label={filename} ref={container}>
      <style>
        {[...referenced]
          .map(
            (href) =>
              `.CodeBlock:has(.CodeSemantic .${referenceClass(
                href!
              )}:is(:hover,:focus-within)) .CodePixels .${referenceClass(
                href!
              )} .LinkText svg rect{fill:${colors.aqua}}`
          )
          .join("\n")}
      </style>
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
            {lines.map((_, i) => (
              <div key={i}>
                <Text color={colors.grey}>{`${String(i + 1).padStart(
                  digits
                )}`}</Text>
              </div>
            ))}
          </div>
          <div className="CodeChrome">
            <Pixels rows={wall("left")} />
          </div>
          <div className="CodeScroll">
            <div className="CodeSurface" style={{ width: width * 18 }}>
              <div className="CodePixels" aria-hidden="true">
                {lines.map((line, i) => (
                  <div className="CodeSourceLine" key={i}>
                    {(
                      syntax?.[i] || [{ text: line, kind: "plain" as const }]
                    ).map((part, j) => (
                      <HighlightedCode
                        key={j}
                        color={syntaxColors[part.kind]}
                        text={part.text.replace(/\t/g, "  ")}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <pre className="CodeSemantic" aria-label={text}>
                <code>
                  <SemanticCode text={text} />
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
