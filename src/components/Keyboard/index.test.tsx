/* eslint-disable testing-library/no-node-access, testing-library/no-container -- keys are drawn as glyph spans over one touch area */
import { fireEvent, render } from "@testing-library/react";
import { WorldProvider } from "../../bindings/hooks";
import { createWorldContext } from "../../testing/render";
import Keyboard, {
  getIndexFromKey,
  getKeyFromIndex,
  keyboardKeys,
  keyboardPages,
  keyboardSize,
} from ".";
import { World } from "../../engine";
import { colors } from "../../game/assets/colors";
import { POPUP } from "../../engine/components/popup";
import { getTab, getTabSelections } from "../../engine/systems/popup";
import { assertIdentifierAndComponents } from "../../engine/utils";
import { act as perform, createAreaWorld, step } from "../../testing/harness";
import { readCells, renderHud, showsLayers } from "../Controls/testing";
import { parseSprite } from "../../game/assets/ui";

const width = 210;
const height = 120;
const columnWidth = 20;
const rowHeight = 40;

const getMenu = (world: World) =>
  assertIdentifierAndComponents(world, "use", [POPUP]);

const setup = (paused = false) => {
  const world = createAreaWorld(`|   ♀   |`);
  step(world, 5);
  perform(world, "chat");
  step(world, 15);
  const view = renderHud(world, <Keyboard />, { paused });
  const keyboard = view.container.querySelector("#keyboard") as HTMLElement;
  Object.defineProperty(keyboard, "offsetWidth", { value: width });
  Object.defineProperty(keyboard, "offsetHeight", { value: height });

  /** Tap a key by its row and its position among the keys of the row. */
  const tap = (row: number, column: number, advance = true) => {
    fireEvent.click(keyboard, {
      clientX: columnWidth / 4 + (column + 0.5) * columnWidth,
      clientY: row * rowHeight + rowHeight * 0.375,
    });
    if (advance) view.tick(2);
  };

  const tapAt = (clientX: number, clientY: number) => {
    fireEvent.click(keyboard, { clientX, clientY });
    view.tick(2);
  };

  const typed = () =>
    getTabSelections(world, getMenu(world)).map(getKeyFromIndex).join("");

  const expectKeys = (row: number, text: string) => {
    const renderedRow = view.container.querySelectorAll(
      ".KeyboardOverlay > .Row"
    )[row * 2];
    const cells = readCells(renderedRow);
    [...text].forEach((char, column) => {
      const { element, index } = cells[(row === 2 ? 3 : 1) + column * 2];
      expect(
        showsLayers(element, parseSprite(`\x0f█\x00${char}`).layers, index)
      ).toBe(true);
    });
  };

  return { world, tap, tapAt, typed, expectKeys, ...view };
};

// the bottom row starts with the shift key and ends with the page key
const letter = (row: number, column: number) => [
  row,
  row === 2 ? column + 1 : column,
];
const shiftKey = [2, 0] as const;
const pageKey = [2, 9] as const;
const deleteKey = [1, 9] as const;
const spaceKey = letter(2, 7) as [number, number];

describe("on-screen keyboard", () => {
  it("shows the lowercase letters first", () => {
    const { expectKeys } = setup();

    expectKeys(0, "qwertyuiop");
    expectKeys(2, "zxcvbnm");
  });

  it.each([
    [0, 0, colors.white],
    [1, 9, colors.red],
    [2, 0, colors.lime],
    [2, 9, colors.lime],
    [2, 8, colors.white],
  ] as const)(
    "uses stacked half-blocks and matching edges at %i,%i",
    (row, column, color) => {
      const { container, typed } = setup();
      const keyboard = container.querySelector("#keyboard")!;
      const rows = container.querySelectorAll(".KeyboardOverlay > .Row");
      const index = column * 2 + 1;
      const pixel = (cell: Element, x: number, y: number) =>
        Array.from(cell.querySelectorAll("svg rect"))
          .find(
            (rect) =>
              x >= Number(rect.getAttribute("x")) &&
              x <
                Number(rect.getAttribute("x")) +
                  Number(rect.getAttribute("width")) &&
              y >= Number(rect.getAttribute("y")) &&
              y <
                Number(rect.getAttribute("y")) +
                  Number(rect.getAttribute("height"))
          )
          ?.getAttribute("fill");
      const untouched = (cells: HTMLCollection) =>
        [0, 1, 2, 3].flatMap((x) =>
          [0, 4, 9, 15].map((y) => [
            pixel(cells[index - 1], x, y),
            pixel(cells[index + 1], 8 - x, y),
          ])
        );
      const topEdges = untouched(rows[row * 2].children);
      const bottomEdges = untouched(rows[row * 2 + 1].children);
      fireEvent(
        keyboard,
        new MouseEvent("pointerdown", {
          bubbles: true,
          button: 0,
          clientX: columnWidth / 4 + (column + 0.5) * columnWidth,
          clientY: row * rowHeight + rowHeight * 0.375,
        })
      );
      expect(
        container.querySelectorAll(".KeyboardOverlay > .Row")
      ).toHaveLength(6);
      expect(
        showsLayers(rows[row * 2].children[index], [
          { char: "█", color },
          { char: "▀", color: colors.grey },
        ])
      ).toBe(true);
      expect(
        showsLayers(rows[row * 2 + 1].children[index], [
          { char: "█", color },
          { char: "▄", color: colors.black },
        ])
      ).toBe(true);
      expect(pixel(rows[row * 2].children[index - 1], 8, 0)).toBe(colors.grey);
      expect(pixel(rows[row * 2].children[index + 1], 0, 0)).toBe(colors.grey);
      expect(untouched(rows[row * 2].children)).toEqual(topEdges);
      expect(untouched(rows[row * 2 + 1].children)).toEqual(bottomEdges);
      expect(typed()).toBe("");
      fireEvent(keyboard, new MouseEvent("pointerup", { bubbles: true }));
      expect(pixel(rows[row * 2].children[index - 1], 8, 0)).toBe(color);
    }
  );

  it.each(["pointercancel", "pointerout", "blur"])(
    "restores the key on %s",
    (event) => {
      const { container, typed } = setup();
      const keyboard = container.querySelector("#keyboard")!;
      const face = container.querySelector(".KeyboardOverlay > .Row")!
        .children[1];
      fireEvent(
        keyboard,
        new MouseEvent("pointerdown", {
          bubbles: true,
          button: 0,
          clientX: 15,
          clientY: 15,
        })
      );
      expect(face.getAttribute("data-glyph")).toBe("▀");
      fireEvent(
        event === "blur" ? window : keyboard,
        new MouseEvent(event, { bubbles: true, relatedTarget: document.body })
      );
      expect(showsLayers(face, parseSprite("\x0f█\x00q").layers)).toBe(true);
      expect(typed()).toBe("");
    }
  );

  it("types tapped letters into the chat", () => {
    const { world, tap, typed } = setup();
    expect(getTab(world, getMenu(world))).toBe("chat");

    tap(...(letter(1, 5) as [number, number]));
    tap(...(letter(0, 7) as [number, number]));

    expect(typed()).toBe("hi");
  });

  it("accepts the first tap before a render notification arrives", () => {
    const { world, unmount } = setup();
    unmount();
    const view = render(
      <WorldProvider value={createWorldContext(world)}>
        <Keyboard />
      </WorldProvider>
    );
    const keyboard = view.container.querySelector("#keyboard") as HTMLElement;
    Object.defineProperty(keyboard, "offsetWidth", { value: width });
    Object.defineProperty(keyboard, "offsetHeight", { value: height });
    fireEvent.click(keyboard, { clientX: 115, clientY: 55 });
    expect(
      getTabSelections(world, getMenu(world)).map(getKeyFromIndex).join("")
    ).toBe("h");
  });

  it("keeps rapid taps and deletes before the next game update", () => {
    const { tap, typed } = setup();
    tap(1, 5, false);
    tap(0, 7, false);
    tap(0, 7, false);
    tap(...deleteKey, false);
    expect(typed()).toBe("hi");
  });

  it("types letters of the bottom row and a space", () => {
    const { tap, typed } = setup();

    tap(...(letter(2, 0) as [number, number]));
    tap(...spaceKey);
    tap(...(letter(2, 6) as [number, number]));

    expect(typed()).toBe("z m");
  });

  it("deletes the last letter", () => {
    const { tap, typed } = setup();
    tap(0, 0);
    tap(0, 1);

    tap(...deleteKey);

    expect(typed()).toBe("q");
  });

  it("shift switches to uppercase letters and back", () => {
    const { tap, typed, expectKeys } = setup();

    tap(...shiftKey);
    expectKeys(0, "QWERTY");
    tap(0, 0);

    tap(...shiftKey);
    expectKeys(0, "qwerty");
    tap(0, 0);

    expect(typed()).toBe("Qq");
  });

  it("the page key switches to numbers and the special page", () => {
    const { tap, typed, expectKeys } = setup();

    tap(...pageKey);
    expectKeys(0, "1234567890");
    tap(0, 0);

    tap(...shiftKey);
    expectKeys(0, "[]{}");
    tap(0, 4);

    tap(...pageKey);
    expectKeys(0, "qwerty");
    tap(0, 0);

    expect(typed()).toBe("1#q");
  });

  it("ignores taps between rows and beside the keys", () => {
    const { tapAt, typed } = setup();

    tapAt(15, rowHeight * 0.9);
    tapAt(2, 15);
    tapAt(width - 1, 15);

    expect(typed()).toBe("");
  });

  it("ignores taps while paused", () => {
    const { tap, typed } = setup(true);

    tap(0, 0);

    expect(typed()).toBe("");
  });
});

describe("keyboard layout", () => {
  it("maps every key to its index and back", () => {
    keyboardPages.forEach((page, pageIndex) =>
      keyboardKeys[page].forEach((row, rowIndex) =>
        row.forEach((key, columnIndex) => {
          const position = getIndexFromKey(key);
          if (!position) throw new Error(`Key "${key}" not found`);
          const index =
            position.tab * keyboardSize +
            position.offset * 10 +
            position.content;

          expect(getKeyFromIndex(index)).toBe(
            rowIndex === 2 && columnIndex === 7 && pageIndex < 2 ? " " : key
          );
        })
      )
    );
  });

  it("maps space to the lowercase space key", () => {
    expect(getIndexFromKey(" ")).toEqual({ tab: 0, offset: 2, content: 7 });
    expect(getKeyFromIndex(27)).toBe(" ");
  });

  it("doesn't map unknown keys", () => {
    expect(getIndexFromKey("€")).toBeUndefined();
  });
});
