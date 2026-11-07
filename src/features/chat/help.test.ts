import { createAreaWorld } from "../../testing/harness";
import { getDialog, say, setupHero } from "./helpers";
import { recordMessages } from "../items/helpers";

jest.mock("../../engine/utils", () => ({
  ...jest.requireActual("../../engine/utils"),
  TEST_MODE: true,
}));

const area = `
|     |
| ♀   |
|     |
`;

const setup = () => {
  const world = createAreaWorld(area);
  return { world, hero: setupHero(world) };
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("help command", () => {
  it.each([
    ["/help", "/list│/help [cmd]"],
    ["/h", "/list│/help [cmd]"],
    ["/help give", "/give <item> [num] [mat] [ele]"],
    ["/help n", "/new [cell] [num] [dir]"],
    ["/help fly", 'No command "fly"!'],
    ["/fly", "/list│/help [cmd]"],
    ["/help give stat", "/list│/help [cmd]"],
  ])("answers %s", (command, answer) => {
    const { world, hero } = setup();

    say(world, command);

    expect(getDialog(hero)).toEqual([answer]);
  });
});

describe("list command", () => {
  const list = (command: string) => {
    const { world, hero } = setup();
    const messages = recordMessages();
    say(world, command);
    return {
      lines: messages.map((message) => message.trim()),
      dialog: getDialog(hero),
    };
  };

  it("lists all commands with their short form", () => {
    const { lines } = list("/list");

    expect(lines).toHaveLength(10);
    expect(lines).toContain("/give│/g");
    expect(lines).toContain("/tp│/t");
  });

  it("lists all lists", () => {
    const { lines } = list("/l list");

    expect(lines).toEqual([
      "/list cast",
      "/list cell",
      "/list cmd",
      "/list id",
      "/list item",
      "/list list",
      "/list mod",
      "/list stat",
    ]);
  });

  it("lists all mods", () => {
    const { lines } = list("/list mod");

    expect(lines).toEqual([
      "/mod fly",
      "/mod god",
      "/mod pve",
      "/mod pvp",
      "/mod swim",
      "/mod walk",
    ]);
  });

  it.each([
    ["/list cell", ["tree", "water", "dummy"]],
    ["/list item", [expect.stringMatching(/^sword│/)]],
    ["/list id", ["hero"]],
    [
      "/list stat",
      [expect.stringMatching(/^hp│/), expect.stringMatching(/^dummy│/)],
    ],
    [
      "/list cast",
      [expect.stringMatching(/^beam│/), expect.stringMatching(/^spear│/)],
    ],
  ])("shows the entries of %s", (command, expected) => {
    expect(list(command).lines).toEqual(expect.arrayContaining(expected));
  });

  it("lists no skills that can't be cast", () => {
    expect(list("/list cast").lines).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^(zap|block)│/)])
    );
  });

  it("rejects an unknown list", () => {
    const { lines, dialog } = list("/list fish");

    expect(lines).toEqual([]);
    expect(dialog).toEqual(['No list "fish"!']);
  });
});
