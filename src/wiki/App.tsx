import { PresetName } from "./presets";
import { muteAudio, setAudioActive } from "../game/sound/resumable";
import { underlineImage } from "./underline";
import { JoystickReference } from "./TouchControls";
import { DialogSnapshot } from "./DialogSnapshot";
import { CommandReference } from "./CommandReference";
import { Literal } from "./visuals";
import {
  itemPage,
  unitPage,
  getEffectSprite,
  previewItem,
  catalogItems,
  isWikiUnit,
} from "./catalog";
import { CodeBlock } from "./CodeBlock";
import { Callout } from "./Callout";
import {
  ReferenceContext,
  ReferenceText,
  referenceId,
  Reference,
  featureSprites,
} from "./references";
import { getItemSprite, getUnitSprite } from "../game/assets/utils";
import { UnitKey } from "../game/balancing/units";
import { generateUnitData } from "../game/balancing/units";
import { DungeonMap } from "./DungeonMap";
import { WorldMap } from "./WorldMap";
import { WarpMap } from "./WarpMap";
import { unitDefinitions } from "../game/balancing/units";
import { classDefinitions } from "../game/balancing/classes";
import { displayedClasses } from "../game/assets/pixels";
import {
  ReactNode,
  createContext,
  useContext,
  useId,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { WikiManifest, WikiToken, WikiPage } from "./types";
import {
  Heading,
  LinkStyleContext,
  Text,
  Pixels,
  Key,
  ItemView,
  UnitView,
  StatLabel,
  ProseContext,
  Button,
  PlainTable,
  TabTitle,
  textSprites,
} from "./visuals";
import { TextGallery } from "./TextGallery";
import { InterfaceDiagram } from "./InterfaceDiagram";
import { Play } from "./Play";
import { Widget } from "./Widgets";
import { GamePreview } from "./GamePreview";
import { SceneName } from "./scenes";
import { commandItems } from "../game/assets/commands";
import {
  statConfig,
  getStatSprite,
  getStatColor,
  mergeSprites,
  Stats as DisplayStats,
} from "../game/assets/ui";
import { Item } from "../engine/components/item";
import { unitStats } from "../engine/components/stats";
import { colors } from "../game/assets/colors";
import {
  scrollBarTop,
  scrollBar,
  scrollBarBottom,
  scrollHandle,
  popupSelection,
  popupActive,
  none,
  mapHouse,
  mapFortress,
  missing,
} from "../game/assets/sprites";

import "../components/App/index.css";

import "./style.css";
import { parseMarkdown } from "./markdown";

const registry = require("./pages.json") as Omit<
  WikiPage,
  "tokens" | "references"
>[];
const sourceIndex = require("./sourceReferences.json") as {
  references: WikiManifest["references"];
  pages: Record<string, WikiManifest["references"]>;
};
const [major, minor, patch] = (
  require("../../package.json").version as string
).split(".");
const manifest: WikiManifest = {
  version: `V${major}x${minor.padStart(2, "0")}${
    Number(patch) ? "." + patch : ""
  }`,
  title: [],
  references: sourceIndex.references,
  pages: registry.map((page) => ({
    ...page,
    tokens: [],
    references: sourceIndex.pages[page.source],
  })),
};
const sourceFiles = require.context("..", true, /\.md$/);
const rootUrl = new URL(
  `${process.env.PUBLIC_URL || ""}/`,
  window.location.origin
);
const base = rootUrl.href;
const canonicalRoute = (route: string) =>
  manifest.pages.find(
    (page) => page.route === route || page.aliases?.includes(route)
  )?.route || route;
const currentRoute = () => {
  const route = canonicalRoute(
    decodeURI(window.location.pathname.slice(rootUrl.pathname.length)) ||
      "index.html"
  );
  const section = window.location.hash.slice(1);
  return route === canonicalRoute("portals.html") &&
    ["menu", "dungeon", "island"].includes(section)
    ? canonicalRoute(section + ".html")
    : route;
};
const featureRoute = (name: string) =>
  manifest.pages.find((page) => page.source === `wiki/${name}.md`)?.route ||
  `${name}.html`;
const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const references: Record<string, Reference> = { ...manifest.references };
const sourcePaths = Object.fromEntries(
  Object.entries(manifest.references).filter(([name]) =>
    name.startsWith("src/")
  )
);
for (const [name, item] of Object.entries(catalogItems)) {
  references[name] = references["item:" + name] = {
    href: `${featureRoute(itemPage(item))}#${referenceId(name)}`,
    kind: "item",
  };
}
for (const [name, unit] of Object.entries(unitDefinitions).filter(([key]) =>
  isWikiUnit(key)
)) {
  references[name] = references["unit:" + name] = {
    href: `${featureRoute(unitPage(name, unit))}#${referenceId(name)}`,
    kind: "unit",
  };
}
for (const [name, reference] of Object.entries(references))
  if (
    reference.kind !== "code" &&
    reference.kind !== "type" &&
    !references[name.toLowerCase()]
  )
    references[name.toLowerCase()] = reference;
for (const name of displayedClasses)
  references[name] = {
    href: `${featureRoute("classes")}#${referenceId(name) || "unknown-class"}`,
    kind: "unit",
  };
for (const [name, reference] of Object.entries(references)) {
  if (
    reference.kind === "type" ||
    reference.kind === "code" ||
    name.includes(":")
  )
    continue;
  const display = name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  references[display] = reference;
  references[
    display.endsWith("y") ? display.slice(0, -1) + "ies" : display + "s"
  ] = reference;
}
const features: Record<string, Reference> = {};
for (const page of manifest.pages.filter(
  (page) => page.chapter === "Gameplay"
)) {
  const name = page.title.toLowerCase();
  features[name] = { href: page.route, kind: "feature" };
  if (name.endsWith("s")) features[name.slice(0, -1)] = features[name];
}
const featureAliases: Record<string, string> = {
  trading: "shops",
  tips: "dialogs",
  world: "island",
  aura: "stats#aura",
  "world map": "island",
  terrain: "terrain",
  grounds: "terrain",
  portal: "portals",
  portals: "portals",
  "wood house": "structures#wood-house",
  "desert fort": "structures#desert-fort",
  lever: "structures#lever",
  map: "map",
  maps: "map",
  minimap: "map",
  element: "elements",
  elements: "elements",
  fire: "elements#fire",
  water: "elements#water",
  earth: "elements#earth",
  air: "elements#air",
  level: "portals",
  levels: "portals",
  saving: "savegames",
  "saved games": "savegames",
  presets: "play",
  "test mode": "play",
  "arrow keys": "keyboard-mouse",
  "earth town": "quests#earth-town",
  "fire town": "quests#fire-haven",
  "fire haven": "quests#fire-haven",
  save: "savegames",
  slot: "slots",
  slots: "slots",
  container: "containers",
  containers: "containers",
  crate: "containers",
  crates: "containers",
  inventory: "gear",
  equipment: "gear",
  equipped: "gear",
  player: "classes",
  hero: "classes",
  hp: "stats",
  mp: "stats",
  xp: "stats",
  health: "stats",
  melee: "damage",
  magic: "damage",
  mana: "stats",
  experience: "stats",
  power: "stats",
  wisdom: "stats",
  armor: "stats",
  resist: "stats",
  tick: "timers",
  timer: "timers",
  command: "chat",
  commands: "chat",
  keyboard: "keyboard-mouse",
  keys: "keyboard-mouse",
  workbench: "crafting",
  kettle: "brewing",
  anvil: "forging",
  mine: "harvesting",
  mines: "harvesting",
  mining: "harvesting",
  logging: "harvesting",
  death: "respawn",
  fog: "light",
  shadow: "light",
  font: "index#font-characters",
  "dos font": "index#font-characters",
  colors: "index#palette",
};
for (const [name, target] of Object.entries(featureAliases)) {
  const [file, anchor] = target.split("#");
  const page = manifest.pages.find((page) => page.source === `wiki/${file}.md`);
  if (page)
    features[name] = {
      href: page.route + (anchor ? `#${anchor}` : ""),
      kind: "feature",
    };
}
delete features.characters;
delete features.character;
for (const name of displayedClasses) features[name] = references[name];
for (const stat of Object.keys(statConfig)) {
  const unitStat = (unitStats as readonly string[]).includes(stat);
  const reference: Reference = {
    href: featureRoute("stats") + "#stat-" + referenceId(stat),
    kind: "feature",
  };
  references["stat:" + stat] = reference;
  if (unitStat) features[stat.toLowerCase()] = reference;
}
const decorations: Record<
  string,
  {
    sprite?: import("../engine/components/sprite").Sprite;
    color?: string;
    name?: string;
  }
> = {};
for (const [name, item] of Object.entries(commandItems)) {
  const sprite =
    getEffectSprite(previewItem(item)) ||
    getItemSprite(previewItem(item), "display");
  if (sprite !== missing && !/[?]{2,}/.test(sprite.name))
    decorations[name.toLowerCase()] = { sprite };
}
for (const stat of Object.keys(statConfig) as (keyof DisplayStats)[]) {
  decorations[stat.toLowerCase()] = {
    sprite: getStatSprite(stat, "display"),
    color: getStatColor(stat),
    name: stat === "true" ? "True" : getStatSprite(stat, "display").name,
  };
}
references.bolt = {
  href: featureRoute("spells") + "#direct-casts",
  kind: "item",
};
references.blast = {
  href: featureRoute("spells") + "#direct-casts",
  kind: "item",
};
references.resource = { href: featureRoute("resources"), kind: "item" };
if (decorations.bolt) decorations.bolt.name = "Bolt";
if (decorations.blast) decorations.blast.name = "Blast";
for (const name of Object.keys(unitDefinitions).filter(isWikiUnit)) {
  const data = generateUnitData(name as UnitKey);
  const decoration = {
    sprite: { ...getUnitSprite(name as UnitKey), name: data.sprite.name },
    color:
      data.faction === "wild"
        ? colors.maroon
        : data.faction === "unit" || data.faction === "animal"
        ? colors.grey
        : colors.green,
  };
  decorations[name.toLowerCase()] = decoration;
  const display = name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  decorations[display] = decoration;
  decorations[display + "s"] = decoration;
}
for (const name of displayedClasses)
  decorations[name] = {
    sprite: mergeSprites(
      classDefinitions[name].backdrop || none,
      classDefinitions[name].sprite
    ),
    name: classDefinitions[name].sprite.name,
  };
delete decorations.level;
for (const [element, color] of Object.entries({
  earth: colors.green,
  fire: colors.red,
  water: colors.blue,
  air: colors.silver,
}))
  decorations[element] = { color };
decorations["earth town"] = {
  sprite: mapHouse,
  name: "Earth Town",
  color: colors.green,
};
decorations["fire town"] = {
  sprite: mapFortress,
  name: "Fire Town",
  color: colors.green,
};
decorations["fire haven"] = {
  sprite: mapFortress,
  name: "Fire Haven",
  color: colors.green,
};
for (const [name, color] of Object.entries(colors))
  decorations[name] = { color: color === colors.black ? colors.silver : color };
const automaticFeatures = Object.fromEntries(
  Object.entries(features).filter(
    ([name]) =>
      ![
        "world",
        "player",
        "hero",
        "level",
        "earth",
        "fire",
        "water",
        "air",
      ].includes(name)
  )
);
const patternFor = (entries: Record<string, unknown>) =>
  new RegExp(
    "\\b(" +
      Object.keys(entries)
        .filter((key) => /\w/.test(key) && !key.includes(":"))
        .sort((a, b) => b.length - a.length)
        .map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|") +
      ")\\b",
    "gi"
  );
const explicitReferences = Object.fromEntries(
  Object.entries(references).filter(([name]) => name.includes(":"))
);
type Navigate = (route: string) => void;
const LinkPolicyContext = createContext<{
  route: string;
  anchor?: string;
  targets: Map<string, string>;
} | null>(null);
function Link({
  href,
  children,
  navigate,
  label,
  styled = true,
  automatic = false,
  navigation = false,
}: {
  href: string;
  children: ReactNode;
  navigate: Navigate;
  label?: string;
  styled?: boolean;
  automatic?: boolean;
  navigation?: boolean;
}) {
  const policy = useContext(LinkPolicyContext);
  const id = useId();
  const destination = manifest.pages.find(
    (page) => page.route === canonicalRoute(href.split("#")[0])
  );
  const feature =
    !automatic && destination?.source.startsWith("wiki/")
      ? featureSprites[destination.source.slice(5, -3)]
      : undefined;
  if (policy && !/^(https?:|mailto:)/.test(href)) {
    const [route, anchor] = href.split("#");
    const target = canonicalRoute(route || policy.route);
    if (
      target === policy.route &&
      ((automatic && !navigation && Boolean(route)) ||
        !anchor ||
        anchor === policy.anchor)
    )
      return <>{children}</>;
    const key = target === policy.route ? target + "#" + anchor : target;
    if (automatic && !navigation) {
      const owner = policy.targets.get(key);
      if (owner && owner !== id) return <>{children}</>;
      policy.targets.set(key, id);
    }
  }
  return (
    <a
      href={
        href.startsWith("http") || href.startsWith("#") ? href : base + href
      }
      aria-label={label}
      className="WikiLink"
      onClick={(event) => {
        if (
          !/^(https?:|mailto:|#)/.test(href) &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          event.button === 0
        ) {
          event.preventDefault();
          navigate(href);
        }
      }}
    >
      <LinkStyleContext.Provider
        value={{ linked: styled, hovered: false, preserveColor: false }}
      >
        {feature ? (
          <span className="RichMention">
            <Pixels rows={[[feature]]} label={feature.name} />
            {children}
          </span>
        ) : (
          children
        )}
      </LinkStyleContext.Provider>
    </a>
  );
}
function Inline({
  tokens,
  navigate,
  color = colors.silver,
  literal = false,
  suffix,
}: {
  tokens: WikiToken[];
  navigate: Navigate;
  color?: string;
  literal?: boolean;
  suffix?: ReactNode;
}) {
  const parts = tokens.map((token) => ({ ...token }));
  const endings = new Map<number, string>();
  for (let i = 0; i < parts.length - 1; i++) {
    if (!["link", "strong", "em", "codespan", "game"].includes(parts[i].type))
      continue;
    const next = parts[i + 1];
    if (next.type !== "text") continue;
    const text = next.text || next.raw || "";
    const punctuation = text.match(/^[.,!?;:)\]}]+/)?.[0];
    if (!punctuation) continue;
    endings.set(i, punctuation);
    next.text = text.slice(punctuation.length);
    next.raw = next.text;
  }
  const lastPart =
    parts.length -
    1 -
    [...parts]
      .reverse()
      .findIndex((part) =>
        Boolean(part.text || part.raw || part.value || part.tokens?.length)
      );
  return (
    <>
      {parts.map((token, i) => {
        const ending =
          endings.has(i) || (i === lastPart && suffix) ? (
            <>
              {endings.has(i) && (
                <Text color={color} link={false}>
                  {endings.get(i)!}
                </Text>
              )}
              {i === lastPart && suffix}
            </>
          ) : undefined;
        if (token.type === "game" && ending)
          return (
            <span className="Word" key={i}>
              <Inline
                tokens={[token]}
                navigate={navigate}
                color={color}
                literal={literal}
              />
              {ending}
            </span>
          );
        if (token.type === "game") {
          if (token.kind === "data")
            return <Literal key={i}>{token.value!}</Literal>;
          if (token.kind === "stat")
            return (
              <StatLabel key={i} stat={token.value! as keyof DisplayStats} />
            );
          if (token.kind === "unit")
            return <UnitView key={i} unit={token.value! as UnitKey} />;
          if (token.kind === "key")
            return <Key key={i} label={token.value!} compact />;
          if (token.kind === "button")
            return <Button key={i}>{token.value!}</Button>;
          const parts = token.value!.split(" ");
          const counted = /^\d+$/.test(parts[0]);
          const amount = counted ? Number(parts.shift()) : undefined;
          const [name, material, effect] = parts;
          const item = commandItems[name];
          return (
            <ItemView
              key={i}
              amount={counted}
              item={previewItem({
                ...item,
                ...(amount !== undefined ? { amount } : {}),
                ...(material ? { material: material as Item["material"] } : {}),
                ...(effect
                  ? item.consume === "potion"
                    ? { stat: effect as Item["stat"] }
                    : { element: effect as Item["element"] }
                  : {}),
              })}
            />
          );
        }
        if (token.type === "link")
          return (
            <Link key={i} href={token.href!} navigate={navigate}>
              <Inline
                tokens={token.tokens || []}
                navigate={navigate}
                color={colors.silver}
                literal
                suffix={ending}
              />
            </Link>
          );
        if (token.type === "strong" || token.type === "em")
          return (
            <Inline
              key={i}
              tokens={token.tokens || []}
              navigate={navigate}
              color={colors.white}
              literal={literal}
              suffix={ending}
            />
          );
        if (token.type === "codespan")
          return (
            <code key={i} className="InlineCode">
              {literal ? (
                <Text color={color} suffix={ending} code>
                  {decode(token.text || "")}
                </Text>
              ) : (
                <ReferenceText
                  text={decode(token.text || "")}
                  implementation
                  suffix={ending}
                />
              )}
            </code>
          );
        if (
          token.type === "br" ||
          (token.type === "html" && /^<br\s*\/?>$/i.test(token.raw || ""))
        )
          return <br key={i} />;
        return literal ? (
          <Text key={i} color={color} suffix={ending}>
            {decode(token.text || token.raw || "")}
          </Text>
        ) : (
          <ReferenceText
            key={i}
            color={color}
            suffix={ending}
            text={decode(token.text || token.raw || "")}
          />
        );
      })}
    </>
  );
}
function Markdown({
  tokens,
  navigate,
  source,
}: {
  tokens: WikiToken[];
  navigate: Navigate;
  source: string;
}) {
  const parentPolicy = useContext(LinkPolicyContext);
  const pageRoute = manifest.pages.find(
    (page) => page.source === source
  )!.route;
  const policies = useMemo(() => {
    let current = parentPolicy || {
      route: pageRoute,
      targets: new Map<string, string>(),
    };
    return tokens.map((token) => {
      if (token.type === "heading")
        current = {
          route: pageRoute,
          anchor: token.anchor || slug(token.text!),
          targets: new Map<string, string>(),
        };
      return current;
    });
  }, [tokens, pageRoute, parentPolicy]);
  const content = tokens.map((token, index) => {
    if (
      source === "wiki/play.md" &&
      token.type === "heading" &&
      token.depth === 1
    )
      return null;
    if (token.type === "heading")
      return (
        <Heading
          key={index}
          text={decode(token.text!)}
          level={token.depth}
          id={token.anchor || slug(token.text!)}
          color={
            source === "wiki/index.md" && token.depth === 1
              ? colors.maroon
              : undefined
          }
        />
      );
    if (token.type === "paragraph")
      return (
        <p
          key={index}
          className={
            token.tokens?.some(
              (part) => part.type === "game" && part.kind === "key"
            )
              ? "ControlParagraph"
              : undefined
          }
        >
          <ProseContext.Provider value>
            <Inline tokens={token.tokens || []} navigate={navigate} />
          </ProseContext.Provider>
        </p>
      );
    if (token.type === "code") {
      if (token.lang === "scene")
        return (
          <GamePreview
            key={index}
            name={token.text!.trim().split("/")[0] as SceneName}
            preset={token.text!.trim().split("/")[1] as PresetName | undefined}
            testMode={token.text!.trim().split("/")[0] !== "game"}
            base={base}
          />
        );
      if (
        token.lang === "widget" &&
        ["text-callout", "palette", "font-characters"].includes(
          token.text!.trim()
        )
      )
        return <TextGallery key={index} name={token.text!.trim()} />;
      if (token.lang === "widget" && token.text!.trim() === "touch-joystick")
        return <JoystickReference key={index} />;
      if (token.lang === "widget" && token.text!.trim().startsWith("popup "))
        return (
          <DialogSnapshot key={index} screens={token.text!.trim().slice(6)} />
        );
      if (token.lang === "widget" && token.text!.trim() === "command-reference")
        return <CommandReference key={index} />;
      if (token.lang === "widget" && token.text!.trim() === "warp-map")
        return <WarpMap key={index} />;
      if (token.lang === "widget" && token.text!.trim() === "dungeon-map")
        return <DungeonMap key={index} />;
      if (token.lang === "widget" && token.text!.trim() === "world-map")
        return <WorldMap key={index} />;
      if (token.lang === "widget" && token.text!.trim() === "play")
        return <Play key={index} base={base} />;
      if (token.lang === "widget" && token.text!.trim() === "interface")
        return <InterfaceDiagram key={index} base={base} />;
      if (token.lang === "widget")
        return <Widget key={index} name={token.text!.trim()} />;
      return (
        <CodeBlock
          key={index}
          text={token.text!}
          language={token.lang}
          source={source}
          syntax={token.syntax}
        />
      );
    }
    if (token.type === "table")
      return (
        <PlainTable
          key={index}
          headers={(token.header || []).map((cell) =>
            cell.tokens.map((t) => t.text || t.raw || "").join("")
          )}
          rows={(token.rows || []).map((row) =>
            row.map((cell) => {
              if (
                cell.tokens.length === 1 &&
                cell.tokens[0].type === "text" &&
                /^(?:0|None)$/.test(cell.tokens[0].text?.trim() || "")
              )
                return null;
              const list =
                cell.tokens.length > 1 &&
                cell.tokens.every((part, index) =>
                  index % 2 === 0
                    ? part.type === "codespan"
                    : part.type === "text" && /^\s*,\s*$/.test(part.text || "")
                );
              return (
                <Inline
                  tokens={
                    list
                      ? cell.tokens.map((part) =>
                          part.type === "text" ? { type: "br" } : part
                        )
                      : cell.tokens
                  }
                  navigate={navigate}
                />
              );
            })
          )}
        />
      );
    if (token.type === "list") {
      const Tag = token.ordered ? "ol" : "ul";
      return (
        <Tag key={index}>
          {token.items?.map((item, i) => (
            <li key={i}>
              <Text color={colors.lime}>
                {token.ordered ? `${i + 1}. ` : "> "}
              </Text>
              <Markdown
                tokens={item.tokens}
                navigate={navigate}
                source={source}
              />
            </li>
          ))}
        </Tag>
      );
    }
    if (token.type === "blockquote")
      return (
        <Callout key={index}>
          <Markdown
            tokens={token.tokens || []}
            navigate={navigate}
            source={source}
          />
        </Callout>
      );
    if (token.type === "text")
      return (
        <p key={index}>
          <Inline tokens={token.tokens || [token]} navigate={navigate} />
        </p>
      );
    return null;
  });
  return (
    <>
      {content.map((element, index) => (
        <LinkPolicyContext.Provider key={index} value={policies[index]}>
          {element}
        </LinkPolicyContext.Provider>
      ))}
    </>
  );
}
function Navigation({
  page,
  navigate,
}: {
  page: WikiPage;
  navigate: Navigate;
}) {
  const current = useRef<HTMLAnchorElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ rows: 0, index: 0, percent: 0 });
  const measureScroll = () => {
    const view = viewport.current;
    if (!view) return;
    const distance = view.scrollHeight - view.clientHeight;
    const rows =
      distance > 1 ? Math.max(0, Math.floor(view.clientHeight / 32) - 2) : 0;
    const fraction = distance > 0 ? view.scrollTop / distance : 0;
    setScroll({
      rows,
      index: Math.round(fraction * (rows - 1)),
      percent: Math.round(fraction * 100),
    });
  };
  useEffect(() => {
    const observer = new ResizeObserver(measureScroll);
    if (viewport.current) {
      observer.observe(viewport.current);
      observer.observe(viewport.current.firstElementChild!);
    }
    measureScroll();
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const selected = current.current,
      nav = viewport.current;
    if (!selected || !nav) return;
    const bounds = selected.getBoundingClientRect(),
      viewBounds = nav.getBoundingClientRect();
    if (bounds.top < viewBounds.top || bounds.bottom > viewBounds.bottom)
      nav.scrollTop += bounds.top - viewBounds.top;
  }, [page.route]);
  const node = (entry: WikiPage) => {
    const selected = entry.route === page.route;
    const title =
      entry.source === "wiki/index.md"
        ? "Welcome"
        : entry.title
            .replace("Calculator", "Calc")
            .replace("Interface Diagram", "Interface");
    return (
      <a
        key={entry.route}
        className="NavSelection"
        ref={selected ? current : undefined}
        href={base + entry.route}
        aria-label={title}
        aria-current={selected ? "page" : undefined}
        onClick={(event) => {
          if (!event.metaKey && !event.ctrlKey && event.button === 0) {
            event.preventDefault();
            navigate(entry.route);
          }
        }}
      >
        <span className="NavPointer">
          <Pixels
            className={selected ? "NavCurrentPointer" : "NavHoverPointer"}
            rows={[[selected ? popupActive : popupSelection]]}
          />
        </span>
        <span className="NavText">
          <span className="NavNormalLabel">
            <Text
              color={selected ? colors.white : colors.silver}
              shade={selected ? "▄" : undefined}
            >
              {title.padEnd(16)}
            </Text>
          </span>
          {!selected && (
            <span className="NavHoveredLabel">
              <Text color={colors.white} shade="░">
                {title.padEnd(16)}
              </Text>
            </span>
          )}
        </span>
      </a>
    );
  };
  return (
    <nav aria-label="Chapters">
      <div
        className="NavViewport"
        id="chapter-tree"
        ref={viewport}
        onScroll={measureScroll}
      >
        <div className="NavContent">
          <section className="NavGroup">
            <div className="NavGroupTitle">
              <Text color={colors.white}>[INTRO]</Text>
            </div>
            {manifest.pages
              .filter((entry) => entry.navigation && entry.group === "Intro")
              .map(node)}
          </section>
          {(["Game Design", "Implementation"] as const).map((chapter) => {
            const pages = manifest.pages.filter(
              (p) =>
                p.navigation &&
                p.group !== "Intro" &&
                p.chapter ===
                  (chapter === "Game Design" ? "Gameplay" : "Development")
            );
            const relevant = pages.some((p) => p.route === page.route);
            return (
              <section className="NavTree" key={chapter}>
                <div className="NavTitle">
                  <Pixels rows={[[none]]} />
                  <TabTitle active={relevant}>{chapter}</TabTitle>
                </div>
                {[...new Set(pages.map((p) => p.group))].map((group) => (
                  <section className="NavGroup" key={group}>
                    <div className="NavGroupTitle">
                      <Text
                        color={colors.white}
                      >{`[${group.toUpperCase()}]`}</Text>
                    </div>
                    {pages.filter((p) => p.group === group).map(node)}
                  </section>
                ))}
              </section>
            );
          })}
        </div>
      </div>
      {scroll.rows > 0 && (
        <div className="NavScroll">
          <button
            type="button"
            aria-label="Scroll navigation up"
            onClick={() => viewport.current?.scrollBy(0, -32)}
          >
            <Pixels rows={[[scrollBarTop]]} />
          </button>
          <div
            role="scrollbar"
            tabIndex={0}
            aria-label="Chapter position"
            aria-controls="chapter-tree"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={scroll.percent}
            aria-orientation="vertical"
            onPointerDown={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const view = viewport.current!;
              view.scrollTop =
                ((event.clientY - rect.top) / rect.height) *
                (view.scrollHeight - view.clientHeight);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                viewport.current?.scrollBy(
                  0,
                  event.key === "ArrowUp" ? -32 : 32
                );
              }
            }}
          >
            <Pixels
              rows={Array.from({ length: scroll.rows }, (_, index) => [
                index === scroll.index ? scrollHandle : scrollBar,
              ])}
            />
          </div>
          <button
            type="button"
            aria-label="Scroll navigation down"
            onClick={() => viewport.current?.scrollBy(0, 32)}
          >
            <Pixels rows={[[scrollBarBottom]]} />
          </button>
        </div>
      )}
    </nav>
  );
}

function WikiHeader({ navigate }: { navigate: Navigate }) {
  const element = useRef<HTMLElement>(null);
  const [columns, setColumns] = useState(Math.ceil(window.innerWidth / 18));
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setColumns(Math.ceil(entry.contentRect.width / 18))
    );
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  return (
    <header className="WikiHeader" ref={element}>
      <Pixels rows={[textSprites(" ")]} />
      <div className="HeaderText">
        <Link
          href="index.html"
          navigate={navigate}
          label="Alive wiki"
          styled={false}
        >
          <Text color={colors.maroon} continuous>
            {"ALIVE "}
          </Text>
          <Text color={colors.grey} continuous>
            {manifest.version}
          </Text>
        </Link>
        <Text color={colors.white} continuous>
          WIKI
        </Text>
      </div>
      <div className="HeaderRule">
        <Pixels rows={[textSprites("─".repeat(columns), colors.silver)]} />
      </div>
    </header>
  );
}

function App() {
  const [route, setRoute] = useState(currentRoute);
  const requestedPage =
    manifest.pages.find((p) => p.route === route) || manifest.pages[0];
  const [loaded, setLoaded] = useState<WikiPage>();
  const [error, setError] = useState("");
  const page = loaded
    ? manifest.pages.find((page) => page.route === loaded.route)!
    : requestedPage;
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    const url = sourceFiles(
      requestedPage.source.startsWith("wiki/")
        ? "./wiki/pages/" + requestedPage.source.slice(5)
        : "./" + requestedPage.source.slice(4)
    ) as string;
    void fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (
          !response.ok ||
          response.headers.get("content-type")?.includes("text/html")
        )
          throw new Error(`Could not load ${requestedPage.source}`);
        return response.text();
      })
      .then((text) => {
        if (!controller.signal.aborted) {
          setAudioActive(false);
          muteAudio();
          setLoaded({
            ...requestedPage,
            tokens: parseMarkdown(
              text,
              requestedPage,
              manifest.pages,
              manifest.references
            ),
          });
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(String(cause.message || cause));
      });
    return () => controller.abort();
  }, [requestedPage]);
  const ready = loaded?.source === requestedPage.source;
  const navigate: Navigate = (path) => {
    setAudioActive(false);
    muteAudio();
    const [target, hash] = path.split("#");
    const url = new URL(
      canonicalRoute(target) + (hash ? "#" + hash : ""),
      base
    );
    const previousUrl = window.location.href;
    window.history.pushState({}, "", url);
    setRoute(currentRoute());
    if (new URL(previousUrl).hash !== url.hash)
      window.dispatchEvent(
        new HashChangeEvent("hashchange", {
          oldURL: previousUrl,
          newURL: url.href,
        })
      );
    if (canonicalRoute(target) === page.route)
      requestAnimationFrame(() => {
        if (url.hash)
          document.getElementById(url.hash.slice(1))?.scrollIntoView();
        else window.scrollTo(0, 0);
      });
  };
  useEffect(() => {
    const pop = () => {
      setAudioActive(false);
      muteAudio();
      const nextRoute = currentRoute();
      setRoute(nextRoute);
      if (nextRoute !== page.route) return;
      requestAnimationFrame(() => {
        if (window.location.hash)
          document
            .getElementById(window.location.hash.slice(1))
            ?.scrollIntoView();
        else window.scrollTo(0, 0);
      });
    };
    window.addEventListener("popstate", pop);
    window.history.scrollRestoration = "manual";
    return () => window.removeEventListener("popstate", pop);
  }, [page.route]);
  useLayoutEffect(() => {
    const canonical = new URL(page.route + window.location.hash, base);
    if (window.location.pathname !== canonical.pathname)
      window.history.replaceState({}, "", canonical);
    document.title = `${page.title} | Alive ${manifest.version} Wiki`;
    if (window.location.hash)
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [page.route, page.title, loaded]);
  const chapterPages = manifest.pages.filter(
      (p) => p.chapter === page.chapter && p.navigation && !p.disabled
    ),
    index = chapterPages.indexOf(page),
    back = chapterPages[index - 1],
    next = chapterPages[index + 1];
  return (
    <ReferenceContext.Provider
      value={{
        route: page.route,
        implementation: page.chapter === "Development",
        entries:
          page.chapter === "Development"
            ? { ...sourcePaths, ...explicitReferences, ...page.references }
            : references,
        features: page.chapter === "Development" ? {} : automaticFeatures,
        decorations: page.chapter === "Development" ? {} : decorations,
        pattern: patternFor(automaticFeatures),
        link: (href, children, navigation) => (
          <Link
            href={href}
            navigate={navigate}
            automatic
            navigation={navigation}
          >
            {children}
          </Link>
        ),
      }}
    >
      <div
        className="TerminalPage"
        style={
          {
            "--link-underline": underlineImage(colors.blue),
            "--link-hover-underline": underlineImage(colors.aqua),
          } as React.CSSProperties
        }
      >
        <WikiHeader navigate={navigate} />
        <div className="WikiLayout">
          <Navigation page={page} navigate={navigate} />
          <main
            key={page.route}
            id="content"
            tabIndex={-1}
            aria-busy={!ready && !error}
          >
            {error && (
              <p role="alert">
                <Text>{error}</Text>
              </p>
            )}
            {loaded && (
              <Markdown
                tokens={loaded.tokens}
                navigate={navigate}
                source={page.source}
              />
            )}
            {loaded && (
              <div className="PageControls">
                {back && (
                  <Button onClick={() => navigate(back.route)}>
                    {"< Back"}
                  </Button>
                )}
                {next && (
                  <Button onClick={() => navigate(next.route)}>
                    {"Next >"}
                  </Button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </ReferenceContext.Provider>
  );
}
setAudioActive(false);
muteAudio();
createRoot(document.getElementById("root")!).render(<App />);
