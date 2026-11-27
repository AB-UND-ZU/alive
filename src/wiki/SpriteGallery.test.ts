import { createElement } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ReferenceContext } from "./references";
import { SpriteGallery } from "./SpriteGallery";
import { spriteVariations } from "./SpriteGallery";
import { rogue, woodStickAir2 } from "../game/assets/sprites";

test("the sprite catalog contains native bodies and every facing and quantity variant", () => {
  const entries = spriteVariations();
  expect(entries.length).toBeGreaterThan(500);
  expect(entries.find((entry) => entry.key === "rogue")?.sprite.layers).toEqual(
    rogue.layers
  );
  const up = entries.find((entry) => entry.key === "woodStickAir2.facing.up");
  expect(up?.sprite.layers).toEqual(woodStickAir2.facing?.up);
  expect(up?.sourceId).toBe(woodStickAir2.id);
});

test("lists the inherited facing and quantity views of merged sprites", () => {
  const keys = spriteVariations().map(({ key }) => key);
  expect(keys).toContain("units.woodChest.sprite.facing.left");
  expect(keys).toContain("units.woodChest.sprite.amount.multiple");
});

test("links source sprites to their units when the portrait has different art", () => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  const entries = Object.fromEntries(
    ["cactus1", "oakHedge1", "banditPriest", "rotten"].map((key) => [
      "unit:" + key,
      { href: "#" + key, kind: "unit" as const },
    ])
  );
  render(
    createElement(ReferenceContext.Provider, {
      value: {
        entries,
        link: (href, children) => createElement("a", { href }, children),
      },
      children: createElement(SpriteGallery),
    })
  );
  for (const [source, unit] of [
    ["cactus1", "cactus1"],
    ["hedgeDry1", "oakHedge1"],
    ["bandit", "banditPriest"],
  ]) {
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: source },
    });
    const row = screen.getAllByRole("row").find((row) =>
      within(row)
        .queryAllByRole("cell")
        .some((cell) => cell.textContent === source)
    )!;
    expect(within(row).getByRole("link")).toHaveAttribute("href", "#" + unit);
  }
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "ui.statConfig.knock.sprite" },
  });
  expect(screen.queryByRole("link")).toBeNull();
});
