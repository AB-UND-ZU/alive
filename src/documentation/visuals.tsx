import { ReferenceLink } from "./references";
import {
  useState,
  createContext,
  useContext,
  Fragment,
  ReactNode,
  RefObject,
  useLayoutEffect,
  useRef,
} from "react";
import Row from "../components/Row";
import { Sprite } from "../engine/components/sprite";
import { Item } from "../engine/components/item";
import { Equipment } from "../engine/components/equippable";
import {
  createText,
  createSpriteButton,
  createTab,
  underline,
  shaded,
  Palette,
  Stats,
  getStatSprite,
  getStatColor,
  mergeSprites,
} from "../game/assets/ui";
import { colors } from "../game/assets/colors";
import { getItemSprite } from "../game/assets/utils";
import {
  keyLeft,
  keyRight,
  keySocketLeft,
  keySocket,
  keySocketRight,
  popupSelection,
  none,
  emptySlot,
  weaponSlot,
  offhandSlot,
  spellSlot,
  skillSlot,
  toolSlot,
  ringSlot,
  amuletSlot,
  torchSlot,
  compassSlot,
  mapSlot,
  bootsSlot,
} from "../game/assets/sprites";
import { pixelFrame } from "../game/assets/pixels";
import font from "../game/assets/font.json";
import { characterMarkup } from "../components/Row/characters";
import "./visuals.css";
const glyphs = font.glyphs as Record<string, unknown>;
const aliases: Record<string, string> = {
  "↑": "\u0117",
  "↓": "\u0118",
  "←": "\u011a",
  "→": "\u0119",
  "►": ">",
  "◄": "<",
  "’": "'",
  "‘": "'",
  "–": "-",
  "—": "-",
  "…": "...",
};
export const textSprites = (text: string, color: string = colors.silver) =>
  createText(
    [...text].map((c) => aliases[c] || (glyphs[c] ? c : "?")).join(""),
    color
  );
export function Pixels({
  rows,
  label,
  className = "",
}: {
  rows: Sprite[][];
  label?: string;
  className?: string;
}) {
  return (
    <span className={`Pixels ${className}`} aria-label={label}>
      {rows.map((cells, i) => (
        <Row key={i} cells={cells} />
      ))}
    </span>
  );
}
function useColumns(container: RefObject<HTMLElement>) {
  const [columns, setColumns] = useState(3);
  useLayoutEffect(() => {
    const resize = () =>
      setColumns(
        Math.max(3, Math.floor((container.current?.clientWidth || 54) / 18))
      );
    resize();
    const observer = new ResizeObserver(resize);
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, [container]);
  return columns;
}
export function Frame({
  children,
  color = colors.silver,
  className = "",
  label,
  columns: preferredColumns,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
  label?: string;
  columns?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const columns = useColumns(container);
  const rows = pixelFrame(columns, 3, color);
  const image = (sprite: Sprite) =>
    `url("data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 16">${characterMarkup(
        sprite.layers
      )}</svg>`
    )}")`;
  return (
    <div
      className={`FrameScroll ${className}`}
      ref={container}
      aria-label={label}
      style={preferredColumns ? { maxWidth: preferredColumns * 18 } : undefined}
    >
      <div className="TextFrame" style={{ width: columns * 18 }}>
        <span className="FrameEdge" aria-hidden="true">
          <Pixels rows={[rows[0]]} />
        </span>
        <div
          className="FrameContent"
          style={{
            backgroundImage: `${image(rows[1][0])}, ${image(
              rows[1][columns - 1]
            )}`,
          }}
        >
          {children}
        </div>
        <span className="FrameEdge" aria-hidden="true">
          <Pixels rows={[rows[2]]} />
        </span>
      </div>
    </div>
  );
}
export const LinkStyleContext = createContext({
  linked: false,
  hovered: false,
  preserveColor: false,
});
export function Text({
  children,
  color = colors.silver,
  hovered = false,
  shade,
  link = true,
}: {
  children: string;
  color?: string;
  hovered?: boolean;
  shade?: "▄" | "░";
  link?: boolean;
}) {
  const linkStyle = useContext(LinkStyleContext);
  const linked = linkStyle.linked && link;
  if (linked && !linkStyle.preserveColor) color = colors.blue;
  const wordView = (word: string, key: number) => (
    <span className="Word" key={key}>
      <Row
        cells={
          linked && word.trim()
            ? underline(
                textSprites(word, color),
                linkStyle.preserveColor && color === colors.grey
                  ? colors.silver
                  : color
              )
            : shade
            ? shaded(
                textSprites(word.replace(/\s/g, " "), color),
                colors.green,
                shade
              )
            : hovered
            ? underline(textSprites(word.replace(/\s/g, " "), color))
            : textSprites(word.replace(/\s/g, " "), color)
        }
      />
    </span>
  );
  return (
    <span className={`Text${linked ? " LinkText" : ""}`}>
      {children
        .split(/(\s+)/)
        .filter(Boolean)
        .map((word, index) => {
          if (!shade && /^\s+$/.test(word)) {
            if (!linked) return word.replace(/\s/g, " ");
            const underlineColor =
              linkStyle.preserveColor && color === colors.grey
                ? colors.silver
                : color;
            const image = `url("data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 16">${characterMarkup(
                [{ char: "_", color: underlineColor }]
              )}</svg>`
            )}")`;
            return (
              <span
                key={index}
                className="LinkSpace"
                style={{
                  maskImage: image,
                  WebkitMaskImage: image,
                  backgroundColor: underlineColor,
                }}
              >
                {word.replace(/\s/g, " ")}
              </span>
            );
          }
          if (!shade && /^https?:\/\//.test(word))
            return (
              <span key={index}>
                {word
                  .match(/^https?:\/\/|[^/]+\/?/g)!
                  .map((part, partIndex) => (
                    <Fragment key={partIndex}>
                      {partIndex > 0 && <wbr />}
                      {wordView(part, partIndex)}
                    </Fragment>
                  ))}
              </span>
            );
          return wordView(word, index);
        })}
    </span>
  );
}

export function StatLabel({ stat }: { stat: keyof Stats }) {
  const sprite = getStatSprite(stat, "display");
  return (
    <span className="Item" style={{ gap: 0 }}>
      <Pixels rows={[[sprite]]} label={sprite.name} />
      <Text color={getStatColor(stat)}>
        {stat === "true" ? "True" : sprite.name}
      </Text>
    </span>
  );
}
const slotSprites: Record<Equipment, Sprite> = {
  weapon: weaponSlot,
  offhand: offhandSlot,
  spell: spellSlot,
  skill: skillSlot,
  tool: toolSlot,
  ring: ringSlot,
  amulet: amuletSlot,
  torch: torchSlot,
  compass: compassSlot,
  map: mapSlot,
  boots: bootsSlot,
};
export function SlotLabel({ slot }: { slot: Equipment }) {
  const sprite = slotSprites[slot];
  return (
    <span className="Item" style={{ gap: 0 }}>
      <Pixels rows={[[mergeSprites(emptySlot, sprite)]]} label={sprite.name} />
      <Text color={colors.grey}>{sprite.name}</Text>
    </span>
  );
}
export function ItemView({
  item,
  amount = false,
}: {
  item: Partial<Item>;
  amount?: boolean;
}) {
  const sprite = getItemSprite(
    {
      ...item,
      ...(item.spell && !item.element ? { element: "fire" as const } : {}),
      ...(item.consume === "potion" && !item.stat
        ? { stat: "hp" as const }
        : {}),
    },
    "display"
  );
  return (
    <ReferenceLink
      sprite
      name={
        item.weapon ||
        item.offhand ||
        item.spell ||
        item.skill ||
        item.tool ||
        item.accessory ||
        (item.stackable === "resource"
          ? item.element || item.material
          : item.stackable) ||
        item.consume ||
        item.stat ||
        ""
      }
    >
      <span className="Item" style={{ gap: 0 }}>
        {amount && (
          <Text color={colors.grey} link={false}>
            {String(item.amount ?? 1)}
          </Text>
        )}
        <Pixels rows={[[sprite]]} label={sprite.name} />
        <Text color={colors.grey}>{sprite.name}</Text>
      </span>
    </ReferenceLink>
  );
}
export function Key({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  const text = textSprites(label, colors.black).map((sprite) => ({
    ...sprite,
    layers: [{ char: "█", color: colors.white }, ...sprite.layers],
  }));
  return (
    <Pixels
      className="Key"
      label={label}
      rows={[
        [keyLeft, ...text, keyRight],
        ...(!compact
          ? [[keySocketLeft, ...text.map(() => keySocket), keySocketRight]]
          : []),
      ]}
    />
  );
}
export function Button({
  children,
  onClick,
  active = false,
  disabled = false,
  palette,
}: {
  children: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  palette?: Palette;
}) {
  const text = textSprites(children.toUpperCase(), colors.black);
  return (
    <button
      type="button"
      className="GameButton SpriteStates"
      aria-label={children}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {["Idle", "Hover", "Pressed"].slice(0, disabled ? 1 : 3).map((state) => (
        <span
          key={state}
          className={`SpriteState State${state}`}
          aria-hidden="true"
        >
          <Pixels
            rows={[
              createSpriteButton(
                text,
                text.length + 2,
                disabled,
                state === "Pressed",
                state !== "Idle",
                palette || (active ? "lime" : "white")
              ),
            ]}
          />
        </span>
      ))}
    </button>
  );
}
export function Selection({
  label,
  selected,
  onClick,
  cells,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  cells?: Sprite[];
}) {
  return (
    <button
      className="GameSelection SpriteStates"
      type="button"
      role="option"
      aria-label={label}
      aria-selected={selected}
      onClick={onClick}
    >
      {[false, true].map((hover) => {
        const line =
          cells ||
          textSprites(label, selected || hover ? colors.white : colors.silver);
        return (
          <span
            key={String(hover)}
            className={`SpriteState State${hover ? "Hover" : "Idle"}`}
            aria-hidden="true"
          >
            <Pixels
              rows={[
                [
                  selected ? popupSelection : none,
                  ...textSprites(" "),
                  ...(hover || selected
                    ? shaded(line, colors.green, selected ? "▄" : "░")
                    : line),
                ],
              ]}
            />
          </span>
        );
      })}
    </button>
  );
}
export function Choice({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <span className="Choice">
      <Text color={colors.white}>{label}</Text>
      <span className="Choices" role="listbox" aria-label={label}>
        {values.map((option) => (
          <Selection
            key={option}
            label={option}
            selected={option === value}
            onClick={() => onChange(option)}
          />
        ))}
      </span>
    </span>
  );
}

export function Input({
  label,
  labelContent,
  value,
  onChange,
  completion = "",
  type = "text",
  onKeyDown,
  compact = false,
}: {
  label: string;
  labelContent?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  completion?: string;
  type?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  compact?: boolean;
}) {
  const container = useRef<HTMLLabelElement>(null);
  const columns = useColumns(container);
  const [focus, setFocus] = useState(false);
  const line = [
    ...textSprites(value, compact ? colors.black : colors.white),
    ...textSprites(completion, colors.grey),
  ];
  const width = Math.min(
    columns,
    type === "number" ? 6 : Math.max(12, Math.min(44, line.length + 3))
  );
  if (focus)
    line.push(
      ...underline(textSprites(" "), compact ? colors.black : colors.lime)
    );
  return (
    <label className={`Input${compact ? " CompactInput" : ""}`} ref={container}>
      <span className="InputLabel">{labelContent || <Text>{label}</Text>}</span>
      <span className="InputTarget">
        <Pixels
          rows={
            compact
              ? [
                  createSpriteButton(
                    line.slice(-width + 2),
                    width,
                    false,
                    false,
                    focus,
                    focus ? "lime" : "white"
                  ),
                ]
              : pixelFrame(
                  width,
                  3,
                  focus ? colors.lime : colors.silver,
                  "solid",
                  [line.slice(-width + 2)]
                )
          }
        />
        <input
          type={type}
          min={type === "number" ? 0 : undefined}
          max={type === "number" ? 99 : undefined}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
      </span>
    </label>
  );
}
export function TabTitle({
  children,
  active,
}: {
  children: string;
  active: boolean;
}) {
  return (
    <Pixels
      rows={[createTab(children, Math.max(14, children.length + 2), active)]}
      label={children}
    />
  );
}

const letters: Record<string, string[]> = {
  A: ["▄▀█", "█▄█", "█ █"],
  B: ["█▀▄", "█▄█", "█▄▀"],
  C: ["▄▀▀", "█  ", "▀▄▄"],
  D: ["█▀▄", "█ █", "█▄▀"],
  E: ["█▀▀", "█▄▄", "█▄▄"],
  F: ["█▀▀", "█▄▄", "█  "],
  G: ["▄▀▀", "█ ▄", "▀▄█"],
  H: ["█ █", "█▄█", "█ █"],
  I: ["█", "█", "█"],
  J: ["  █", "  █", "▀▄█"],
  K: ["█ █", "█▄▀", "█ █"],
  L: ["█  ", "█  ", "▀▄▄"],
  M: ["█▄█", "█ █", "█ █"],
  N: ["█▀█", "█ █", "█ █"],
  O: ["▄▀█", "█ █", "█▄▀"],
  P: ["█▀▄", "█▄█", "█  "],
  Q: ["▄▀█", "█ █", "▀█▄"],
  R: ["█▀▄", "█▄▀", "█ █"],
  S: ["▄▀▀", "█▄▄", "▄▄▀"],
  T: ["▀█▀", " █ ", " █ "],
  U: ["█ █", "█ █", "█▄█"],
  V: ["█ █", "█ █", "▀▄▀"],
  W: ["█ █", "█ █", "█▀█"],
  X: ["█ █", "▄▀▄", "█ █"],
  Y: ["█ █", "▀▄▀", " █ "],
  Z: ["▀▀█", "▄▀ ", "█▄▄"],
  "0": ["▄▀█", "█ █", "█▄▀"],
  "1": ["▄█ ", " █ ", "▄█▄"],
  "2": ["▀▀▄", "▄▀ ", "█▄▄"],
  "3": ["▀▀▄", " ▀▄", "▄▄▀"],
  "4": ["█ █", "▀▀█", "  █"],
  "5": ["█▀▀", "▀▀▄", "▄▄▀"],
  "6": ["▄▀ ", "█▀▄", "▀▄▀"],
  "7": ["▀▀█", " ▄▀", " █ "],
  "8": ["▄▀▄", "▄▀▄", "▀▄▀"],
  "9": ["▄▀▄", "▀▀█", " ▄▀"],
  ".": [" ", " ", "▄"],
  ":": ["▄", " ", "▄"],
  _: ["   ", "   ", "▄▄▄"],
  "/": ["  █", " █ ", "█  "],
  "?": ["▀▀▄", " ▄▀", " ▄ "],
  "-": ["   ", "▀▀▀", "   "],
};
export function Heading({
  text,
  level = 1,
  id,
  color = colors.lime,
}: {
  text: string;
  level?: number;
  id?: string;
  color?: string;
}) {
  const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
  return (
    <Tag className="Heading" id={id} aria-label={text}>
      {level !== 1 ? (
        <Text color={colors.white}>{text}</Text>
      ) : (
        text
          .toUpperCase()
          .split(" ")
          .map((word, i) => (
            <Pixels
              key={i}
              className="HeadingWord"
              rows={[0, 1, 2].map((row) =>
                textSprites(
                  [...word]
                    .map((c) => (letters[c] || letters["?"])[row])
                    .join(" "),
                  color
                )
              )}
            />
          ))
      )}
    </Tag>
  );
}
export { GridTable as PlainTable } from "./GridTable";
