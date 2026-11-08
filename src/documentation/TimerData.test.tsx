import { renderToStaticMarkup } from "react-dom/server";
import { TimerData } from "./Widgets";

test("timers show the world reference and each haste from minus one through five", () => {
  const text = renderToStaticMarkup(<TimerData />).replace(/<[^>]*>/g, "");
  expect(text).toContain("World reference");
  expect(text.match(/350 ms/g)).toHaveLength(2);
  for (const interval of [300, 266, 242, 225, 211, 200])
    expect(text).toContain(`${interval} ms`);
  expect(text).toContain("Haste");
  expect(text).not.toContain("Base");
});
