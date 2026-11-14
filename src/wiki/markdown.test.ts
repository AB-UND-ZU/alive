import { parseMarkdown } from "./markdown";
import { WikiPage, WikiToken } from "./types";
const page: WikiPage = {
  source: "wiki/interface.md",
  title: "Interface",
  route: "game-design/controls/interface.html",
  chapter: "Gameplay",
  group: "Controls",
  tokens: [],
};
const target: WikiPage = {
  ...page,
  source: "src/engine/components/item.md",
  title: "Item",
  route: "development/components/item.html",
};
function collect(tokens: WikiToken[]): WikiToken[] {
  return tokens.flatMap((token) => [token, ...collect(token.tokens || [])]);
}

test("Markdown keeps relative source links, native references and isolated game scenes", () => {
  const tokens = collect(
    parseMarkdown(
      "# Old heading\n\n[Item](../src/engine/components/item.md#type-item) and [[key:Enter]].\n\n```scene\nmovement\n```",
      page,
      [page, target],
      {}
    )
  );
  expect(tokens.find((token) => token.type === "heading")?.text).toBe(
    "Interface"
  );
  expect(tokens.find((token) => token.type === "link")?.href).toBe(
    target.route + "#type-item"
  );
  expect(tokens.find((token) => token.type === "game")).toMatchObject({
    kind: "key",
    value: "Enter",
  });
  expect(tokens.find((token) => token.type === "code")).toMatchObject({
    lang: "scene",
    text: "movement",
  });
});

test("code snippets preserve their source and only link resolved identifier uses", () => {
  const references = {
    Item: { href: target.route + "#type-item", kind: "type" as const },
  };
  const text = 'const Item = "Item";\nuse(Item); object.Item; // Item';
  const tokens = parseMarkdown(
    "```ts example.ts\n" + text + "\n```",
    page,
    [page],
    references
  );
  const lines = tokens[0].syntax!;
  expect(
    lines.map((line) => line.map((part) => part.text).join("")).join("\n")
  ).toBe(text);
  expect(
    lines
      .flat()
      .filter((part) => part.href)
      .map((part) => part.text)
  ).toEqual(["Item"]);
  expect(lines.flat().some((part) => part.kind === "string")).toBe(true);
  expect(lines.flat().some((part) => part.kind === "comment")).toBe(true);
});

test("source headings preserve type anchors", () => {
  const reference = {
    href: target.route + "#type-item",
    kind: "type" as const,
  };
  const tokens = parseMarkdown(
    "# Item\n\n## Item\n",
    { ...target, references: { Item: reference } },
    [target],
    {}
  );
  expect(tokens.find((token) => token.depth === 1)?.anchor).toBeUndefined();
  expect(tokens.find((token) => token.depth === 2)?.anchor).toBe("type-item");
});

test("invalid documentation links and unknown scenes report the page error", () => {
  expect(() =>
    parseMarkdown("[Missing](missing.md)", page, [page], {})
  ).toThrow("Unknown wiki link");
  expect(() =>
    parseMarkdown("```scene\nunknown-scene\n```", page, [page], {})
  ).toThrow("Unknown scene");
});

test("every registered wiki page resolves its links and native scenes", () => {
  const { readFileSync } = require("node:fs");
  const pages = (require("./pages.json") as Omit<WikiPage, "tokens">[]).map(
    (page) => ({
      ...page,
      tokens: [],
    })
  );
  for (const page of pages)
    expect(() =>
      parseMarkdown(readFileSync(page.source, "utf8"), page, pages, {})
    ).not.toThrow();
}, 30000);

test("plain text fences remain literal even when words match source symbols", () => {
  const tokens = parseMarkdown("```text\nItem -> Widget\n```", page, [page], {
    Item: { href: target.route + "#type-item", kind: "type" },
  });
  expect(tokens[0].text).toBe("Item -> Widget");
  expect(tokens[0].syntax).toBeUndefined();
});

test.each(["three-js", "html", "terminal"])(
  "accepts the %s client scene",
  (client) => {
    expect(
      parseMarkdown(
        "```scene\nclients/" + client + "\n```",
        page,
        [page],
        {}
      )[0]
    ).toMatchObject({ lang: "scene", text: "clients/" + client });
  }
);
test("rejects an unknown renderer client", () => {
  expect(() =>
    parseMarkdown("```scene\nclients/missing\n```", page, [page], {})
  ).toThrow("Unknown scene");
});
