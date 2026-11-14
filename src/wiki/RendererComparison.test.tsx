import { render, screen, within } from "@testing-library/react";
import { ReactNode } from "react";
import "../engine";
import { RendererComparison } from "./RendererComparison";
import { RendererExamples } from "./RendererExamples";
import { ReferenceContext } from "./references";

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
      <RendererComparison />
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

it("shows matching source sprites beside native terminal characters", () => {
  render(<RendererExamples />);
  expect(screen.getByLabelText("ThreeJS sprite example")).toBeInTheDocument();
  expect(screen.getByLabelText("HTML sprite example")).toBeInTheDocument();
  const terminal = screen.getByLabelText("Terminal sprite example");
  // Native water uses a wave character over its navy background.
  // eslint-disable-next-line testing-library/no-node-access
  expect(terminal.querySelector('[data-glyph="≈"]')).toBeInTheDocument();
  // Human actors keep the female symbol in the game's font encoding.
  // eslint-disable-next-line testing-library/no-node-access
  expect(terminal.querySelector('[data-glyph="ċ"]')).toBeInTheDocument();
});
