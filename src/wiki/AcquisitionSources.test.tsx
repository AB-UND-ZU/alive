/* eslint-disable testing-library/no-node-access -- scope prices and fishing chances to their displayed row */
import { render, screen, within, cleanup } from "@testing-library/react";
import { AcquisitionSources } from "./AcquisitionSources";
import { readRows } from "../components/Controls/testing";
import { ReferenceContext } from "./references";
import { unitDefinitions } from "../game/balancing/units";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterEach(cleanup);
const renderSources = (
  item: Parameters<typeof AcquisitionSources>[0]["item"]
) =>
  render(
    <ReferenceContext.Provider
      value={{
        entries: Object.fromEntries(
          Object.keys(unitDefinitions).map((key) => [
            `unit:${key}`,
            { kind: "unit" as const, href: `/units.html#${key}` },
          ])
        ),
        link: (href, children) => <a href={href}>{children}</a>,
      }}
    >
      <AcquisitionSources item={item} />
    </ReferenceContext.Provider>
  );

test("one Drop frame lists coin sources with bosses owning their reward chests", () => {
  renderSources({ stackable: "coin" });
  const frame = screen.getByLabelText("Drop");
  const links = within(frame).getAllByRole("link");
  const expected = Object.entries(unitDefinitions)
    .filter(([, unit]) =>
      unit.drops.some(
        (bundle) =>
          bundle.chance > 0 &&
          bundle.items.some(
            (item) => item.stackable === "coin" && item.amount > 0
          )
      )
    )
    .map(
      ([key]) =>
        ((
          { ilexChest: "ilexElite", oakChest: "oakBoss" } as Record<
            string,
            string
          >
        )[key] || key)
    );
  expect(links).toHaveLength(expected.length);
  for (const key of expected)
    expect(
      links.some((link) => link.getAttribute("href") === `/units.html#${key}`)
    ).toBe(true);
  expect(frame).not.toHaveTextContent("Most enemies");
  expect(frame).not.toHaveTextContent("%");
});
test("Shops show both native prices and Fishing shows every supported level chance", () => {
  renderSources({ stackable: "ore" });
  const shops = within(screen.getByLabelText("Shops"));
  for (const [label, amount] of [
    ["(Buy)", "2"],
    ["(Sell)", "1"],
  ]) {
    const price = within(shops.getByText(label).closest("div")!);
    expect(price.getByText(amount)).toBeInTheDocument();
    expect(price.getByText("Coin")).toBeInTheDocument();
  }
  cleanup();
  renderSources({ stackable: "salmon" });
  const fishing = screen.getByLabelText("Fishing");
  for (const [index, chance] of [54, 30, 14].entries()) {
    const row = within(fishing).getByText(String(chance)).closest("div")!;
    expect(row).toHaveTextContent(`${chance}%`);
    expect(within(row).getByText("Fishing")).toBeInTheDocument();
    expect(readRows(row)[0]).toMatch(new RegExp(`^${index + 1}`));
  }
});
