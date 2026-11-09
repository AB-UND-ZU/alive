import { previewItem, displayName, getEffectSprite } from "./catalog";
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
  createCountable,
  buttonPalettes,
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
import { getItemSprite, createUnitName } from "../game/assets/utils";
import { UnitKey, unitDefinitions } from "../game/balancing/units";
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
  interactBar,
  ninePlus,
} from "../game/assets/sprites";
import { pixelFrame, recolorLine } from "../game/assets/pixels";
import font from "../game/assets/font.json";
import glyphAliases from "./glyphAliases.json";
import "./visuals.css";
const glyphs = font.glyphs as Record<string, unknown>;
const aliases = glyphAliases as Record<string, string>;
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
    <span
      className={`Pixels ${rows.length === 1 ? "SingleRowPixels " : ""}${
        rows.some((row) => row.some((sprite) => sprite.name === "text_generic"))
          ? "SelectablePixels "
          : ""
      }${className}`}
      aria-label={label}
    >
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
  title,
  titleBackground,
  columns: preferredColumns,
  compact = false,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
  label?: string;
  title?: string;
  titleBackground?: string;
  columns?: number;
  compact?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const availableColumns = useColumns(container);
  const [contentColumns, setContentColumns] = useState(3);
  useLayoutEffect(() => {
    if (!compact || !content.current) return;
    const measure = () =>
      setContentColumns(
        Math.max(
          3,
          Math.ceil((content.current?.scrollWidth || 0) / 18) + 2,
          (title?.length || 0) + 4
        )
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content.current);
    return () => observer.disconnect();
  }, [compact, title]);
  const columns = Math.max(
    compact ? contentColumns : availableColumns,
    title ? title.length + 4 : 3
  );
  const tab = title ? createTab(title, title.length + 2, true) : undefined;
  const rows = pixelFrame(
    columns,
    3,
    color,
    "solid",
    undefined,
    tab && titleBackground
      ? recolorLine(tab, { [colors.white]: titleBackground })
      : tab
  ).map((row) =>
    row.map((sprite) => ({
      ...sprite,
      // The native crop adds transparent spaces over borders and titles.
      layers: sprite.layers.filter((layer) => layer.char !== " "),
    }))
  );
  return (
    <div
      className={`FrameScroll${compact ? " CompactFrame" : ""} ${className}`}
      ref={container}
      aria-label={label || title}
      style={
        compact
          ? { width: columns * 18, maxWidth: "100%" }
          : preferredColumns
          ? {
              maxWidth:
                Math.max(preferredColumns, title ? title.length + 4 : 3) * 18,
            }
          : undefined
      }
    >
      <div className="TextFrame" style={{ width: columns * 18 }}>
        <span className="FrameEdge" aria-hidden="true">
          <Pixels rows={[rows[0]]} />
        </span>
        <div className="FrameContent">
          <NativeRule sprite={rows[1][0]} />
          <NativeRule sprite={rows[1][columns - 1]} className="FrameRight" />
          {compact ? (
            <div className="FrameInner" ref={content}>
              {children}
            </div>
          ) : (
            children
          )}
        </div>
        <span className="FrameEdge" aria-hidden="true">
          <Pixels rows={[rows[2]]} />
        </span>
      </div>
    </div>
  );
}
export function NativeRule({
  sprite,
  lines,
  className = "",
}: {
  sprite: Sprite;
  lines?: number;
  className?: string;
}) {
  const element = useRef<HTMLSpanElement>(null);
  const [measuredLines, setMeasuredLines] = useState(1);
  useLayoutEffect(() => {
    if (lines !== undefined) return;
    const measure = () =>
      setMeasuredLines(
        Math.max(1, Math.ceil((element.current?.clientHeight || 32) / 32))
      );
    measure();
    const observer = new ResizeObserver(measure);
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, [lines]);
  return (
    <span
      className={`NativeRule ${className}`}
      ref={element}
      aria-hidden="true"
    >
      <Pixels
        rows={Array.from({ length: lines ?? measuredLines }, () => [sprite])}
      />
    </span>
  );
}
export const LinkStyleContext = createContext({
  linked: false,
  hovered: false,
  preserveColor: false,
});
export const TextColorContext = createContext<string | undefined>(undefined);
export const ProseContext = createContext(false);
export const TableContext = createContext(false);
export function Count({
  value,
  color = colors.white,
}: {
  value: number;
  color?: string;
}) {
  return Number.isFinite(value) ? (
    <Text color={color} link={false}>
      {String(value)}
    </Text>
  ) : (
    <Pixels rows={[[...textSprites("9", color), ninePlus]]} label="99+" />
  );
}
export function Text({
  children,
  color = colors.silver,
  hovered = false,
  shade,
  link = true,
  suffix,
  prefix,
  continuous = false,
  code = false,
}: {
  children: string;
  color?: string;
  hovered?: boolean;
  shade?: "▄" | "░";
  link?: boolean;
  suffix?: ReactNode;
  prefix?: ReactNode;
  continuous?: boolean;
  code?: boolean;
}) {
  const linkStyle = useContext(LinkStyleContext);
  const textColor = useContext(TextColorContext);
  const linked = linkStyle.linked && link;
  const actualColor =
    linked && !linkStyle.preserveColor ? colors.blue : textColor || color;
  const text = [...children]
    .map((char) =>
      char === "\n"
        ? char
        : aliases[char]
        ? [...aliases[char]].length === 1
          ? char
          : aliases[char]
        : glyphs[char]
        ? char
        : "?"
    )
    .join("");
  const parts = code ? [text] : text.split(/(\bInfinity\b|∞|99\+)/g);
  const codeWords = code
    ? (text.match(/[^./]+[./]?|[./]/g) || []).flatMap((part) =>
        part.split(/(?=[A-Z][a-z])/g)
      )
    : [];
  const content = (
    <span
      className={`Text NativeText CellGlyph${linked ? " LinkText" : ""}${
        linked && linkStyle.preserveColor ? " SpriteLinkText" : ""
      }${shade ? " ShadedText" : ""}${
        text.includes("\n") ? " MultilineText" : ""
      }${continuous || shade ? " PreText" : ""}${
        hovered ? " UnderlinedText" : ""
      }`}
      data-shade={shade?.repeat(text.length)}
      style={
        {
          color: actualColor,
          "--glyph-color": actualColor,
          "--underline-color":
            actualColor === colors.grey ? colors.silver : actualColor,
          "--text-shade": shade,
        } as React.CSSProperties
      }
    >
      {code
        ? codeWords.map((part, index) => (
            <Fragment key={index}>
              {part}
              {index < codeWords.length - 1 && <wbr />}
            </Fragment>
          ))
        : parts.length === 1
        ? text
        : parts.map((part, index) =>
            /^(Infinity|∞|99\+)$/.test(part) ? (
              <Count key={index} value={Infinity} color={actualColor} />
            ) : (
              part
            )
          )}
    </span>
  );
  return prefix || suffix ? (
    <span className="RichText">
      {prefix && <span className="TextPrefix">{prefix}</span>}
      {content}
      {suffix && <span className="TextSuffix">{suffix}</span>}
    </span>
  ) : (
    content
  );
}

export function Literal({ children }: { children: string }) {
  const prose = useContext(ProseContext);
  const table = useContext(TableContext);
  return (
    <Text color={colors.white} link={false}>
      {prose && !table ? `[${children}]` : children}
    </Text>
  );
}

export function StatLabel({
  stat,
  value,
  showName = true,
  percentage = false,
}: {
  stat: keyof Stats;
  value?: number;
  showName?: boolean;
  percentage?: boolean;
}) {
  const inTable = useContext(TableContext);
  const sprite = getStatSprite(stat, "display");
  const name =
    stat === "true"
      ? "True"
      : sprite.name || (stat === "reproc" ? "Proc Delay" : displayName(stat));
  const hasSprite = sprite.layers.length > 0;
  const color = hasSprite ? getStatColor(stat) : colors.grey;
  const prefix =
    value !== undefined && !Number.isFinite(value) ? (
      <>
        <Count value={value} color={color} />
        {hasSprite && <Pixels rows={[[sprite]]} label={name} />}
      </>
    ) : value !== undefined && stat === "level" && !showName ? (
      <Pixels
        rows={[[sprite, ...textSprites(String(Math.ceil(value)), color)]]}
      />
    ) : value !== undefined && !hasSprite ? (
      <Text color={color} link={false}>
        {`${Math.ceil(value)}${percentage ? "%" : ""}`}
      </Text>
    ) : value !== undefined && stat !== "level" ? (
      <Pixels
        rows={[createCountable({ [stat]: value }, stat, "text", percentage)]}
      />
    ) : hasSprite ? (
      <Pixels rows={[[sprite]]} label={sprite.name} />
    ) : undefined;
  if (inTable && value === 0) return null;
  return (
    <ReferenceLink name={`stat:${stat}`} sprite>
      <span className="Item" style={{ gap: 0 }}>
        {showName ? (
          <Text
            color={color}
            prefix={prefix}
            suffix={
              value !== undefined && stat === "level" ? (
                <Text color={color} link={false}>
                  {` ${Math.ceil(value)}`}
                </Text>
              ) : undefined
            }
          >
            {name}
          </Text>
        ) : (
          prefix
        )}
      </span>
    </ReferenceLink>
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
      <Text
        color={colors.grey}
        prefix={
          <Pixels
            rows={[[mergeSprites(emptySlot, sprite)]]}
            label={sprite.name}
          />
        }
      >
        {sprite.name}
      </Text>
    </span>
  );
}
export function UnitView({ unit }: { unit: UnitKey }) {
  const [sprite, ...nameSprites] = createUnitName(unit);
  const nativeName = nameSprites
    .map((part) => part.layers[part.layers.length - 1]?.char || "")
    .join("");
  const name = nativeName
    ? displayName(nativeName.replace(/_/g, " "))
    : unitDefinitions[unit].sprite.layers.length
    ? displayName(unit)
    : "";
  if (!name && !sprite.layers.length) return null;
  return (
    <ReferenceLink name={"unit:" + unit} sprite>
      <span className="Item" style={{ gap: 0 }}>
        <Text
          color={nameSprites[0]?.layers[0]?.color || colors.grey}
          prefix={<Pixels rows={[[sprite]]} label={name} />}
        >
          {name}
        </Text>
      </span>
    </ReferenceLink>
  );
}
export function ItemView({
  item,
  amount = false,
}: {
  item: Partial<Item>;
  amount?: boolean;
}) {
  const resolved = previewItem(item);
  const sprite =
    getEffectSprite(resolved) || getItemSprite(resolved, "display");
  return (
    <ReferenceLink
      sprite
      name={
        "item:" +
        (item.weapon ||
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
          "")
      }
    >
      <span className="Item" style={{ gap: 0 }}>
        <Text
          color={colors.grey}
          prefix={
            <>
              {amount && (
                <Text color={colors.grey} link={false}>
                  {String(item.amount ?? 1)}
                </Text>
              )}
              <Pixels rows={[[sprite]]} label={sprite.name} />
            </>
          }
        >
          {sprite.name}
        </Text>
      </span>
    </ReferenceLink>
  );
}
export function Key({ label }: { label: string; compact?: boolean }) {
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
        [keySocketLeft, ...text.map(() => keySocket), keySocketRight],
      ]}
    />
  );
}
const nativeButtonColors: Partial<Record<string, Palette>> = {
  RESUME: "lime",
  MENU: "red",
  SAVE: "white",
  LOAD: "lime",
  ERASE: "red",
  YES: "lime",
  BACK: "red",
  CANCEL: "red",
  CLOSE: "red",
  RESET: "red",
  ABORT: "red",
  CLEAR: "red",
  OPEN: "lime",
  READ: "lime",
  SPELL: "silver",
  SKILL: "silver",
  QUEST: "lime",
  SHOP: "lime",
  CRAFT: "lime",
  BREW: "lime",
  FORGE: "lime",
  MAKE: "lime",
  COOK: "lime",
  BUY: "lime",
  SELL: "lime",
  START: "lime",
  NEXT: "lime",
  "GO!": "lime",
  RUN: "lime",
  COPY: "lime",
  USE: "yellow",
  WAVE: "silver",
  SLASH: "silver",
};
export function Button({
  children,
  onClick,
  active = false,
  disabled = false,
  palette,
  interaction,
  ariaLabel,
}: {
  children: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  palette?: Palette;
  interaction?: boolean;
  ariaLabel?: string;
}) {
  const label = children
    .toUpperCase()
    .replace(/^[<←\u011a]\s*|\s*[>→\u0119]$/g, "")
    .trim();
  const showStem =
    interaction ??
    [
      "OPEN",
      "READ",
      "QUEST",
      "SHOP",
      "CRAFT",
      "BREW",
      "FORGE",
      "BUILD",
      "PLANT",
    ].includes(label);
  const chosenPalette =
    palette || (active ? "lime" : nativeButtonColors[label] || "white");
  const text = textSprites(
    children.toUpperCase(),
    buttonPalettes[chosenPalette].text
  );
  return (
    <button
      type="button"
      className="GameButton SpriteStates"
      aria-label={ariaLabel || children}
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
                chosenPalette
              ),
              ...(showStem
                ? [
                    Array.from({ length: text.length + 2 }, (_, column) =>
                      column === Math.floor((text.length + 2) / 2)
                        ? { ...interactBar, layers: interactBar.facing!.down! }
                        : none
                    ),
                  ]
                : []),
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
      <span className="Choices" role="tablist" aria-label={label}>
        {values.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={option === value}
            aria-label={option}
            className="GameTab SpriteStates"
            onClick={() => onChange(option)}
          >
            {[false, true].map((hover) => (
              <span
                key={String(hover)}
                className={`SpriteState State${hover ? "Hover" : "Idle"}`}
                aria-hidden="true"
              >
                <Pixels
                  rows={[
                    createTab(
                      option,
                      option.length + 1,
                      option === value || hover
                    ),
                  ]}
                />
              </span>
            ))}
          </button>
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
  const width =
    type === "number"
      ? 10
      : Math.min(columns, Math.max(12, Math.min(44, line.length + 3)));
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
          step={type === "number" ? "any" : undefined}
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
export function Stepper({
  label,
  labelContent,
  value,
  onChange,
}: {
  label: string;
  labelContent?: ReactNode;
  value: number;
  onChange: (value: number) => void;
}) {
  const update = (next: number) => onChange(Math.max(0, Math.min(99, next)));
  return (
    <div className="Stepper" role="group" aria-label={label}>
      <div>{labelContent || <Text>{label}</Text>}</div>
      <div className="StepperControls">
        <Button
          ariaLabel={`Decrease ${label}`}
          palette="red"
          onClick={() => update(value - 1)}
        >
          -
        </Button>
        <Input
          label={label}
          type="number"
          value={String(value)}
          onChange={(next) => update(Number(next))}
        />
        <Button
          ariaLabel={`Increase ${label}`}
          palette="lime"
          onClick={() => update(value + 1)}
        >
          +
        </Button>
      </div>
    </div>
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
    <Tag key={text} className="Heading" id={id} aria-label={text}>
      {level !== 1 ? (
        <Text color={colors.white} code>
          {text}
        </Text>
      ) : (
        text
          .replace(/^Keyboard\/Mouse$/i, "Keyboard/ Mouse")
          .toUpperCase()
          .split(" ")
          .map((word, i) => (
            <span
              key={i}
              className={`HeadingWord${
                /^Keyboard\/Mouse$/i.test(text) && i === 1
                  ? " HeadingNewLine"
                  : ""
              }`}
            >
              {[...word].map((letter, letterIndex) => (
                <Fragment key={letterIndex}>
                  {letterIndex > 0 && " "}
                  <Pixels
                    className="HeadingLetter"
                    rows={(letters[letter] || letters["?"]).map((row) =>
                      textSprites(row, color).map((sprite) => ({
                        ...sprite,
                        name: "heading",
                      }))
                    )}
                  />
                </Fragment>
              ))}
            </span>
          ))
      )}
    </Tag>
  );
}
export { GridTable as PlainTable } from "./GridTable";
