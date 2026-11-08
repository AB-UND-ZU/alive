# Document Types

The builder passes one typed manifest to the React documentation app.

```text manifest-flow.txt
Markdown -> DocToken[]
             DocPage
               DocsManifest -> App
```

| Type | Responsibility |
| --- | --- |
| `DocToken` | A Markdown node, its children and optional syntax chunks with resolved identifier links |
| `DocPage` | Source path, canonical route, menu group, content and source-local references |
| `DocsManifest` | Game version, pages, title and reference destinations |

A page alias preserves an older URL. `navigation` controls menu inclusion; `disabled` retains an unavailable entry. Syntax metadata belongs to the build so the browser does not parse or guess code references.
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
    href?: string;
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
