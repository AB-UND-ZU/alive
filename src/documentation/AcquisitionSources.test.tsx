import { render, screen, within, cleanup } from "@testing-library/react";
import { AcquisitionSources } from "./AcquisitionSources";
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

test("one Drop frame lists every native coin-producing unit without summaries or probability headings", () => {
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
    .map(([key]) => key);
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
  expect(screen.getByLabelText("Shops")).toHaveTextContent(
    "2Coin (Buy)1Coin (Sell)"
  );
  cleanup();
  renderSources({ stackable: "salmon" });
  const fishing = screen.getByLabelText("Fishing");
  for (const chance of [54, 30, 14])
    expect(fishing).toHaveTextContent(`${chance}%`);
  expect(fishing).toHaveTextContent("1Fishing");
  expect(fishing).toHaveTextContent("2Fishing");
  expect(fishing).toHaveTextContent("3Fishing");
});
