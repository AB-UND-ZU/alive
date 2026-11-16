import { render, screen, within } from "@testing-library/react";
import { ReactNode } from "react";
import "../engine";
import { RendererComparison } from "./RendererComparison";
import { ReferenceContext } from "./references";

jest.mock("./GamePreview", () => ({
  GamePreview: ({ renderer, name }: { renderer: string; name: string }) => (
    <div
      role="img"
      aria-label={`${renderer} live example`}
      data-scene={name}
      data-renderer={renderer}
    />
  ),
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

it("compares the clients' visible features and links to their pages", () => {
  render(
    <ReferenceContext.Provider
      value={{
        entries: {},
        features: Object.fromEntries(
          ["threejs", "html", "terminal"].map((client) => [
            client,
            { kind: "feature", href: `game-design/clients/${client}.html` },
          ])
        ),
        link: (href: string, children: ReactNode) => (
          <a href={href}>{children}</a>
        ),
      }}
    >
      <RendererComparison base="/alive/wiki/" />
    </ReferenceContext.Provider>
  );
  expect(screen.getByRole("link", { name: "HTML" })).toHaveAttribute(
    "href",
    "game-design/clients/html.html"
  );
  const values = (name: string) => {
    const header = screen.getByRole("rowheader", { name });
    // eslint-disable-next-line testing-library/no-node-access
    return within(header.closest("tr")!)
      .getAllByRole("cell")
      .map((cell) => cell.textContent);
  };
  expect(values("Lighting")).toEqual(["Yes", "No", "No"]);
  expect(values("Unit health bars")).toEqual(["Yes", "Yes", "No"]);
  expect(values("Smooth movement")).toEqual(["Yes", "Yes", "No"]);
  expect(values("Fog of war")).toEqual(["Yes", "Yes", "Yes"]);
});

it("puts one matching live renderer scene in the feature table's first row", () => {
  render(<RendererComparison base="/alive/wiki/" />);
  const example = screen.getByRole("rowheader", { name: "Example" });
  // eslint-disable-next-line testing-library/no-node-access
  const row = example.closest("tr")!;
  expect(
    within(row)
      .getAllByRole("img")
      .map((image) => image.getAttribute("data-renderer"))
  ).toEqual(["three-js", "html", "terminal"]);
  for (const image of within(row).getAllByRole("img"))
    expect(image).toHaveAttribute("data-scene", "comparison");
});
