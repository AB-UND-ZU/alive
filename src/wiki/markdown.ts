import { Marked } from "marked";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import scenes from "./scenes.json";
import { WikiManifest, WikiPage, WikiToken } from "./types";

const parser = new Marked({
  extensions: [
    {
      name: "game",
      level: "inline",
      start: (text) => text.indexOf("[["),
      tokenizer(text) {
        const match = /^\[\[(key|item|unit|stat|button|data):([^\]]+)\]\]/.exec(
          text
        );
        if (match)
          return {
            type: "game",
            raw: match[0],
            kind: match[1],
            value: match[2],
          };
      },
    },
  ],
});

function syntax(
  text: string,
  language: string,
  page: WikiPage,
  references: WikiManifest["references"]
): WikiToken["syntax"] {
  if (!/^(tsx?|jsx?|json)$/.test(language)) return;
  const grammar =
    Prism.languages[
      { ts: "typescript", js: "javascript" }[language] || language
    ];
  if (!grammar) return;
  const chunks: {
    text: string;
    kind: NonNullable<WikiToken["syntax"]>[number][number]["kind"];
  }[] = [];
  const flatten = (
    value: string | Prism.Token | (string | Prism.Token)[],
    kind: (typeof chunks)[number]["kind"] = "plain"
  ) => {
    if (typeof value === "string") chunks.push({ text: value, kind });
    else if (Array.isArray(value)) value.forEach((part) => flatten(part, kind));
    else
      flatten(
        value.content,
        (
          {
            comment: "comment",
            string: "string",
            property: "string",
            number: "number",
            keyword: "keyword",
            boolean: "keyword",
            "class-name": "type",
            builtin: "type",
          } as Record<string, typeof kind>
        )[value.type] || kind
      );
  };
  flatten(Prism.tokenize(text, grammar));
  const lines: NonNullable<WikiToken["syntax"]> = [[]];
  let offset = 0;
  for (const chunk of chunks)
    for (const word of chunk.text.split(/(\b[A-Za-z_$][\w$]*\b|\n)/)) {
      if (!word) continue;
      if (word === "\n") lines.push([]);
      else {
        const before = text.slice(0, offset);
        const reference = references[word];
        const declaration =
          /\b(?:function|class|interface|type|enum|const|let|var|import|as)\s*$/.test(
            before
          );
        const href =
          ["plain", "type"].includes(chunk.kind) &&
          !declaration &&
          !before.trimEnd().endsWith(".") &&
          !/^\s*[?:]\s/.test(text.slice(offset + word.length)) &&
          reference?.href !== page.route
            ? reference?.href
            : undefined;
        lines[lines.length - 1].push({
          text: word,
          kind: chunk.kind,
          ...(href ? { href } : {}),
        });
      }
      offset += word.length;
    }
  return lines;
}

export function parseMarkdown(
  text: string,
  page: WikiPage,
  pages: WikiPage[],
  references: WikiManifest["references"]
): WikiToken[] {
  const tokens = parser.lexer(text.replace(/^# .+$/m, "# " + page.title));
  const source = new URL(page.source, "https://wiki.invalid/");
  parser.walkTokens(tokens, (value) => {
    const token = value as typeof value & WikiToken;
    if (
      token.type === "link" &&
      !/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(token.href!)
    ) {
      const target = new URL(token.href!, source);
      const name =
        (
          {
            "wiki/trading.md": "wiki/shops.md",
            "wiki/levels.md": "wiki/portals.md",
            "wiki/tips.md": "wiki/dialogs.md",
          } as Record<string, string>
        )[target.pathname.slice(1)] || target.pathname.slice(1);
      const destination = pages.find((candidate) => candidate.source === name);
      if (!destination)
        throw new Error(`Unknown wiki link ${token.href} in ${page.source}`);
      token.href = destination.route + target.hash;
    }
    if (
      token.type === "image" &&
      !/^(?:[a-z][\w+.-]*:|\/\/)/i.test(token.href!)
    )
      token.href = new URL(token.href!, source).pathname
        .slice(1)
        .replace(/^wiki\//, "");
    if (token.type === "heading" && token.depth! > 1) {
      const reference = page.references?.[token.text!];
      if (reference?.href.startsWith(page.route + "#"))
        token.anchor = reference.href.split("#")[1];
    }
    if (token.type === "code") {
      if (
        token.lang === "scene" &&
        !scenes.includes(token.text!.trim()) &&
        !/^game\/(menu|dungeon|island)$/.test(token.text!.trim())
      )
        throw new Error("Unknown scene " + token.text);
      token.syntax = syntax(
        token.text!,
        (token.lang || "").split(/\s/)[0],
        page,
        page.chapter === "Development" ? page.references || {} : references
      );
    }
  });
  return tokens as WikiToken[];
}
