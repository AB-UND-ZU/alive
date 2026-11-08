export type WikiToken = {
  type: string;
  text?: string;
  raw?: string;
  href?: string;
  depth?: number;
  anchor?: string;
  lang?: string;
  syntax?: {
    text: string;
    href?: string;
    kind: "plain" | "keyword" | "string" | "number" | "comment" | "type";
  }[][];
  kind?: string;
  value?: string;
  tokens?: WikiToken[];
  items?: { tokens: WikiToken[] }[];
  ordered?: boolean;
  header?: { tokens: WikiToken[] }[];
  rows?: { tokens: WikiToken[] }[][];
};
export type WikiPage = {
  source: string;
  route: string;
  aliases?: string[];
  title: string;
  chapter: "Gameplay" | "Development";
  group: string;
  navigation?: boolean;
  disabled?: boolean;
  tokens: WikiToken[];
  references?: WikiManifest["references"];
};
export type WikiManifest = {
  version: string;
  pages: WikiPage[];
  title: string[];
  references: Record<
    string,
    { href: string; kind: "type" | "code" | "item" | "unit" }
  >;
};
