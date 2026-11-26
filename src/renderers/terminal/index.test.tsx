import { initiateWarp } from "../../engine/systems/trigger";
import { levelConfig } from "../../game/levels";
import { soundsLoading, worldLoading } from "../../game/assets/loading";
import { createPopup, openPopup } from "../../engine/systems/popup";
import { POPUP } from "../../engine/components/popup";
import { rerenderEntity } from "../../engine/systems/renderer";
import {
  advance,
  assertHero,
  createAreaWorld,
  giveItems,
} from "../../testing/harness";
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
  const { top } = getTerminalLayout(80, 30);
  const frame = getTerminalFrame(world, 80, 30);
  const stats = frame.slice(top - 4, top - 1);
  const lines = frameToText(stats).split("\n");
  expect(lines[0]).toMatch(/12\/25[ ░▀]{2}♥HP/);
  expect(lines[1]).toMatch(/3\/10[ ░▀]{2}♦MP/);
  expect(lines[2]).toMatch(/5[ ░▀]+xXP/);
  expect(stats.flat().some((cell) => "▀▄▌▐".includes(cell.char))).toBe(false);
  expect(lines[0].indexOf("HP")).toBe(lines[2].indexOf("XP"));
  expect(lines[1].indexOf("MP")).toBe(lines[2].indexOf("XP"));
  expect(frameToText(frame)).not.toContain("Infinity");
  expect(
    stats[0]
      .filter((cell) => /[0-9♥HP/]/.test(cell.char))
      .every((cell) => cell.foreground === colors.red)
  ).toBe(true);
  expect(frame).toHaveLength(30);
  expect(frame.every((row) => row.length === 80)).toBe(true);
});

it("keeps the hero visible in its own cell without lights or shadows", () => {
  const { world, hero } = setup();
  hero[FOG]!.visibility = "visible";
  expect(frameToText(getTerminalFrame(world, 33, 24))).toContain("♀");
  hero[FOG]!.visibility = "fog";
  expect(frameToText(getTerminalFrame(world, 33, 24))).toContain("♀");
});

it("centers a bounded game viewport inside full-width terminal chrome", () => {
  const { world } = setup();
  expect(getTerminalLayout(80, 40)).toEqual({
    width: 33,
    height: 13,
    left: 23,
    top: 14,
  });
  const rows = frameToText(getTerminalFrame(world, 80, 40)).split("\n");
  expect(rows[13].slice(23, 56)).toBe("┌" + "─".repeat(31) + "┐");
  expect(rows[27].slice(23, 56)).toBe("└" + "─".repeat(31) + "┘");
  expect(rows[14][23]).toBe("│");
  expect(rows[14][55]).toBe("│");
});

it("shows a disabled Saving button until the write finishes", () => {
  const { world } = setup();
  const frame = getTerminalFrame(world, 80, 40, undefined, {
    paused: true, saving: true, selection: 2,
  });
  expect(frameToText(frame)).toContain("SAVING");
  expect(getPauseActions(world, true)[2].disabled).toBe(true);
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
  expect(selected.foreground).toBe(colors.black);
  expect(selected.background).toBe(colors.lime);
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

it("retains the pause title's upper and lower filled halves", () => {
  const { world } = setup();
  const frame = getTerminalFrame(world, 80, 40, undefined, { paused: true });
  const text = frame
    .map((row) =>
      row
        .map((cell) =>
          cell.char === "▄" &&
          cell.foreground === colors.black &&
          cell.background === colors.white
            ? "▀"
            : cell.char
        )
        .join("")
    )
    .join("\n");
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
          [colors.navy, colors.blue].includes(cell.foreground) ||
          [colors.navy, colors.blue].includes(cell.background || "")
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
    const lines = frameToText(paused).split("\n");
    const resumeRow = lines.findIndex((line) => line.includes(">[RESUME]"));
    const buttonLeft = lines[resumeRow].indexOf(">[RESUME]");
    for (const [x, y] of [
      [buttonLeft - 1, resumeRow],
      [buttonLeft, resumeRow - 1],
      [buttonLeft, resumeRow - 2],
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
  "keeps the HUD while clearing old-world content during loading at %i columns",
  (columns) => {
    const { world } = setup();
    const rows = 30;
    const frame = getTerminalFrame(world, columns, rows, undefined, {
      suspended: true,
    });
    const layout = getTerminalLayout(columns, rows);
    const content = frame
      .slice(layout.top, layout.top + layout.height)
      .map((row) => row.slice(layout.left + 1, layout.left + layout.width - 1));
    expect(frameToText(content).replace(/\s/g, "")).toBe("│Loading#Dungeon...│");
    const loading = content.flat().find((cell) => cell.char === "L")!;
    expect(loading).toMatchObject({
      foreground: colors.black,
      background: colors.white,
    });
    expect(frameToText(frame)).toContain("HP");
    expect(frameToText(frame)).toContain("SPACE");
    expect(frame[layout.top - 1][layout.left].char).toBe("┌");
    expect(
      frame[layout.top + layout.height][layout.left + layout.width - 1].char
    ).toBe("┘");
  }
);

it.each([
  [0, "[RESUME]", colors.lime],
  [1, "[ MENU ]", colors.red],
  [2, "[ SAVE ]", colors.white],
] as const)("uses the bright palette for pause selection %i", (selection, label, background) => {
  const { world } = setup();
  const frame = getTerminalFrame(world, 80, 30, undefined, {
    paused: true,
    selection,
  });
  const row = frame.find((line) =>
    line.map((cell) => cell.char).join("").includes(label)
  )!;
  const start = row.map((cell) => cell.char).join("").indexOf(label);
  const cells = row.slice(start, start + label.length);
  expect(cells.every((cell) => cell.background === background)).toBe(true);
  expect(
    cells.filter((cell) => cell.char !== " ")
      .every((cell) => cell.foreground === colors.black)
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

it("keeps the empty portion of stats bars black without dotted shading", () => {
  const { world, hero } = setup();
  Object.assign(hero.STATS!, {
    hp: 1,
    maxHp: 25,
    mp: 0,
    maxMp: 10,
    xp: 0,
    maxXp: 10,
  });
  const frame = getTerminalFrame(world, 80, 30);
  const { top } = getTerminalLayout(80, 30);
  expect(
    frame
      .slice(top - 4, top - 1)
      .flat()
      .some((cell) => cell.char === "░")
  ).toBe(false);
});

it("uses only gray pixels with black masks for a disabled class portrait", () => {
  const world = createAreaWorld("| ♀ |", { level: "LEVEL_MENU", size: 64 });
  const hero = assertHero(world);
  createPopup(world, hero, { tabs: ["class", "style", "warp"] });
  openPopup(world, hero, hero);
  hero.POPUP!.verticalIndezes[0] = 1;
  rerenderEntity(world, hero);
  advance(world, 2000);
  const portrait = getSceneFrame(world, 33, 13, undefined, {
    instant: true,
  }).filter(
    (entry) =>
      /^popup-content-\d+-1[2-8]$/.test(entry.particleName || "") &&
      entry.terminalLayers?.some((layer) => layer.color === colors.grey)
  );
  expect(portrait.length).toBeGreaterThan(0);
  for (const entry of portrait) {
    expect(
      entry.terminalLayers!.every(
        (layer) => layer.color === colors.black || layer.color === colors.grey
      )
    ).toBe(true);
    expect(entry.terminalLayers!.some((layer) => layer.char === "░")).toBe(
      false
    );
  }
});

it.each([0, 1, 2, 3])(
  "renders undiscovered minimap cells as pixels at zoom %i",
  (zoom) => {
    const { world } = setup();
    const hero = world.assertComponents(assertHero(world), [
      "INVENTORY",
      "EQUIPPABLE",
      "POSITION",
    ]);
    const [map] = giveItems(world, hero, [
      { accessory: "map", material: "gold", amount: 1 },
    ]);
    hero.EQUIPPABLE.map = world.getEntityId(map);
    createPopup(world, hero, { tabs: ["map"] });
    openPopup(world, hero, hero);
    hero.POPUP!.verticalIndezes[0] = zoom;
    rerenderEntity(world, hero);
    advance(world, 2000);
    const frame = getTerminalFrame(world, 80, 30);
    expect(
      frame
        .flat()
        .some(
          (cell) => "▀▄█".includes(cell.char) && cell.foreground === colors.grey
        )
    ).toBe(true);
    expect(frameToText(frame)).not.toMatch(/[∙≡☺]/);
  }
);

it.each([
  [21, 20],
  [33, 20],
  [80, 30],
])("connects all viewport corners at %i by %i cells", (columns, rows) => {
  const { world } = setup();
  const frame = getTerminalFrame(world, columns, rows);
  const { left, top, width, height } = getTerminalLayout(columns, rows);
  expect(height).toBeGreaterThanOrEqual(13);
  expect(
    frame[top - 1]
      .slice(left, left + width)
      .map((cell) => cell.char)
      .join("")
  ).toBe("┌" + "─".repeat(width - 2) + "┐");
  expect(
    frame[top + height]
      .slice(left, left + width)
      .map((cell) => cell.char)
      .join("")
  ).toBe("└" + "─".repeat(width - 2) + "┘");
  for (const row of frame.slice(top, top + height)) {
    expect(row[left].char).toBe("│");
    expect(row[left + width - 1].char).toBe("│");
  }
  expect(top + height).toBeLessThan(rows - 2);
});

it("mirrors the top stats and buttons with the equipped controls", () => {
  const { world } = setup();
  const normal = getTerminalFrame(world, 80, 30);
  const flipped = getTerminalFrame(world, 80, 30, undefined, { flipped: true });
  const { top } = getTerminalLayout(80, 30);
  for (const y of [top - 4, top - 3]) {
    const first = normal[y].findIndex((cell) => cell.char !== " ");
    expect(flipped[y].findIndex((cell) => cell.char !== " ")).toBe(first + 2);
  }
  const normalRow = frameToText([normal[top - 2]]);
  const flippedRow = frameToText([flipped[top - 2]]);
  expect(normalRow.indexOf("USE")).toBeGreaterThan(normalRow.indexOf("XP"));
  expect(flippedRow.indexOf("USE")).toBeLessThan(flippedRow.indexOf("XP"));
});

it("shows both walls of a thirteen-row dungeon room at the minimum browser height", () => {
  const room = Array.from(
    { length: 13 },
    (_, y) =>
      "|" +
      (y === 0 || y === 12
        ? "█████████"
        : y === 6
        ? "█   ♀   █"
        : "█       █") +
      "|"
  ).join("\n");
  const world = createAreaWorld(room, { size: 48 });
  advance(world, 700);
  const frame = getTerminalFrame(world, 33, 20);
  const layout = getTerminalLayout(33, 20);
  for (const y of [layout.top, layout.top + layout.height - 1])
    expect(frame[y][16].background).toBe(colors.silver);
});

it("keeps one complete world row below a settled dialog", () => {
  const { world, hero } = setup();
  createPopup(world, hero, { tabs: ["info"], lines: [[]] });
  openPopup(world, hero, hero);
  advance(world, 1500);
  const { width, height } = getTerminalLayout(33, 20);
  const sequence = getSequence(world, hero, "popup")!;
  const bottom = world.assertById(sequence.particles["popup-down-0"]);
  const entry = getSceneFrame(world, width, height, undefined, {
    instant: true,
  }).find((entry) => entry.particle === bottom)!;
  expect(entry).toBeDefined();
  expect(Math.ceil(entry.y)).toBeLessThan(height - 1);
});

it.each(["LEVEL_TUTORIAL", "LEVEL_ISLAND"] as const)("keeps the %s placeholder aligned with its portal dialog", (level) => {
  const world = createAreaWorld("| ♀∩ |", { level: "LEVEL_MENU", size: 64 });
  advance(world, 3000);
  const portal = world.getEntities(["WARPABLE", "POPUP"])[0];
  portal.POPUP.horizontalIndex = portal.POPUP.tabs.indexOf("warp");
  portal.POPUP.verticalIndezes[portal.POPUP.horizontalIndex] = levelConfig[level].mapOffsetY;
  initiateWarp(world, portal, assertHero(world));
  advance(world, 2500);
  const location = (suspended: boolean) => {
    const frame = getTerminalFrame(world, 33, 24, undefined, {
      suspended,
      loading: worldLoading(levelConfig[level].name),
    });
    const lines = frame.map((row) => row.map((cell) => cell.char).join(""));
    const y = lines.findIndex((row) => row.includes(levelConfig[level].name + "..."));
    expect(y).toBeGreaterThanOrEqual(0);
    return [lines[y].indexOf("Loading"), y];
  };
  expect(location(true)).toEqual(location(false));
});

it("draws startup loading inside the connected frame without the old world", () => {
  const { world } = setup();
  const frame = getTerminalFrame(world, 33, 24, undefined, {
    suspended: true,
    loading: soundsLoading(17, 201),
  });
  const layout = getTerminalLayout(33, 24);
  const content = frame
    .slice(layout.top, layout.top + layout.height)
    .map((row) => row.slice(layout.left + 1, layout.left + layout.width - 1));
  expect(frameToText(content).replace(/\s/g, "")).toBe("│Loading♫17/201...│");
  expect(content.flat().find((cell) => cell.char === "♫")?.foreground).toBe(
    colors.green
  );
  expect(frame[layout.top - 1][layout.left].char).toBe("┌");
  expect(
    frame[layout.top + layout.height][layout.left + layout.width - 1].char
  ).toBe("┘");
});

it.each([20, 21, 30, 40, 80])(
  "keeps stats and controls beside the frame at %i rows",
  (rows) => {
    const { world } = setup();
    const frame = getTerminalFrame(world, 80, rows);
    const { top, height } = getTerminalLayout(80, rows);
    const text = frameToText(frame).split("\n");
    expect(text[top - 4]).toContain("HP");
    expect(text[top - 3]).toContain("MP");
    expect(text[top - 2]).toContain("XP");
    expect(text[top + height + 1]).toContain("SPACE");
    expect(
      text
        .slice(0, top - 4)
        .join("")
        .trim()
    ).toBe("");
    expect(
      text
        .slice(top + height + 3)
        .join("")
        .trim()
    ).toBe("");
    expect(Math.abs(top - 4 - (rows - (top + height + 3)))).toBeLessThanOrEqual(
      1
    );
  }
);
