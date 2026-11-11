import { render, screen, within } from "@testing-library/react";
import { ReactNode } from "react";
import {
  CatalogDescription,
  getCatalogDescription,
  ItemCatalogEntry,
  UnitCatalogEntry,
} from "./CatalogEntry";
import { getItemSprite } from "../game/assets/utils";
import { commandItems } from "../game/assets/commands";
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

test("equipment materials use native resource sprites and their item destinations", () => {
  render(
    <ReferenceContext.Provider
      value={{
        entries: {
          "item:wood": { href: "resources.html#wood", kind: "item" },
        },
        link,
      }}
    >
      <ItemCatalogEntry name="torch" definition={{ accessory: "torch" }} />
    </ReferenceContext.Provider>
  );
  const row = screen.getByRole("row", {
    name: (name) => name.replace(/\s/g, "").startsWith("Material"),
  });
  const wood = within(row).getByRole("link", { name: /Wood/ });
  expect(wood).toHaveAttribute("href", "resources.html#wood");
  expect(within(wood).getByLabelText("Wood")).toBeInTheDocument();
});

test("potion consumption links to stat definitions rather than collectible stat drops", () => {
  render(
    <ReferenceContext.Provider
      value={{
        entries: {
          "stat:hp": { href: "stats.html#stat-hp", kind: "feature" },
          "item:hp": { href: "consumables.html#hp", kind: "item" },
        },
        link,
      }}
    >
      <ItemCatalogEntry name="potion" definition={{ consume: "potion" }} />
    </ReferenceContext.Provider>
  );
  const row = screen.getByRole("row", {
    name: (name) => name.replace(/\s/g, "").startsWith("Consume"),
  });
  const links = within(row).getAllByRole("link", {
    name: (name) => name.replace(/\s/g, "").endsWith("HP"),
  });
  expect(links.length).toBeGreaterThan(0);
  expect(
    links.every(
      (anchor) => anchor.getAttribute("href") === "stats.html#stat-hp"
    )
  ).toBe(true);
});

test("container loot stays inside its native family comparison as dialog bundles", () => {
  render(<UnitCatalogEntry keys={["pot", "box"]} />);
  expect(screen.getAllByRole("table")).toHaveLength(1);
  expect(screen.getAllByLabelText("15%").length).toBeGreaterThan(0);
  expect(
    screen.getByRole("row", {
      name: (name) => name.replace(/\s/g, "").startsWith("Drops"),
    })
  ).toBeInTheDocument();
});

test("potions and elemental totems group their actual effects", () => {
  const { unmount } = render(
    <ItemCatalogEntry
      name="potion"
      definition={{ consume: "potion", material: "wood", stat: "hp" }}
    />
  );
  expect(
    screen.getByRole("row", {
      name: (name) => name.replace(/\s/g, "").startsWith("Consume"),
    })
  ).toBeInTheDocument();
  unmount();
  render(
    <ItemCatalogEntry
      name="totem"
      definition={{ skill: "totem", material: "wood" }}
    />
  );
  const aura = screen.getByRole("row", {
    name: (name) => name.replace(/\s/g, "").includes("Aura"),
  });
  for (const stat of ["Power", "Wisdom", "Armor", "Resist"])
    expect(aura).toHaveTextContent(stat);
});

test("Oak Boss lists its native post-vanish chest without inventing other spawns", () => {
  render(<UnitCatalogEntry keys={["oakBoss"]} />);
  const row = screen.getByRole("row", {
    name: (name) => name.replace(/\s/g, "").startsWith("Drops"),
  });
  expect(within(row).getByLabelText("Chest")).toBeInTheDocument();
});

test("an empty drop outcome does not create an empty dialog", () => {
  render(<UnitCatalogEntry keys={["rotten"]} />);
  expect(
    within(
      screen.getByRole("row", { name: (name) => name.startsWith("Sprite") })
    ).getByLabelText("Rotten Tree")
  ).toBeInTheDocument();
  expect(screen.getByLabelText("70%")).toBeInTheDocument();
  expect(screen.queryByLabelText("30%")).not.toBeInTheDocument();
});

test("unit attacks share one Damage row with native stat names", () => {
  render(<UnitCatalogEntry keys={["prism", "orb"]} />);
  const row = screen.getByRole("row", {
    name: (name) => name.startsWith("Damage"),
  });
  expect(row).toHaveTextContent("Melee");
  expect(row).toHaveTextContent("Magic");
  expect(
    screen.getAllByRole("row", { name: (name) => name.startsWith("Damage") })
  ).toHaveLength(1);
});

test("native description sprites stay inside the entity link even when their internal name differs from the printed label", () => {
  render(
    <ReferenceContext.Provider
      value={{
        features: { sand: { href: "resources.html#sand", kind: "item" } },
        decorations: {
          sand: {
            sprite: getItemSprite(commandItems.sand, "display"),
            name: "Sand",
          },
        },
        entries: {
          sand: { href: "resources.html#sand", kind: "item" },
          water: { href: "terrain.html#water", kind: "feature" },
        },
        link,
      }}
    >
      <CatalogDescription rows={getCatalogDescription(commandItems.sand)} />
    </ReferenceContext.Provider>
  );
  const water = screen.getByRole("link", { name: /Water/ });
  expect(water).toHaveAttribute("href", "terrain.html#water");
  expect(screen.getByRole("link", { name: /Sand/ })).toHaveAttribute(
    "href",
    "resources.html#sand"
  );
  expect(water).toHaveTextContent("Water");
  expect(within(water).getByLabelText("water_shallow")).toBeInTheDocument();
});
