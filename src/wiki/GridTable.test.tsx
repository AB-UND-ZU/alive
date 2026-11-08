import { render, screen, within } from "@testing-library/react";
import { GridTable } from "./GridTable";
import { LinkStyleContext, Text } from "./visuals";
import { colors } from "../game/assets/colors";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("wiki tables", () => {
  it("uses white text for composed header labels and preserves their line break", () => {
    render(
      <GridTable
        headers={["Element", <Text>{"Sword\nEffect"}</Text>]}
        rows={[["Fire", "Burns"]]}
      />
    );
    const header = screen.getByRole("columnheader", { name: /Sword\s+Effect/ });
    expect(header).toHaveTextContent("Sword Effect");
    expect(within(header).getByText("Sword Effect")).toHaveStyle({
      color: colors.white,
    });
  });
  it("omits empty and zero data rows while retaining literal command values", () => {
    render(
      <GridTable
        headers={["Property", "Value"]}
        rows={[
          ["Armor", 0],
          ["Tool", "None"],
          ["Spell", null],
          ["Command", "none"],
        ]}
      />
    );
    expect(
      screen.getAllByRole("rowheader").map((cell) => cell.textContent)
    ).toEqual(["Command"]);
    expect(screen.queryByRole("cell", { name: "0" })).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("cell").map((cell) => cell.textContent)
    ).toContain("none");
  });
  it("leaves an absent comparison cell blank when another variant has data", () => {
    render(
      <GridTable
        headers={["Property", "Wood", "Iron"]}
        rows={[["Armor", <Text>None</Text>, 2]]}
      />
    );
    const row = screen.getAllByRole("row").find((candidate) =>
      within(candidate)
        .queryAllByRole("rowheader")
        .some((cell) => cell.textContent === "Armor")
    )!;
    const cells = within(row).getAllByRole("cell");
    expect(cells.map((cell) => cell.textContent)).toEqual(["", "2"]);
    expect(row.textContent).not.toContain("None");
  });
  it("renders native unbounded counts in numeric comparison cells", () => {
    render(
      <GridTable
        headers={["Property", "Value"]}
        rows={[["Duration", Infinity]]}
      />
    );
    expect(screen.getByLabelText("99+")).toBeInTheDocument();
    expect(screen.queryByText("Infinity")).not.toBeInTheDocument();
  });
});

test("multiword links preserve selectable whitespace beneath the underline", () => {
  render(
    <LinkStyleContext.Provider
      value={{ linked: true, hovered: false, preserveColor: true }}
    >
      <Text color={colors.grey}>Max HP</Text>
    </LinkStyleContext.Provider>
  );
  const label = screen.getByText("Max HP");
  expect(label).toHaveClass("NativeText", "LinkText");
  expect(label.textContent).toBe("Max HP");
});
