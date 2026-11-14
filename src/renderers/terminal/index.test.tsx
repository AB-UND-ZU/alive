import { createPopup, openPopup } from "../../engine/systems/popup";
import { POPUP } from "../../engine/components/popup";
import { rerenderEntity } from "../../engine/systems/renderer";
import { advance, assertHero, createAreaWorld } from "../../testing/harness";
import { STATS } from "../../engine/components/stats";
import { FOG } from "../../engine/components/fog";
import { colors } from "../../game/assets/colors";
import { getTerminalFrame, getTerminalLayout, getPauseActions } from ".";
import { frameToText } from "./frame";
import { projectSprite } from "./sprites";
import { createCell } from "../../bindings/creation";
import { getSequence } from "../../engine/systems/sequence";
import { getSceneFrame } from "../interface/frame";

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
  expect(
    frame
      .slice(0, 3)
      .flat()
      .some((cell) => "▀▄▌▐".includes(cell.char))
  ).toBe(false);
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
  expect(text).toContain(">[RESUME]");
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
  for (const label of ["MENU", "SAVE"]) {
    const row = frame.find((row) =>
      row
        .map((cell) => cell.char)
        .join("")
        .includes(label)
    )!;
    const start = row
      .map((cell) => cell.char)
      .join("")
      .indexOf(label);
    expect(row[start].background).toBe(colors.grey);
  }
});

it.each([33, 80])(
  "keeps complete five-letter tabs and close at the web positions at %i columns",
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
          .includes("CLASS")
      )!;
    let row = header(read());
    expect(row).toBeDefined();
    expect(row.map((cell) => cell.char).join("")).toContain(
      "[CLASS]STYLE|LEVEL[X]"
    );
    const text = row.map((cell) => cell.char).join("");
    const sequence = getSequence(world, hero, "popup")!;
    const source = getSceneFrame(
      world,
      getTerminalLayout(columns, 30).width,
      13,
      undefined,
      { instant: true }
    );
    const close = source.find(
      (entry) =>
        entry.particle ===
        world.getEntityById(sequence.particles["popup-close-1"])
    )!;
    const label = source.find(
      (entry) =>
        entry.particle ===
        world.getEntityById(sequence.particles["popup-tab-1"])
    )!;
    const offset = getTerminalLayout(columns, 30).left;
    expect(text.indexOf("CLASS")).toBe(Math.ceil(label.x) + offset);
    expect(text.indexOf("X")).toBe(Math.ceil(close.x) + offset);
    const classStart = row.findIndex((cell) => cell.char === "C");
    expect(row[classStart]).toMatchObject({
      foreground: colors.black,
      background: colors.white,
    });
    hero[POPUP]!.horizontalIndex = 1;
    rerenderEntity(world, hero);
    advance(world, 100);
    row = header(read());
    const styleStart = row
      .map((cell) => cell.char)
      .join("")
      .indexOf("STYLE");
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
    char: "░",
    foreground:
      source.background && source.background !== colors.black
        ? source.background
        : source.char === " "
        ? colors.black
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

it("keeps unavailable shop text and the material key visible", () => {
  const { world, hero } = setup();
  createPopup(world, hero, {
    tabs: ["buy"],
    deals: [
      {
        item: { consume: "key", material: "gold", amount: 1 },
        stock: 0,
        prices: [{ stackable: "coin", amount: 2 }],
      },
    ],
  });
  openPopup(world, hero, hero);
  advance(world, 2000);
  const frame = getTerminalFrame(world, 80, 40);
  const text = frameToText(frame);
  expect(text).toContain("Out of stock");
  expect(text).toContain("Key");
  expect(frame.flat()).toContainEqual(
    expect.objectContaining({ char: "╒", foreground: colors.yellow })
  );
});

it("shows a selected locked class on red rather than an underline", () => {
  const world = createAreaWorld("| ♀ |", { level: "LEVEL_MENU", size: 64 });
  const hero = assertHero(world);
  const portal = createCell(
    world,
    { ...hero.POSITION! },
    "portal",
    "visible"
  ).cell;
  openPopup(world, hero, portal);
  portal[POPUP]!.verticalIndezes[0] = 1;
  rerenderEntity(world, portal);
  advance(world, 2000);
  const frame = getTerminalFrame(world, 80, 40);
  const row = frame.find((row) =>
    row
      .map((cell) => cell.char)
      .join("")
      .includes("Knight")
  )!;
  expect(row).toBeDefined();
  const index = row
    .map((cell) => cell.char)
    .join("")
    .indexOf("Knight");
  expect(
    row.slice(index, index + 6).every((cell) => cell.background === colors.red)
  ).toBe(true);
});

it.each([33, 80])(
  "keeps pause shading between and beside its controls at %i columns",
  (columns) => {
    const { world } = setup();
    const rows = 30;
    const active = getTerminalFrame(world, columns, rows);
    const paused = getTerminalFrame(world, columns, rows, undefined, {
      paused: true,
    });
    const { top, height } = getTerminalLayout(columns, rows);
    const overlayTop = top + Math.floor((height - 10) / 2);
    const titleWidth = "█▀▄ █▀▄ █ █ ▄▀▀ ▄▀▀".length;
    const overlayLeft = Math.floor((columns - titleWidth) / 2);
    const buttonLeft = overlayLeft + Math.floor((titleWidth - 9) / 2);
    for (const [x, y] of [
      [buttonLeft - 1, overlayTop + 4],
      [Math.floor(columns / 2), overlayTop + 3],
    ]) {
      const source = active[y][x];
      expect(paused[y][x]).toEqual({
        char: "░",
        foreground:
          source.background && source.background !== colors.black
            ? source.background
            : source.char === " "
            ? colors.black
            : source.foreground,
        background: colors.black,
      });
    }
  }
);

it("does not add a bright pause shade to empty black ground", () => {
  const { world } = setup();
  world.metadata.visibleCells = new Set(
    Array.from({ length: 64 * 64 }, (_, index) => index)
  );
  for (const entity of world.getEntities([FOG]))
    entity[FOG].visibility = "visible";
  const columns = 80,
    rows = 30;
  const active = getTerminalFrame(world, columns, rows);
  const paused = getTerminalFrame(world, columns, rows, undefined, {
    paused: true,
  });
  const { left, top, width, height } = getTerminalLayout(columns, rows);
  const y = top + height - 1;
  const x = active[y].findIndex(
    (cell, index) =>
      index > left &&
      index < left + width - 1 &&
      cell.char === " " &&
      cell.background === colors.black
  );
  expect(x).toBeGreaterThan(left);
  expect(paused[y][x]).toMatchObject({
    foreground: colors.black,
    background: colors.black,
  });
  expect([" ", "░"]).toContain(paused[y][x].char);
});

it.each([33, 80])(
  "clears the old world and chrome while loading at %i columns",
  (columns) => {
    const { world } = setup();
    const frame = getTerminalFrame(world, columns, 30, undefined, {
      suspended: true,
    });
    expect(frameToText(frame).replace(/\s/g, "")).toBe("Loadingmap...");
    expect(
      frame
        .flat()
        .filter((cell) => cell.char !== " ")
        .every((cell) => cell.foreground === colors.white)
    ).toBe(true);
  }
);

it("uses a single white palette for the selected Save button and its brackets", () => {
  const { world } = setup();
  const frame = getTerminalFrame(world, 80, 30, undefined, {
    paused: true,
    selection: 2,
  });
  const row = frame.find((line) =>
    line
      .map((cell) => cell.char)
      .join("")

      .includes("[ SAVE ]")
  )!;
  const start = row
    .map((cell) => cell.char)
    .join("")

    .indexOf("[ SAVE ]");
  expect(
    row
      .slice(start, start + 8)
      .every(
        (cell) =>
          cell.foreground === colors.black && cell.background === colors.white
      )
  ).toBe(true);
});

it("fills the entire tab padding and keeps the outer brackets on inactive tabs", () => {
  const { world, hero } = setup();
  createPopup(world, hero, { tabs: ["class", "talk", "warp"] });
  openPopup(world, hero, hero);
  hero[POPUP]!.horizontalIndex = 1;
  advance(world, 2000);
  const frame = getTerminalFrame(world, 80, 30);
  const row = frame.find((line) =>
    line
      .map((cell) => cell.char)
      .join("")
      .includes("[CLASS")
  )!;
  const text = row.map((cell) => cell.char).join("");
  expect(text).toContain("[CLASS[INFO ]LEVEL[X]");
  const start = text.indexOf("INFO") - 1;
  expect(
    row
      .slice(start, start + 7)
      .every((cell) => cell.background === colors.white)
  ).toBe(true);
  expect(
    row
      .slice(text.indexOf("[CLASS"), text.indexOf("[CLASS") + 5)
      .every((cell) => cell.background === colors.grey)
  ).toBe(true);
});

it.each(["menu_sign", "potion_sign"] as const)(
  "keeps the hero visible in the %s illustration",
  (cell) => {
    const { world, hero } = setup();
    const sign = createCell(world, { ...hero.POSITION! }, cell, "visible").cell;
    const figures = sign
      .POPUP!.lines.flat(2)
      .filter((sprite) =>
        sprite.layers.some((layer) => layer.char === "\u010b")
      );
    expect(figures.length).toBeGreaterThan(0);
    for (const sprite of figures) expect(projectSprite(sprite).char).toBe("♀");
  }
);

it("mirrors the equipped action controls when handedness changes", () => {
  const { world } = setup();
  const normal = frameToText(getTerminalFrame(world, 80, 30));
  const flipped = frameToText(
    getTerminalFrame(world, 80, 30, undefined, { flipped: true })
  );
  expect(normal.indexOf("^S")).toBeLessThan(normal.indexOf("SPACE"));
  expect(flipped.indexOf("SPACE")).toBeLessThan(flipped.indexOf("^S"));
});

it("keeps the separator instead of drawing the content's cropped half row", () => {
  const { world, hero } = setup();
  createPopup(world, hero, {
    tabs: ["buy"],
    deals: Array.from({ length: 12 }, () => ({
      item: { stackable: "apple", amount: 1 },
      stock: 1,
      prices: [{ stackable: "coin", amount: 1 }],
    })),
  });
  openPopup(world, hero, hero);
  advance(world, 2000);
  const cropped = getSceneFrame(world, 33, 13, undefined, {
    instant: true,
  }).filter((entry) => entry.sprite.name === "popup_center_crop");
  expect(cropped.length).toBeGreaterThan(0);
  for (const entry of cropped)
    expect(entry.terminalLayers).toEqual([
      { char: "█", color: colors.black },
      { char: "─", color: colors.silver },
    ]);
});
