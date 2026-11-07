/* eslint-disable testing-library/no-node-access, testing-library/no-container -- keys are drawn as glyph spans over one touch area */
import { fireEvent } from "@testing-library/react";
import Keyboard, {
  getIndexFromKey,
  getKeyFromIndex,
  keyboardKeys,
  keyboardPages,
  keyboardSize,
} from ".";
import { World } from "../../engine";
import { POPUP } from "../../engine/components/popup";
import { getTab, getTabSelections } from "../../engine/systems/popup";
import { assertIdentifierAndComponents } from "../../engine/utils";
import { act as perform, createAreaWorld, step } from "../../testing/harness";
import { readRows, renderHud } from "../Controls/testing";

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
  const tap = (row: number, column: number) => {
    fireEvent.click(keyboard, {
      clientX: columnWidth / 4 + (column + 0.5) * columnWidth,
      clientY: row * rowHeight + rowHeight * 0.375,
    });
    view.tick(2);
  };

  const tapAt = (clientX: number, clientY: number) => {
    fireEvent.click(keyboard, { clientX, clientY });
    view.tick(2);
  };

  const typed = () =>
    getTabSelections(world, getMenu(world)).map(getKeyFromIndex).join("");

  const keys = () => readRows(view.container).join("\n");

  return { world, tap, tapAt, typed, keys, ...view };
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
    const { keys } = setup();

    expect(keys()).toMatch(/q.w.e.r.t.y.u.i.o.p/);
    expect(keys()).toMatch(/z.x.c.v.b.n.m/);
  });

  it("types tapped letters into the chat", () => {
    const { world, tap, typed } = setup();
    expect(getTab(world, getMenu(world))).toBe("chat");

    tap(...(letter(1, 5) as [number, number]));
    tap(...(letter(0, 7) as [number, number]));

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
    const { tap, typed, keys } = setup();

    tap(...shiftKey);
    expect(keys()).toMatch(/Q.W.E.R.T.Y/);
    tap(0, 0);

    tap(...shiftKey);
    expect(keys()).toMatch(/q.w.e.r.t.y/);
    tap(0, 0);

    expect(typed()).toBe("Qq");
  });

  it("the page key switches to numbers and the special page", () => {
    const { tap, typed, keys } = setup();

    tap(...pageKey);
    expect(keys()).toMatch(/1.2.3.4.5.6.7.8.9.0/);
    tap(0, 0);

    tap(...shiftKey);
    expect(keys()).toMatch(/\[.\].\{.\}/);
    tap(0, 4);

    tap(...pageKey);
    expect(keys()).toMatch(/q.w.e.r.t.y/);
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
