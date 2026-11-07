import { itemPage, unitPage, getEffectSprite, previewItem } from "./catalog";
import { CodeBlock } from "./CodeBlock";
import {
  ReferenceContext,
  ReferenceText,
  referenceId,
  Reference,
} from "./references";
import { getItemSprite, getUnitSprite } from "../game/assets/utils";
import { UnitKey } from "../game/balancing/units";
import { generateUnitData } from "../game/balancing/units";
import { WorldMap } from "./WorldMap";
import { unitDefinitions } from "../game/balancing/units";
import { classDefinitions } from "../game/balancing/classes";
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
import manifest from "docs-manifest";
import { DocToken, DocPage } from "./types";
import {
  Heading,
  LinkStyleContext,
  Text,
  Pixels,
  Key,
  ItemView,
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
  Stats as DisplayStats,
} from "../game/assets/ui";
import { Item } from "../engine/components/item";
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

const rootUrl = new URL(
  ".",
  new URL(
    document.querySelector<HTMLMetaElement>('meta[name="docs-root"]')!.content,
    window.location.href
  )
);
const base = rootUrl.href;
const canonicalRoute = (route: string) =>
  manifest.pages.find(
    (page) => page.route === route || page.aliases?.includes(route)
  )?.route || route;
const currentRoute = () =>
  canonicalRoute(
    decodeURI(window.location.pathname.slice(rootUrl.pathname.length)) ||
      "index.html"
  );
const featureRoute = (name: string) =>
  manifest.pages.find((page) => page.source === `docs/${name}.md`)?.route ||
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
const references = { ...manifest.references };
for (const [name, item] of Object.entries(commandItems))
  references[name] = {
    href: `${featureRoute(itemPage(item))}#${referenceId(name)}`,
    kind: "item",
  };
for (const [name, unit] of Object.entries(unitDefinitions))
  references[name] = {
    href: `${featureRoute(unitPage(name, unit))}#${referenceId(name)}`,
    kind: "unit",
  };
for (const [name, reference] of Object.entries(references))
  if (!references[name.toLowerCase()])
    references[name.toLowerCase()] = reference;
for (const name of Object.keys(classDefinitions))
  references[name] = {
    href: `${featureRoute("classes")}#${referenceId(name) || "unknown-class"}`,
    kind: "unit",
  };
for (const [name, reference] of Object.entries(references)) {
  if (reference.kind === "type" || reference.kind === "code") continue;
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
  world: "map",
  element: "elements",
  elements: "elements",
  fire: "elements#fire",
  water: "elements#water",
  earth: "elements#earth",
  air: "elements#air",
  level: "levels",
  saving: "savegames",
  "saved games": "savegames",
  presets: "play",
  "test mode": "play",
  "arrow keys": "keyboard-mouse",
  "earth town": "map",
  "fire town": "map",
  "fire haven": "map",
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
  death: "respawn",
  fog: "light",
  shadow: "light",
  font: "index#font-characters",
  "dos font": "index#font-characters",
  colors: "index#palette",
};
for (const [name, target] of Object.entries(featureAliases)) {
  const [file, anchor] = target.split("#");
  const page = manifest.pages.find((page) => page.source === `docs/${file}.md`);
  if (page)
    features[name] = {
      href: page.route + (anchor ? `#${anchor}` : ""),
      kind: "feature",
    };
}
delete features.characters;
delete features.character;
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
    ...(stat === "true" ? { name: "True" } : {}),
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
for (const name of Object.keys(unitDefinitions)) {
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
for (const [name, definition] of Object.entries(classDefinitions))
  decorations[name] = { sprite: definition.sprite };
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
const patternFor = (entries: Record<string, unknown>) =>
  new RegExp(
    "\\b(" +
      Object.keys(entries)
        .filter((key) => /\w/.test(key))
        .sort((a, b) => b.length - a.length)
        .map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|") +
      ")\\b",
    "gi"
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
    if (!navigation) {
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
      className="DocLink"
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
        {children}
      </LinkStyleContext.Provider>
    </a>
  );
}
function Inline({
  tokens,
  navigate,
  color = colors.silver,
}: {
  tokens: DocToken[];
  navigate: Navigate;
  color?: string;
}) {
  return (
    <>
      {tokens.map((token, i) => {
        if (token.type === "game") {
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
            />
          );
        if (token.type === "codespan")
          return (
            <ReferenceText
              key={i}
              text={decode(token.text || "")}
              implementation
            />
          );
        if (token.type === "br") return <br key={i} />;
        return (
          <ReferenceText
            key={i}
            color={color}
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
  tokens: DocToken[];
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
      source === "docs/play.md" &&
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
            source === "docs/index.md" && token.depth === 1
              ? colors.maroon
              : undefined
          }
        />
      );
    if (token.type === "paragraph")
      return (
        <p key={index}>
          <Inline tokens={token.tokens || []} navigate={navigate} />
        </p>
      );
    if (token.type === "code") {
      if (token.lang === "scene")
        return (
          <GamePreview
            key={index}
            name={token.text!.trim() as SceneName}
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
      if (token.lang === "widget" && token.text!.trim() === "world-map")
        return <WorldMap key={index} />;
      if (token.lang === "widget" && token.text!.trim() === "play")
        return <Play key={index} base={base} />;
      if (token.lang === "widget" && token.text!.trim() === "interface")
        return <InterfaceDiagram key={index} />;
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
        <blockquote key={index}>
          <Markdown
            tokens={token.tokens || []}
            navigate={navigate}
            source={source}
          />
        </blockquote>
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
function Navigation({ page, navigate }: { page: DocPage; navigate: Navigate }) {
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
  const node = (entry: DocPage) => {
    const selected = entry.route === page.route;
    const title =
      entry.source === "docs/index.md"
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

function DocumentationHeader({ navigate }: { navigate: Navigate }) {
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
    <header className="DocsHeader" ref={element}>
      <Pixels rows={[textSprites(" ")]} />
      <div className="HeaderText">
        <Link
          href="index.html"
          navigate={navigate}
          label="Alive documentation"
          styled={false}
        >
          <Text color={colors.maroon}>ALIVE </Text>
          <Text color={colors.grey}>{manifest.version}</Text>
        </Link>
        <Text color={colors.white}>DOCUMENTATION</Text>
      </div>
      <div className="HeaderRule">
        <Pixels rows={[textSprites("─".repeat(columns), colors.silver)]} />
      </div>
    </header>
  );
}

function App() {
  const [route, setRoute] = useState(currentRoute);
  const page =
    manifest.pages.find((p) => p.route === route) || manifest.pages[0];
  const navigate: Navigate = (path) => {
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
    if (url.hash)
      requestAnimationFrame(() =>
        document.getElementById(url.hash.slice(1))?.scrollIntoView()
      );
  };
  useEffect(() => {
    const pop = () => {
      setRoute(currentRoute());
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
  }, []);
  useLayoutEffect(() => {
    const canonical = new URL(page.route + window.location.hash, base);
    if (window.location.pathname !== canonical.pathname)
      window.history.replaceState({}, "", canonical);
    document.title = `${page.title} | Alive ${manifest.version} Documentation`;
    if (window.location.hash)
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [page.route, page.title]);
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
        entries: { ...references, ...page.references },
        features,
        decorations,
        pattern: patternFor({
          ...references,
          ...page.references,
          ...features,
          ...decorations,
        }),
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
      <div className="TerminalPage">
        <DocumentationHeader navigate={navigate} />
        <div className="DocsLayout">
          <Navigation page={page} navigate={navigate} />
          <main key={page.route} id="content" tabIndex={-1}>
            <Markdown
              tokens={page.tokens}
              navigate={navigate}
              source={page.source}
            />
            <div className="PageControls">
              {back && (
                <Button onClick={() => navigate(back.route)}>{"< Back"}</Button>
              )}
              {next && (
                <Button onClick={() => navigate(next.route)}>{"Next >"}</Button>
              )}
            </div>
          </main>
        </div>
      </div>
    </ReferenceContext.Provider>
  );
}
createRoot(document.getElementById("docs-root")!).render(<App />);
