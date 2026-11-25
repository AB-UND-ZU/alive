import { renderToStaticMarkup } from "react-dom/server";
import Row from "./index";
import { characterImage } from "./characters";
import { createText } from "../../game/assets/ui";
import { colors } from "../../game/assets/colors";

test("text fills one logical cell per character", () => {
  const view = renderToStaticMarkup(<Row cells={createText("Bag")} />);
  expect(view.match(/class="Cell"/g)).toHaveLength(3);
  for (const letter of "Bag") expect(view).toContain(`>${letter}</span>`);
});

it("keeps dialog text and spaces in the DOM on a solid background", () => {
  const element = document.createElement("div");
  element.innerHTML = renderToStaticMarkup(
    <Row cells={createText("Loading map...", colors.black, colors.white)} />
  );
  expect(element.textContent).toBe("Loading map...");
  expect(element.querySelector("img")).toBeNull();
  expect(element.querySelector(".Cell")).toHaveStyle({
    backgroundColor: colors.white,
  });
});

test("layered sprites resolve covered pixels into one graphic", () => {
  const view = renderToStaticMarkup(
    <Row
      cells={[
        {
          name: "layered",
          layers: [
            { char: "█", color: colors.red },
            { char: "█", color: colors.blue },
          ],
        },
      ]}
    />
  );
  expect(view.match(/<img/g)).toHaveLength(1);
  expect(view).not.toContain('class="Layer"');
  expect(decodeURIComponent(view)).not.toContain('fill="#ff0000"');
  expect(decodeURIComponent(view)).toContain('fill="#0000ff"');
});

test("stack dots show amounts above one and stop at ten", () => {
  const sprite = createText("A")[0];
  const view = renderToStaticMarkup(
    <Row cells={[{ ...sprite, stackableAmount: 1 }]} />
  );
  const utils = renderToStaticMarkup(
    <Row cells={[{ ...sprite, stackableAmount: 25 }]} />
  );
  expect(view).not.toContain("<img");
  expect(utils).toContain(characterImage(sprite.layers, 10));
});

test("native sprites remain inside their paragraph when serialized and parsed", () => {
  const element = document.createElement("div");
  element.innerHTML = renderToStaticMarkup(
    <p>
      <Row cells={createText("Bag")} />
    </p>
  );
  expect(element.textContent).toBe("Bag");
  expect(element.children).toHaveLength(1);
  expect(element.firstElementChild!.tagName).toBe("P");
  expect(element.firstElementChild!.querySelectorAll(".Cell")).toHaveLength(3);
  expect(element.firstElementChild!.querySelector("div")).toBeNull();
});
