import { render, screen } from "@testing-library/react";
import { ReferenceContext, ReferenceText, featureSprites } from "./references";
import { LinkStyleContext, ItemView, UnitView } from "./visuals";
import { commandItems } from "../game/assets/commands";
import { renderToStaticMarkup } from "react-dom/server";
import { mapDiscovery } from "../game/assets/sprites";

const entries = {
  World: { href: "development/ui/world.html", kind: "code" as const },
  world: { href: "game-design/world/map.html", kind: "feature" as const },
  snapshot: {
    href: "development/engine/testing/harness.html",
    kind: "code" as const,
  },
};

test("the Map item stays yellow while world and Levels references use the green warp icon", () => {
  const view = renderToStaticMarkup(<ItemView item={commandItems.map} />);
  expect(view).toContain('fill="#ffff00"');
  expect(view).not.toContain('fill="#00ff00"');
  expect(featureSprites.levels).toBe(mapDiscovery);
  expect(featureSprites.world).toBe(mapDiscovery);
  expect(featureSprites["world map"]).toBe(mapDiscovery);
});
const context = {
  implementation: true,
  entries,
  link: (href: string, children: React.ReactNode) => (
    <a href={href}>{children}</a>
  ),
};

test("technical inline code resolves exact symbols without linking filename fragments or prose", () => {
  render(
    <ReferenceContext.Provider value={context}>
      <ReferenceText text="World" implementation />
      <ReferenceText text="snapshot.ts" implementation />
      <ReferenceText text="world context" />
    </ReferenceContext.Provider>
  );
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.getByRole("link")).toHaveAttribute("href", entries.World.href);
});

test("explicit link labels stay literal even when they match a game or source name", () => {
  render(
    <ReferenceContext.Provider value={context}>
      <a href="target">
        <LinkStyleContext.Provider
          value={{ linked: true, hovered: false, preserveColor: false }}
        >
          <ReferenceText text="World" />
        </LinkStyleContext.Provider>
      </a>
    </ReferenceContext.Provider>
  );
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.getByRole("link")).toHaveTextContent("World");
});

test("technical inline code preserves JavaScript constants instead of formatting game counts", () => {
  render(<ReferenceText text="Infinity" implementation />);
  expect(screen.getByText("Infinity")).toBeInTheDocument();
  expect(screen.queryByLabelText("99+")).not.toBeInTheDocument();
});

test("literal gameplay arguments do not infer globally named code objects", () => {
  render(
    <ReferenceContext.Provider
      value={{
        ...context,
        implementation: false,
        entries: {
          amount: { href: "sprite.html#type-amount", kind: "type" },
          range: { href: "std.html", kind: "code" },
        },
      }}
    >
      <ReferenceText text="amount" implementation />
      <ReferenceText text="range" implementation />
    </ReferenceContext.Provider>
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

test("an item and unit with the same key keep their separate destinations", () => {
  render(
    <ReferenceContext.Provider
      value={{
        ...context,
        entries: {
          golem: { href: "bosses.html#golem", kind: "unit" },
          "item:golem": { href: "resources.html#golem", kind: "item" },
          "unit:golem": { href: "bosses.html#golem", kind: "unit" },
        },
      }}
    >
      <ItemView item={commandItems.golem} />
      <UnitView unit="golem" />
    </ReferenceContext.Provider>
  );
  const links = screen.getAllByRole("link");
  expect(links).toHaveLength(2);
  expect(links[0]).toHaveTextContent("Head");
  expect(links[0]).toHaveAttribute("href", "resources.html#golem");
  expect(links[1]).toHaveAttribute("href", "bosses.html#golem");
});

test("ordinary gameplay verbs do not become item names or decorations", () => {
  render(
    <ReferenceContext.Provider
      value={{
        ...context,
        implementation: false,
        entries: { block: { href: "skills.html#block", kind: "item" } },
        features: {},
        pattern: /(block|range)/gi,
      }}
    >
      <p aria-label="Sight">
        <ReferenceText text="Mountains block sight across the mountain range." />
      </p>
    </ReferenceContext.Provider>
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Sight")).toHaveTextContent(
    "Mountains block sight across the mountain range."
  );
});
