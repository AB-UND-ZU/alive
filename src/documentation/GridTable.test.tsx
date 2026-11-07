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

describe("documentation tables", () => {
  it("omits empty data rows while retaining zero stats and command values", () => {
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
    ).toEqual(["Armor", "Command"]);
    expect(screen.getByRole("cell", { name: "0" })).toBeInTheDocument();
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
    const row = screen
      .getAllByRole("row")
      .find((candidate) => candidate.textContent === "Armor2")!;
    const cells = within(row).getAllByRole("cell");
    expect(cells.map((cell) => cell.textContent)).toEqual(["", "2"]);
    expect(row.textContent).not.toContain("None");
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
  expect(
    screen.getByText((_, element) => element?.className === "Text LinkText")
  ).toHaveTextContent("Max HP");
  const space = screen.getByText(" ", { normalizer: (value) => value });
  expect(space.textContent).toBe(" ");
  expect(space.style.backgroundColor).toBe("rgb(192, 192, 192)");
  expect(space.style.maskImage).toContain("data:image/svg+xml");
});
