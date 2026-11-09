/* eslint-disable testing-library/no-node-access -- inspect serialized sprite media separately from its text labels */
import { renderToStaticMarkup } from "react-dom/server";
import { readRows } from "../components/Controls/testing";
import { render, screen } from "@testing-library/react";
import {
  StatLabel,
  Text,
  Literal,
  UnitView,
  ProseContext,
  TableContext,
  Count,
  Frame,
} from "./visuals";

const text = (view: string) => {
  const element = document.createElement("div");
  element.innerHTML = view;
  element.querySelectorAll(".Pixels").forEach((node) => {
    node.textContent = readRows(node as HTMLElement).join("").replace(/[^0-9%]/g, "");
  });
  return element.textContent || "";
};

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("native stat labels", () => {
  it("places the amount before its icon and name", () => {
    const view = renderToStaticMarkup(<StatLabel stat="hp" value={25} />);
    expect(text(view)).toBe("25HP");
  });
  it("places percentage marks before the icon", () => {
    const view = renderToStaticMarkup(
      <StatLabel stat="hp" value={25} percentage />
    );
    expect(text(view)).toBe("25%HP");
  });
  it("keeps the level number after its name", () => {
    const view = renderToStaticMarkup(<StatLabel stat="level" value={1} />);
    expect(text(view)).toBe("Level 1");
  });
  it("keeps compact level labels numbered", () => {
    const view = renderToStaticMarkup(
      <StatLabel stat="level" value={4} showName={false} />
    );
    expect(text(view)).toBe("4");
  });
  it("keeps amounts and source labels visible for stats without a sprite", () => {
    const view = renderToStaticMarkup(<StatLabel stat="knock" value={3} />);
    expect(text(view)).toBe("3Knock");
    expect(view).not.toContain("--glyph-color:black");
  });
  it("can show a compact count and icon without repeating the label", () => {
    const view = renderToStaticMarkup(
      <StatLabel stat="hp" value={25} showName={false} />
    );
    expect(text(view)).toBe("25");
  });
});

it("can paint an unadorned header as one native font run", () => {
  const view = renderToStaticMarkup(<Text continuous>ALIVE</Text>);
  expect(text(view)).toBe("ALIVE");
  expect(view).toContain("NativeText");
  expect(view).not.toContain('class="Cell ');
});

it("preserves requested line breaks without creating missing glyphs", () => {
  const view = renderToStaticMarkup(<Text>{"Sword\nEffect"}</Text>);
  expect(text(view)).toBe("Sword\nEffect");
  expect(view).toContain("MultilineText");
  expect(view).not.toContain("?");
});

it("shows sample data as white bracketed text", () => {
  const view = renderToStaticMarkup(
    <ProseContext.Provider value>
      <Literal>320 x 240</Literal>
    </ProseContext.Provider>
  );
  expect(text(view)).toBe("[320 x 240]");
  expect(view).toContain("--glyph-color:#ffffff");
});

it.each(["rock1", "rock2"] as const)(
  "labels visible unnamed %s units beside their native icon",
  (unit) => {
    const view = renderToStaticMarkup(<UnitView unit={unit} />);
    expect(view).toContain(
      `aria-label="${unit === "rock1" ? "Rock1" : "Rock2"}"`
    );
    expect(view).toContain("TextPrefix");
    expect(text(view)).toContain(unit === "rock1" ? "Rock1" : "Rock2");
  }
);
it("does not invent an icon or name for an intentionally invisible unit", () => {
  const view = renderToStaticMarkup(<UnitView unit="rotten" />);
  expect(view).not.toContain("TextPrefix");
  expect(text(view)).toBe("");
});

it.each([
  ["hedge1", "Hedge One"],
  ["hedge2", "Hedge Two"],
] as const)(
  "normalizes the native %s name without exposing underscores",
  (unit, name) => {
    const view = renderToStaticMarkup(<UnitView unit={unit} />);
    expect(view).toContain(`aria-label="${name}"`);
    expect(text(view)).toContain(name);
    expect(text(view)).not.toContain("_");
  }
);

it("keeps table values unbracketed even inside a prose context", () => {
  const view = renderToStaticMarkup(
    <ProseContext.Provider value>
      <TableContext.Provider value>
        <Literal>25</Literal>
      </TableContext.Provider>
    </ProseContext.Provider>
  );
  expect(text(view)).toBe("25");
});
it("leaves zero stat values out of comparison cells", () => {
  const view = renderToStaticMarkup(
    <TableContext.Provider value>
      <StatLabel stat="armor" value={0} />
    </TableContext.Provider>
  );
  expect(view).toBe("");
});

it("renders the native frame title as ordinary font text", () => {
  render(
    <Frame compact title="Crafting">
      Ingredients
    </Frame>
  );
  expect(readRows(screen.getByLabelText("Crafting"))[0]).toContain("CRAFTING");
});

it("keeps the complete native title in a narrow frame with its requested background", () => {
  render(
    <Frame title="Contents" titleBackground="#008000" columns={3}>
      Items
    </Frame>
  );
  const frame = screen.getByLabelText("Contents");
  expect(readRows(frame)[0]).toContain("CONTENTS");
  expect(frame).toHaveStyle({ maxWidth: "216px" });
  expect(frame.innerHTML).toContain("color: rgb(0, 128, 0)");
});

it.each([Infinity, -Infinity])(
  "renders an unbounded count with the native 9+ sprite (%s)",
  (value) => {
    const view = renderToStaticMarkup(<Count value={value} />);
    expect(view).toContain('aria-label="99+"');
    expect(view).toContain("color:#c0c0c0");
    expect(view).not.toContain("Infinity");
  }
);

it("keeps the stat icon beside an unbounded value", () => {
  const view = renderToStaticMarkup(<StatLabel stat="hp" value={Infinity} />);
  expect(view).toContain('aria-label="99+"');
  expect(view).toContain('aria-label="HP"');
  expect(view).not.toContain("Infinity");
});

it.each(["Infinity", "∞", "99+"])(
  "normalizes unbounded values in prose and literals (%s)",
  (value) => {
    const view = renderToStaticMarkup(<Literal>{value + " ticks"}</Literal>);
    expect(view).toContain('aria-label="99+"');
    expect(view).toContain(" ticks");
    expect(view).not.toContain("Infinity");
  }
);
