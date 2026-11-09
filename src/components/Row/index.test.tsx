import { renderToStaticMarkup } from "react-dom/server";
import Row from "./index";
import { createText } from "../../game/assets/ui";
import { colors } from "../../game/assets/colors";

test("text fills one logical cell per character", () => {
  const view = renderToStaticMarkup(<Row cells={createText("Bag")} />);
  expect(view.match(/class="Cell"/g)).toHaveLength(3);
  for (const letter of "Bag") expect(view).toContain(`>${letter}</span>`);
});

test("sprite layers retain their order and colors", () => {
  const view = renderToStaticMarkup(
    <Row
      cells={[
        {
          name: "layered",
          layers: [
            { char: "▀", color: colors.red },
            { char: "▄", color: colors.blue },
          ],
        },
      ]}
    />
  );
  expect(view).toContain("color:#ff0000");
  expect(view).toContain("color:#0000ff");
  expect(view.indexOf("▀")).toBeLessThan(view.indexOf("▄"));
});

test("stack dots show amounts above one and stop at ten", () => {
  const sprite = createText("A")[0];
  const view = renderToStaticMarkup(
    <Row cells={[{ ...sprite, stackableAmount: 1 }]} />
  );
  const utils = renderToStaticMarkup(
    <Row cells={[{ ...sprite, stackableAmount: 25 }]} />
  );
  expect(view).not.toContain('class="Dot"');
  expect(utils.match(/class="Dot"/g)).toHaveLength(10);
});
