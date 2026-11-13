import { createPopup, openPopup } from "../../engine/systems/popup";
import { POPUP } from "../../engine/components/popup";
import { rerenderEntity } from "../../engine/systems/renderer";
import { advance, assertHero, createAreaWorld } from "../../testing/harness";
import { STATS } from "../../engine/components/stats";
import { FOG } from "../../engine/components/fog";
import { colors } from "../../game/assets/colors";
import { getTerminalFrame, getTerminalLayout, getPauseActions } from ".";
import { frameToText } from "./frame";

const setup = () => {
  const world = createAreaWorld(`
|       |
|   ♀   |
|       |
`);
  return { world, hero: assertHero(world) };
};

it("shows current and maximum player stats without exposing an infinite XP limit", () => {
  const { world, hero } = setup();
  Object.assign(hero[STATS]!, {
    hp: 12,
    maxHp: 25,
    mp: 3,
    maxMp: 10,
    xp: 5,
    maxXp: Infinity,
  });
  const frame = getTerminalFrame(world, 80, 30);
  const lines = frameToText(frame).split("\n");
  expect(lines[0]).toContain("12/25  ♥HP");
  expect(lines[1]).toContain("3/10  ♦MP");
  expect(lines[2]).toMatch(/5 +[·x]XP/);
  expect(frameToText(frame)).not.toContain("Infinity");
  expect(
    frame[0]
      .filter((cell) => /[0-9♥HP/]/.test(cell.char))
      .every((cell) => cell.foreground === colors.red)
  ).toBe(true);
  expect(frame).toHaveLength(30);
  expect(frame.every((row) => row.length === 80)).toBe(true);
});

it("keeps the player hidden in fog even without lights or shadows", () => {
  const { world, hero } = setup();
  hero[FOG]!.visibility = "visible";
  expect(frameToText(getTerminalFrame(world, 33, 24))).toContain("♀");
  hero[FOG]!.visibility = "fog";
  expect(frameToText(getTerminalFrame(world, 33, 24))).not.toContain("♀");
});

it("centers a bounded game viewport inside full-width terminal chrome", () => {
  const { world } = setup();
  expect(getTerminalLayout(80, 40)).toEqual({
    width: 65,
    height: 26,
    left: 7,
    top: 7,
  });
  const rows = frameToText(getTerminalFrame(world, 80, 40)).split("\n");
  expect(rows[3]).toBe("─".repeat(80));
  expect(rows[36]).toBe("─".repeat(80));
  expect(rows[7][7]).toBe("│");
  expect(rows[7][71]).toBe("│");
});

it("renders the game's pause actions and saved-game name with an inverted selection", () => {
  const { world } = setup();
  const frame = getTerminalFrame(world, 80, 40, undefined, {
    paused: true,
    selection: 0,
    saveName: "20261114-123000",
  });
  const text = frameToText(frame);
  expect(getPauseActions(world).map((action) => action.name)).toEqual([
    "RESUME",
    "MENU",
    "SAVE",
  ]);
  expect(text).toContain("[RESUME]");
  expect(text).toMatch(/\[ +MENU/);
  expect(text).toMatch(/\[ +SAVE/);
  expect(text).toContain("20261114-123000");
  const resume = frame.find((row) =>
    row
      .map((cell) => cell.char)
      .join("")
      .includes("[RESUME]")
  )!;
  const selected = resume.find((cell) => cell.char === "R")!;
  expect(selected.foreground).toBe(colors.white);
  expect(selected.background).toBe(colors.green);
});

it.each([33, 80])(
  "brackets complete dialog tab names without covering close at %i columns",
  (columns) => {
    const world = createAreaWorld("| ♀ |", { level: "LEVEL_MENU", size: 64 });
    const hero = assertHero(world);
    createPopup(world, hero, { tabs: ["class", "style", "warp"] });
    openPopup(world, hero, hero);
    advance(world, 1000);
    const read = () => getTerminalFrame(world, columns, 30);
    const header = (frame: ReturnType<typeof read>) =>
      frame.find((row) =>
        row
          .map((cell) => cell.char)
          .join("")
          .includes("[CLASS]")
      )!;
    let row = header(read());
    expect(row).toBeDefined();
    expect(row.map((cell) => cell.char).join("")).toContain(
      "[CLASS] [STYLE] [LEVEL][·]"
    );
    const classStart = row.findIndex((cell) => cell.char === "C");
    expect(row[classStart]).toMatchObject({
      foreground: colors.black,
      background: colors.white,
    });
    hero[POPUP]!.horizontalIndex = 1;
    rerenderEntity(world, hero);
    advance(world, 100);
    row = header(read());
    const styleStart =
      row
        .map((cell) => cell.char)
        .join("")
        .indexOf("[STYLE]") + 1;
    expect(row[styleStart]).toMatchObject({
      foreground: colors.black,
      background: colors.white,
    });
    expect(row[classStart].foreground).toBe(colors.white);
  }
);
