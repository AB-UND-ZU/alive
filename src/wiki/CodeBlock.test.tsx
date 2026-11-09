import { act, render, screen, within } from "@testing-library/react";
import { ReactNode } from "react";
import { CodeBlock } from "./CodeBlock";
import { readRows } from "../components/Controls/testing";
import { ReferenceContext } from "./references";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
const link = (href: string, children: ReactNode) => (
  <a href={href}>{children}</a>
);

test("code links come only from resolved identifier metadata", () => {
  const text = 'Thing("Thing"); // Thing';
  render(
    <ReferenceContext.Provider value={{ entries: {}, link }}>
      <CodeBlock
        source="src/example.md"
        text={text}
        syntax={[
          [
            { text: "Thing", kind: "plain", href: "thing.html" },
            { text: "(", kind: "plain" },
            { text: '"Thing"', kind: "string", href: "wrong.html" },
            { text: "); ", kind: "plain" },
            { text: "// Thing", kind: "comment", href: "wrong.html" },
          ],
        ]}
      />
    </ReferenceContext.Provider>
  );
  const source = screen.getByLabelText(text);
  expect(source.textContent).toBe(text);
  const links = within(source).getAllByRole("link");
  expect(links).toHaveLength(1);
  expect(links[0]).toHaveAttribute("href", "thing.html");
});

test("unresolved code stays plain even if a global name matches", () => {
  render(
    <ReferenceContext.Provider
      value={{ entries: { Thing: { href: "thing.html", kind: "type" } }, link }}
    >
      <CodeBlock source="src/example.md" text="Thing()" />
    </ReferenceContext.Provider>
  );
  expect(
    within(screen.getByLabelText("Thing()")).queryByRole("link")
  ).not.toBeInTheDocument();
});

test("source content excludes the filename and dialog controls", () => {
  render(
    <CodeBlock
      source="src/a/long/source/path.md"
      language="ts"
      text={"const ready = 1;\nready;"}
    />
  );
  const source = screen.getByLabelText("const ready = 1; ready;");
  expect(source.textContent).toBe("const ready = 1;\nready;");
  expect(screen.getByTitle("src/a/long/source/path.ts")).toHaveAccessibleName(
    "src/a/long/source/path.ts"
  );
});

test("a code dialog retains its usable width when a hidden observer reports zero", () => {
  const OriginalObserver = global.ResizeObserver;
  let resize: ResizeObserverCallback;
  global.ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) {
      resize = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  try {
    render(
      <CodeBlock
        source="wiki/example.md"
        language="ts"
        text="const value = 1;"
      />
    );
    act(() =>
      resize(
        [{ contentRect: { width: 1026 } } as ResizeObserverEntry],
        {} as ResizeObserver
      )
    );
    expect(readRows(screen.getByTitle("example.ts")).join("\n")).toContain(
      "EXAMPLE.TS"
    );
    act(() =>
      resize(
        [{ contentRect: { width: 0 } } as ResizeObserverEntry],
        {} as ResizeObserver
      )
    );
    expect(readRows(screen.getByTitle("example.ts")).join("\n")).toContain(
      "EXAMPLE.TS"
    );
  } finally {
    global.ResizeObserver = OriginalObserver;
  }
});
