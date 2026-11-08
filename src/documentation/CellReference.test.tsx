import { render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CellReference } from "./CellReference";
import { cellSnapshot, worldPlantGroups } from "./WorldPlants";
import { ReferenceContext } from "./references";

test.each([
  ["berry_one", "Berry", "berry", "world-bush"],
  ["flower_one", "Flower", "flower", "world-grass"],
])(
  "natural %s pickups use their native sprite and plant family",
  (cell, label, item, anchor) => {
    const snapshot = cellSnapshot(cell);
    expect(snapshot.crops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stackable: item, amount: 1 }),
      ])
    );
    render(
      <ReferenceContext.Provider
        value={{
          entries: {},
          features: { plants: { kind: "feature", href: "plants.html" } },
          link: (href: string, children: ReactNode) => (
            <a href={href}>{children}</a>
          ),
        }}
      >
        <CellReference cell={cell} />
      </ReferenceContext.Provider>
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      `plants.html#${anchor}`
    );
    expect(screen.getByLabelText(label)).toHaveClass("Pixels");
    expect(screen.getByRole("link")).toHaveTextContent(label);
    expect(screen.queryByText(cell)).not.toBeInTheDocument();
  }
);

test("every natural plant pickup cell has a readable reference", () => {
  for (const family of worldPlantGroups())
    for (const [index, plant] of family.plants.entries()) {
      if (!plant.crops.length) continue;
      const cell = family.cells[index];
      const view = renderToStaticMarkup(<CellReference cell={cell} />);
      expect(view).toContain('class="Pixels');
      expect(view).not.toContain("undefined");
      expect(view).not.toContain(cell);
    }
});
