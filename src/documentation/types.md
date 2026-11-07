# types.ts
<!-- source-types -->

## DocToken

```ts src/documentation/types.ts
export type DocToken = {
  type: string;
  text?: string;
  raw?: string;
  href?: string;
  depth?: number;
  anchor?: string;
  lang?: string;
  syntax?: {
    text: string;
    kind: "plain" | "keyword" | "string" | "number" | "comment" | "type";
  }[][];
  kind?: string;
  value?: string;
  tokens?: DocToken[];
  items?: { tokens: DocToken[] }[];
  ordered?: boolean;
  header?: { tokens: DocToken[] }[];
  rows?: { tokens: DocToken[] }[][];
};
```

## DocPage

```ts src/documentation/types.ts
export type DocPage = {
  source: string;
  route: string;
  aliases?: string[];
  title: string;
  chapter: "Gameplay" | "Development";
  group: string;
  navigation?: boolean;
  disabled?: boolean;
  tokens: DocToken[];
  references?: DocsManifest["references"];
};
```

## DocsManifest

```ts src/documentation/types.ts
export type DocsManifest = {
  version: string;
  pages: DocPage[];
  title: string[];
  references: Record<
    string,
    { href: string; kind: "type" | "code" | "item" | "unit" }
  >;
};
```
