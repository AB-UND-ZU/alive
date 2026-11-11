# Document Types

The route registry and browser Markdown parser supply the typed page data to the React wiki app.

```text manifest-flow.txt
Markdown -> WikiToken[]
             WikiPage
               WikiManifest -> App
```

| Type | Responsibility |
| --- | --- |
| `WikiToken` | A Markdown node, its children and optional syntax chunks with resolved identifier links |
| `WikiPage` | Source path, canonical route, menu group, content and source-local references |
| `WikiManifest` | Game version, pages, title and reference destinations |

A page alias preserves an older URL. `navigation` controls menu inclusion; `disabled` retains an unavailable entry. Prism computes syntax tokens when a page loads. Code links use the committed source-reference index, which is refreshed explicitly with `wiki:types`.
<!-- source-types -->

## WikiToken

```ts src/wiki/types.ts
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
```

## WikiPage

```ts src/wiki/types.ts
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
```

## WikiManifest

```ts src/wiki/types.ts
export type WikiManifest = {
  version: string;
  pages: WikiPage[];
  title: string[];
  references: Record<
    string,
    { href: string; kind: "type" | "code" | "item" | "unit" }
  >;
};
```
