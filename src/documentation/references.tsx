import { createContext, ReactNode, useContext } from "react";
import { Text, Pixels, LinkStyleContext } from "./visuals";
import { colors } from "../game/assets/colors";
import { Sprite } from "../engine/components/sprite";
export type Reference = {
  href: string;
  kind: "type" | "code" | "item" | "unit" | "feature";
};
export const ReferenceContext = createContext<{
  route?: string;
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
export function ReferenceText({
  text,
  color = colors.silver,
  implementation = false,
  decorate = true,
}: {
  text: string;
  color?: string;
  implementation?: boolean;
  decorate?: boolean;
}) {
  const {
    entries,
    features = {},
    decorations = {},
    link,
    pattern,
  } = useContext(ReferenceContext);
  const insideLink = useContext(LinkStyleContext);
  return (
    <>
      {text
        .split(pattern || /([A-Za-z_][A-Za-z_0-9]*)/)
        .filter(Boolean)
        .map((part, i) => {
          const key = part.toLowerCase();
          const candidate = implementation
            ? entries[part] || entries[key]
            : features[key] || entries[part] || entries[key];
          const unmatchedItem =
            !implementation &&
            candidate?.kind === "item" &&
            !decorations[key]?.sprite &&
            !features[key];
          const reference = unmatchedItem
            ? undefined
            : (candidate?.kind === "type" || candidate?.kind === "code") &&
              !implementation &&
              !/[A-Z][a-z]+[A-Z]/.test(part)
            ? undefined
            : candidate;
          const decoration = decorate && !implementation && decorations[key];
          const content = (
            <MentionStyle
              preserveColor={Boolean(decoration) || insideLink.preserveColor}
            >
              <span className="RichMention">
                {decoration && decoration.sprite && (
                  <>
                    <Pixels
                      rows={[[decoration.sprite]]}
                      label={decoration.sprite.name}
                    />
                  </>
                )}
                <Text
                  color={
                    (decoration && decoration.color) ||
                    (decoration && decoration.sprite ? colors.grey : color)
                  }
                >
                  {(decoration &&
                    (decoration.name || decoration.sprite?.name)) ||
                    part}
                </Text>
              </span>
            </MentionStyle>
          );
          return (
            <span key={i}>
              {reference && !insideLink.linked
                ? link(reference.href, content)
                : content}
            </span>
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
      : candidate || features[name.toLowerCase()];
  return <>{reference ? link(reference.href, content) : content}</>;
}
