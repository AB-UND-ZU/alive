import { renderToStaticMarkup } from "react-dom/server";
import Row from "./index";
import { createText, shaded } from "../../game/assets/ui";
import { heart, mapDiscovery } from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
const text = (view: string) => view.replace(/<[^>]*>/g, "");
test("a plain sentence is one selectable font run", () => {
  const sentence = "Walk through the Dungeon.";
  const view = renderToStaticMarkup(<Row cells={createText(sentence)} />);
  expect(text(view)).toBe(sentence);
  expect(view).toContain(`data-cells="${sentence.length}"`);
  expect(view.match(/class="Cell /g)).toHaveLength(1);
  expect(view).not.toContain("svg");
});
test("background shading does not split a selectable word into letters", () => {
  const view = renderToStaticMarkup(
    <Row cells={shaded(createText("Inventory"), colors.green, "▄")} />
  );
  expect(text(view)).toBe("Inventory");
  expect(view).toContain(`data-underlay="${"▄".repeat(9)}"`);
  expect(view.match(/class="Cell /g)).toHaveLength(1);
});
test("native and composed icons add no fallback characters to copied text", () => {
  const view = renderToStaticMarkup(
    <Row cells={[heart, mapDiscovery, ...createText("HP")]} />
  );
  expect(text(view)).toBe("HP");
  expect(view.match(/<img/g)).toHaveLength(1);
  expect(view.match(/data-glyph=/g)).toHaveLength(1);
});

test("stacked sprite pixels are resolved into one graphic per cell", () => {
  const sprite = {
    name: "pixel_pair",
    layers: [
      { char: "▀", color: colors.red },
      { char: "▄", color: colors.blue },
    ],
  };
  const view = renderToStaticMarkup(<Row cells={[sprite, sprite]} />);
  expect(view.match(/<img/g)).toHaveLength(1);
  expect(decodeURIComponent(view)).toContain('fill="#ff0000"');
  expect(decodeURIComponent(view)).toContain('fill="#0000ff"');
  expect(text(view)).toBe("");
});

test("block art keeps real characters available for copying", () => {
  const view = renderToStaticMarkup(<Row cells={createText("Use ███ here")} />);
  expect(text(view)).toBe("Use ███ here");
  expect(view.match(/<img/g)).toHaveLength(1);
});
