/* eslint-disable testing-library/no-node-access -- inspect serialized native sprites beside their labels */
import { getItemSprite } from "../game/assets/utils";
import { getWikiUnitSprite } from "./catalog";
import { render, screen } from "@testing-library/react";
import {
  ReferenceContext,
  ReferenceText,
  ReferenceLink,
  featureSprites,
} from "./references";
import { LinkStyleContext, ItemView, UnitView, Text } from "./visuals";
import { commandItems } from "../game/assets/commands";
import { mapDiscovery } from "../game/assets/sprites";
import { colors } from "../game/assets/colors";

const entries = {
  World: { href: "development/ui/world.html", kind: "code" as const },
  world: { href: "game-design/world/map.html", kind: "feature" as const },
  snapshot: {
    href: "development/engine/testing/harness.html",
    kind: "code" as const,
  },
};

test("the Map item stays yellow while world and Levels references use the green warp icon", () => {
  render(<ItemView item={commandItems.map} />);
  const map = screen.getByLabelText("Map").innerHTML;
  expect(map).toContain(`fill="${colors.yellow}"`);
  expect(map).not.toContain(`fill="${colors.lime}"`);
  for (const key of ["level", "levels", "menu", "dungeon", "island"])
    expect(featureSprites[key]).toBe(mapDiscovery);
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

for (const [name, sprite] of Object.entries(featureSprites))
  test(`${name} references keep their native sprite and capitalized label in one link`, () => {
    render(
      <ReferenceContext.Provider
        value={{
          entries: {},
          features: { [name]: { href: "feature.html", kind: "feature" } },
          link: (href, children) => <a href={href}>{children}</a>,
        }}
      >
        <ReferenceText text={name} />
      </ReferenceContext.Provider>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "feature.html");
    expect(link.querySelector(".Pixels")).toHaveAttribute(
      "aria-label",
      sprite.name
    );
    const label = link.cloneNode(true) as HTMLElement;
    label.querySelectorAll(".Pixels").forEach((node) => node.remove());
    expect(label.textContent).toMatch(/^[A-Z]/);
  });

for (const name of ["gate", "smith"])
  test(`lowercase ${name} prose uses the same linked sprite format as a table entry`, () => {
    render(
      <ReferenceContext.Provider
        value={{
          entries: {},
          features: { [name]: { href: "npcs.html", kind: "unit" } },
          decorations: {
            [name]: { sprite: getWikiUnitSprite("fireGateGuard") },
          },
          link: (href, children) => <a href={href}>{children}</a>,
        }}
      >
        <ReferenceText text={name} />
      </ReferenceContext.Provider>
    );
    const link = screen.getByRole("link");
    expect(link.querySelector(".Pixels")).not.toBeNull();
    expect(link.querySelector(".Text")).toHaveTextContent(
      name[0].toUpperCase() + name.slice(1)
    );
  });

test("the Gate feature remains distinct from the Fire Gate Guard NPC", () => {
  render(
    <ReferenceContext.Provider
      value={{
        entries: {
          gate: { href: "npcs.html#firegateguard", kind: "unit" },
          "unit:fireGateGuard": {
            href: "npcs.html#firegateguard",
            kind: "unit",
          },
        },
        features: { gate: { href: "structures.html#doors", kind: "feature" } },
        link: context.link,
      }}
    >
      <ReferenceLink name="gate" sprite>
        <Text>Gate</Text>
      </ReferenceLink>
      <UnitView unit="fireGateGuard" />
    </ReferenceContext.Provider>
  );
  const links = screen.getAllByRole("link");
  expect(links[0]).toHaveAttribute("href", "structures.html#doors");
  expect(links[1]).toHaveAttribute("href", "npcs.html#firegateguard");
  expect(links[1]).toHaveTextContent("Fire Gate Guard");
});

test("blocking prose stays literal while the skill remains an explicit item reference", () => {
  const sprite = getItemSprite(commandItems.block, "display");
  render(
    <ReferenceContext.Provider
      value={{
        entries: { "item:block": { href: "skills.html#block", kind: "item" } },
        features: { block: { href: "skills.html#block", kind: "item" } },
        decorations: { block: { sprite, name: sprite.name } },
        pattern: /(block)/gi,
        link: context.link,
      }}
    >
      <p aria-label="Sight">
        <ReferenceText text="Mountains block sight." />
      </p>
      <ItemView item={commandItems.block} />
    </ReferenceContext.Provider>
  );
  expect(screen.getByLabelText("Sight")).toHaveTextContent(
    "Mountains block sight."
  );
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.getByRole("link")).toHaveTextContent("Block");
});

test("generic Door references use the native closed wood door", () => {
  const { doorClosed } = require("../game/assets/templates/units");
  expect(featureSprites.door).toEqual(doorClosed.wood.default);
  expect(featureSprites.doors).toEqual(doorClosed.wood.default);
});
