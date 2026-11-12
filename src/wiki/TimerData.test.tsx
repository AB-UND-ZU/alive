import { render, screen } from "@testing-library/react";
import { TimerData } from "./Widgets";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

test("timers show the world reference and each haste from minus one through five", () => {
  render(<TimerData />);
  const text = screen.getByRole("table").textContent!;
  expect(text).toContain("World reference");
  expect(text.match(/350 ms/g)).toHaveLength(2);
  for (const interval of [300, 266, 242, 225, 211, 200])
    expect(text).toContain(`${interval} ms`);
  expect(text).toContain("Haste");
  expect(text).not.toContain("Base");
});
