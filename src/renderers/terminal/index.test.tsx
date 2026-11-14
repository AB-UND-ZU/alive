import { createPopup, openPopup } from "../../engine/systems/popup";
import { POPUP } from "../../engine/components/popup";
import { rerenderEntity } from "../../engine/systems/renderer";
import { advance, assertHero, createAreaWorld } from "../../testing/harness";
import { STATS } from "../../engine/components/stats";
import { FOG } from "../../engine/components/fog";
import { colors } from "../../game/assets/colors";
import { getTerminalFrame, getTerminalLayout, getPauseActions } from ".";
import { frameToText } from "./frame";
import { createCell } from "../../bindings/creation";
import { frameWidth } from "../../game/assets/utils";

const setup = () => {
  const world = createAreaWorld(
    `
|       |
|   ♀   |
|       |
`,
    { size: 64 }
  );
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
  expect(lines[0]).toMatch(/12\/25[ ░▀]{2}♥HP/);
  expect(lines[1]).toMatch(/3\/10[ ░▀]{2}♦MP/);
  expect(lines[2]).toMatch(/5[ ░▀]+xXP/);
  expect(lines[0].indexOf("HP")).toBe(lines[2].indexOf("XP"));
  expect(lines[1].indexOf("MP")).toBe(lines[2].indexOf("XP"));
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
    width: 33,
    height: 13,
    left: 23,
    top: 13,
  });
  const rows = frameToText(getTerminalFrame(world, 80, 40)).split("\n");
  expect(rows[3]).toBe("─".repeat(80));
  expect(rows[36]).toBe("─".repeat(80));
  expect(rows[13][23]).toBe("│");
  expect(rows[13][55]).toBe("│");
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
  "fits five-cell tabs and close inside the warp dialog at %i columns",
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
          .includes("[CLA]")
      )!;
    let row = header(read());
    expect(row).toBeDefined();
    expect(row.map((cell) => cell.char).join("")).toContain(
      "[CLA][STY][LEV]═[X]"
    );
    const text = row.map((cell) => cell.char).join("");
    const frame = read();
    const bottom = frame.find((line) =>
      line.some((cell) => cell.char === "╚")
    )!;
    const left = bottom.findIndex((cell) => cell.char === "╚");
    const right = left + frameWidth - 1;
    expect(text.indexOf("[CLA]")).toBe(left);
    expect(text.indexOf("[X]") + 2).toBe(right);
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
        .indexOf("[STY]") + 1;
    expect(row[styleStart]).toMatchObject({
      foreground: colors.black,
      background: colors.white,
    });
    expect(row[classStart].foreground).toBe(colors.white);
  }
);

it("retains the pause title's literal upper and lower blocks", () => {
  const { world } = setup();
  const text = frameToText(
    getTerminalFrame(world, 80, 40, undefined, {
      paused: true,
    })
  );
  expect(text).toContain("█▀▄ █▀▄ █ █ ▄▀▀ ▄▀▀");
  expect(text).toContain("█▄█ █▄█ █ █ █▄▄ █▄▄");
});

it("keeps the underlying cell palette when shading a paused world", () => {
  const { world } = setup();
  const active = getTerminalFrame(world, 80, 40);
  const paused = getTerminalFrame(world, 80, 40, undefined, { paused: true });
  const { left, top } = getTerminalLayout(80, 40);
  const source = active[top][left + 1];
  expect(paused[top][left + 1]).toEqual({
    char: "▓",
    foreground:
      source.background && source.background !== colors.black
        ? source.background
        : source.foreground,
    background: colors.black,
  });
});

it("shows quest targets, gathered items and rewards through dialog masks", () => {
  const { world, hero } = setup();
  createPopup(world, hero, {
    tabs: ["quest"],
    lines: [[]],
    targets: [{ unit: "chick", amount: 3 }],
    deals: [
      {
        item: { stackable: "coin", amount: 5 },
        stock: 1,
        prices: [{ stackable: "stick", amount: 2 }],
      },
    ],
  });
  openPopup(world, hero, hero);
  advance(world, 2000);
  const text = frameToText(getTerminalFrame(world, 80, 40));
  expect(text).toContain("Defeat");
  expect(text).toContain("0/3");
  expect(text).toContain("Gather");
  expect(text).toContain("Stick");
});

it("renders the portal's world-map terrain and selected level", () => {
  const { world, hero } = setup();
  const portal = createCell(
    world,
    { ...hero.POSITION! },
    "portal",
    "visible"
  ).cell;
  openPopup(world, hero, portal);
  portal[POPUP]!.verticalIndezes[0] = 8;
  rerenderEntity(world, portal);
  advance(world, 2000);
  const frame = getTerminalFrame(world, 80, 40);
  expect(frameToText(frame)).toContain("Dungeon");
  expect(frameToText(frame)).toContain("∩");
  expect(
    frame
      .flat()
      .some(
        (cell) =>
          cell.char === "░" &&
          [colors.navy, colors.blue].includes(cell.foreground)
      )
  ).toBe(true);
});

it("keeps the normal menu HUD empty apart from pause", () => {
  const world = createAreaWorld("| ♀ |", { level: "LEVEL_MENU", size: 64 });
  const text = frameToText(getTerminalFrame(world, 80, 40));
  expect(text).not.toContain("HP");
  expect(text).not.toContain("XP");
  expect(text).not.toContain("SPACE");
  expect(text).toContain("[║]");
});
