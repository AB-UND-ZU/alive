import { createContext, ReactNode, useContext } from "react";
import { Text, Pixels, LinkStyleContext, TableContext } from "./visuals";
import { colors } from "../game/assets/colors";
import { Sprite } from "../engine/components/sprite";
import {
  mapDiscovery,
  portal,
  chairRight,
  table,
  boat,
  jetty,
  campfire,
  bedItem,
  pot,
  bench,
  anvil,
  kettle,
  sand,
  path,
  tree1,
  palm1,
  bush,
  grass,
  stats,
  logging,
  mining,
  fishing,
  farming,
  build,
  aura,
  mapHouse,
  mapFortress,
} from "../game/assets/sprites";
import { doorClosed } from "../game/assets/templates/units";
import { getItemSprite } from "../game/assets/utils";
import { shop, forge, brew, craft } from "../game/assets/ui";

export const featureSprites: Record<string, Sprite> = {
  "wood house": mapHouse,
  "desert fort": mapFortress,
  level: mapDiscovery,
  levels: mapDiscovery,
  chair: chairRight,
  table,
  boat,
  dock: jetty,
  jetty,
  fireplace: campfire,
  bed: bedItem,
  vase: pot,
  bench,
  workbench: bench,
  workstations: bench,
  potion: getItemSprite({ consume: "potion", material: "wood", stat: "hp" }),
  potions: getItemSprite({ consume: "potion", material: "wood", stat: "hp" }),
  door: doorClosed.wood.default,
  doors: doorClosed.wood.default,
  gate: getItemSprite({ materialized: "gate", material: "wood" }),
  gates: getItemSprite({ materialized: "gate", material: "wood" }),
  anvil,
  kettle,
  desert: sand,
  path,
  tree: tree1,
  palm: palm1,
  bush,
  grass,
  menu: mapDiscovery,
  dungeon: mapDiscovery,
  portals: mapDiscovery,
  portal,
  island: mapDiscovery,
  world: mapDiscovery,
  "world map": mapDiscovery,
  map: mapDiscovery,
  maps: mapDiscovery,
  minimap: mapDiscovery,
  minimaps: mapDiscovery,
  stats,
  aura,
  shop: { ...shop, name: "Shop" },
  shops: { ...shop, name: "Shop" },
  trading: { ...shop, name: "Shop" },
  forging: { ...forge, name: "Forging" },
  forge: { ...forge, name: "Forging" },
  brewing: { ...brew, name: "Brewing" },
  brew: { ...brew, name: "Brewing" },
  crafting: { ...craft, name: "Crafting" },
  craft: { ...craft, name: "Crafting" },
  fishing,
  mining,
  logging,
  farming,
  building: build,
  build,
};
export type Reference = {
  href: string;
  kind: "type" | "code" | "item" | "unit" | "feature";
};
export const ReferenceContext = createContext<{
  route?: string;
  implementation?: boolean;
  entries: Record<string, Reference>;
  features?: Record<string, Reference>;
  decorations?: Record<
    string,
    { sprite?: Sprite; color?: string; name?: string }
  >;
  link: (href: string, children: ReactNode, navigation?: boolean) => ReactNode;
  pattern?: RegExp;
}>({ entries: {}, link: (_, children) => children });
export const referenceId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export function matchesReferenceName(label: string, name: string) {
  const canonical = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const word = label.toLowerCase().replace(/[^a-z0-9]/g, "");
  return [
    canonical,
    canonical + "s",
    canonical + "es",
    canonical.replace(/y$/, "ie") + "s",
  ].includes(word);
}

export function ReferenceText({
  text,
  color = colors.silver,
  implementation = false,
  decorate = true,
  suffix,
}: {
  text: string;
  color?: string;
  implementation?: boolean;
  decorate?: boolean;
  suffix?: ReactNode;
}) {
  const {
    entries,
    features = {},
    decorations = {},
    link,
    pattern,
    implementation: sourcePage,
  } = useContext(ReferenceContext);
  const insideLink = useContext(LinkStyleContext);
  const inTable = useContext(TableContext);
  if (insideLink.linked)
    return (
      <Text color={color} suffix={suffix} code={implementation}>
        {text}
      </Text>
    );
  if (implementation || sourcePage) {
    const candidate = entries[text];
    const reference =
      implementation &&
      (candidate?.kind === "code" || candidate?.kind === "type") &&
      (sourcePage || /[A-Z]/.test(text) || text.startsWith("src/"))
        ? candidate
        : undefined;
    const content = (
      <Text color={color} suffix={suffix} code={implementation}>
        {text}
      </Text>
    );
    return <>{reference ? link(reference.href, content) : content}</>;
  }
  const chunks: { text: string; punctuation: string }[] = [];
  for (let part of pattern ? text.split(pattern).filter(Boolean) : [text]) {
    const punctuation = chunks.length && part.match(/^[.,!?;:)\]}]+/)?.[0];
    if (punctuation) {
      chunks[chunks.length - 1].punctuation += punctuation;
      part = part.slice(punctuation.length);
    }
    if (part) chunks.push({ text: part, punctuation: "" });
  }
  return (
    <>
      {chunks.map((chunk, index) => {
        const key = chunk.text.toLowerCase();
        const candidate = entries[key];
        let reference: Reference | undefined =
          features[key] ||
          (inTable && (candidate?.kind === "unit" || candidate?.kind === "item")
            ? candidate
            : undefined);
        const nativeFeature = featureSprites[key];
        const decoration = nativeFeature
          ? {
              sprite: nativeFeature,
              name: chunk.text.charAt(0).toUpperCase() + chunk.text.slice(1),
              color: colors.grey,
            }
          : decorate &&
            reference &&
            decorations[key] &&
            (decorations[key].sprite ||
              decorations[key].color ||
              decorations[key].name)
          ? decorations[key]
          : undefined;
        // Blocking is ordinary prose; the skill is referenced explicitly with item:block.
        if (reference?.kind === "item" && ["block", "blocks"].includes(key))
          reference = undefined;
        const tail =
          chunk.punctuation || (index === chunks.length - 1 && suffix) ? (
            <>
              {chunk.punctuation && (
                <Text color={color} link={false}>
                  {chunk.punctuation}
                </Text>
              )}
              {index === chunks.length - 1 && suffix}
            </>
          ) : undefined;
        const content = (
          <MentionStyle
            preserveColor={Boolean(decoration) || insideLink.preserveColor}
          >
            <span className="RichMention">
              {decoration?.sprite && (
                <Pixels
                  rows={[[decoration.sprite]]}
                  label={decoration.sprite.name}
                />
              )}
              <Text
                color={
                  decoration?.color ||
                  (decoration?.sprite ? colors.grey : color)
                }
                suffix={tail}
              >
                {decoration?.name ||
                  (decoration?.sprite
                    ? chunk.text.charAt(0).toUpperCase() + chunk.text.slice(1)
                    : chunk.text)}
              </Text>
            </span>
          </MentionStyle>
        );
        return reference ? (
          <span key={index}>
            {link(reference.href, content, Boolean(decoration?.sprite))}
          </span>
        ) : (
          <Text key={index} color={color} suffix={tail}>
            {chunk.text}
          </Text>
        );
      })}
    </>
  );
}
export function MentionStyle({
  children,
  preserveColor,
}: {
  children: ReactNode;
  preserveColor: boolean;
}) {
  const style = useContext(LinkStyleContext);
  return (
    <LinkStyleContext.Provider value={{ ...style, preserveColor }}>
      {children}
    </LinkStyleContext.Provider>
  );
}
export function ReferenceLink({
  name,
  children,
  sprite = false,
}: {
  name: string;
  children: ReactNode;
  sprite?: boolean;
}) {
  const { entries, features = {}, link } = useContext(ReferenceContext);
  const content = (
    <MentionStyle preserveColor={sprite}>{children}</MentionStyle>
  );
  const candidate = entries[name] || entries[name.toLowerCase()];
  const reference =
    sprite && (candidate?.kind === "type" || candidate?.kind === "code")
      ? features[name.toLowerCase()]
      : features[name.toLowerCase()] || candidate;
  return <>{reference ? link(reference.href, content, true) : content}</>;
}
