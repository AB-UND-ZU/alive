import React from "react";
import { spawn } from "child_process";
import { emitKeypressEvents, Interface, Key } from "readline";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import { deserialize, serialize } from "v8";
import { createWorld, World } from "../../engine";
import { createLevel, createSystems, preloadLevel } from "../../engine/ecs";
import { LevelName } from "../../engine/components/level";
import { PLAYER } from "../../engine/components/player";
import { POPUP } from "../../engine/components/popup";
import { levelConfig } from "../../game/levels";
import {
  canSave,
  createSave,
  getSummary,
  SaveGame,
  setSaveSummaries,
  upgradeSave,
} from "../../game/saves";
import { restoreSnapshot } from "../../engine/snapshot";
import { createFrameClock, systemsFrame } from "../interface/clock";
import {
  createTerminalRoot,
  getTerminalFrame,
  getTerminalLayout,
  getPauseActions,
  Terminal,
} from ".";
import { createTerminalInput } from "./input";
import { frameToAnsi, frameToText } from "./frame";
import { startTerminalAudio } from "./audio";
import { setAudioActive } from "../../game/sound/resumable";

const savePath = () =>
  join(
    process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"),
    "alive",
    "terminal.save"
  );

export const createTerminalWorld = (level: LevelName = "LEVEL_MENU") => {
  const world = createWorld();
  world.metadata.initial = false;
  createLevel(world, level, levelConfig[level].size);
  createSystems(world);
  levelConfig[level].generator(world);
  preloadLevel(world);
  return world;
};

export const emitTerminalKeys = (stream: NodeJS.ReadableStream) =>
  // Avoid readline's half-second delay for a bare Escape.
  emitKeypressEvents(stream, { escapeCodeTimeout: 50 } as Interface & {
    escapeCodeTimeout: number;
  });

export const openTerminalLink = (url: string) => {
  const command = process.platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(command, [url], { stdio: "ignore", detached: true });
  child.on("error", () => {});
  child.unref();
};

export const runTerminal = () => {
  const args = process.argv.slice(2);
  const levelArg = args[args.indexOf("--level") + 1];
  const level = Object.keys(levelConfig).find(
    (name) => name.toLowerCase().replace("level_", "") === levelArg
  ) as LevelName | undefined;
  let world = createTerminalWorld(level);
  let flipped = false;
  let suspended = false,
    paused = false,
    stopped = false;
  let input = createTerminalInput(world, openTerminalLink),
    clock = createFrameClock(world);
  let state = { stickyCastables: {} };
  let saved: SaveGame | undefined;
  let pauseSelection = 0;
  let saveFailed = false;
  try {
    saved = upgradeSave(deserialize(readFileSync(savePath())) as SaveGame);
    setSaveSummaries([getSummary(saved)]);
  } catch {}
  const save = () => {
    if (!canSave(world)) return;
    try {
      saved = createSave(world);
      world.metadata.saveId = saved.id;
      mkdirSync(dirname(savePath()), { recursive: true });
      writeFileSync(savePath(), serialize(saved));
      setSaveSummaries([getSummary(saved)]);
      saveFailed = false;
    } catch {
      saveFailed = true;
    }
  };
  const attach = (next: World) => {
    world = next;
    input.stop();
    input = createTerminalInput(world, openTerminalLink);
    clock = createFrameClock(world);
    state = { stickyCastables: {} };
    world.metadata.setFlipped = (value) => {
      flipped = value;
    };
    world.metadata.suspend = () => {
      suspended = true;
    };
    world.metadata.resume = () => {
      suspended = false;
    };
    world.metadata.loadGame = () => {
      if (!saved) return;
      const restored = restoreSnapshot(saved.snapshot);
      restored.metadata.saveId = saved.id;
      restored.metadata.initial = false;
      createSystems(restored);
      attach(restored);
      suspended = false;
    };
    world.metadata.eraseGame = () => {
      saved = undefined;
      rmSync(savePath(), { force: true });
      setSaveSummaries([]);
    };
  };
  attach(world);
  const dimensions = () => {
    const columns = process.stdout.columns || 80;
    const rows = process.stdout.rows || 30;
    const { width, height } = getTerminalLayout(columns, rows);
    world.metadata.dimensions = {
      ...world.metadata.dimensions,
      columns: width,
      visibleColumns: width,
      renderedColumns: width,
      rows,
      renderedRows: height,
      hudRows: 4,
      padding: 0,
      screenWidth: columns * 9,
      screenHeight: rows * 16,
      cellWidth: 9,
      cellHeight: 16,
      pixelSize: 1,
      terminalWidth: width * 9,
      terminalHeight: height * 16,
      renderedDiagonal: Math.sqrt((width ** 2 * 9) / 16 + height ** 2),
    };
    return { columns, rows };
  };
  const frameArg = args.indexOf("--frames");
  if (frameArg !== -1) {
    const { columns, rows } = dimensions();
    for (let i = 0; i < Number(args[frameArg + 1] || 1); i++)
      clock.advance(systemsFrame);
    const frame = getTerminalFrame(world, columns, rows, state);
    const colored =
      !args.includes("--plain") &&
      (args.includes("--color") || process.stdout.isTTY);
    process.stdout.write(
      (colored ? frameToAnsi(frame) : frameToText(frame)) + "\n"
    );
    return;
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error(
      "Use an interactive terminal, or --frames 1 to print a frame"
    );
  const closeAudio = startTerminalAudio();
  const root = createTerminalRoot((output) => process.stdout.write(output));
  const render = () => {
    const { columns, rows } = dimensions();
    if (columns < 33 || rows < 24) {
      process.stdout.write(
        "\x1b[0m\x1b[H\x1b[2JAlive needs at least 33 columns and 24 rows."
      );
      return;
    }
    root.render(
      <Terminal
        world={world}
        columns={columns}
        rows={rows}
        state={state}
        session={{
          paused,
          suspended,
          flipped,
          selection: pauseSelection,
          saveName:
            saved && saved.id === world.metadata.saveId
              ? saved.name
              : undefined,
          failed: saveFailed,
        }}
      />
    );
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    closeAudio?.();
    input.stop();
    save();
    root.unmount();
    process.stdin.off("keypress", keypress);
    process.stdout.off("resize", render);
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdout.write("\x1b[0m\x1b[?25h\x1b[?1049l");
  };
  const keypress = (_text: string, key: Key) => {
    if (key.ctrl && key.name === "c") {
      stop();
      return;
    }
    const hero = world.getEntities([PLAYER])[0];
    const popup =
      hero && world.getEntityByIdAndComponents(hero[PLAYER].popup, [POPUP]);
    if (paused) {
      const actions = getPauseActions(world);
      if (key.name === "escape" || key.name === "space" || key.name === "r") {
        paused = false;
      } else if (key.name === "up" || key.name === "w") {
        pauseSelection = (pauseSelection + actions.length - 1) % actions.length;
      } else if (key.name === "down" || (key.name === "s" && !key.ctrl)) {
        pauseSelection = (pauseSelection + 1) % actions.length;
      } else if (key.ctrl && key.name === "s") {
        save();
      } else if (key.name === "return" || key.name === "enter") {
        const action = actions[pauseSelection];
        if (!action.disabled) {
          if (action.name === "RESUME") paused = false;
          else if (action.name === "SAVE") save();
          else {
            save();
            attach(createTerminalWorld());
            paused = false;
            suspended = false;
          }
        }
      }
      render();
      return;
    }
    if (key.name === "escape" && !popup) {
      paused = true;
      pauseSelection = 0;
      input.stop();
      save();
      render();
      return;
    }
    input.press(key);
  };
  process.stdout.write("\x1b[?1049h\x1b[?25l\x1b[2J");
  emitTerminalKeys(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("keypress", keypress);
  process.stdout.on("resize", render);
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  let previous = performance.now();
  const timer = setInterval(() => {
    const now = performance.now();
    setAudioActive(!paused && !suspended);
    clock.advance(
      now - previous,
      paused ||
        suspended ||
        (process.stdout.columns || 80) < 33 ||
        (process.stdout.rows || 30) < 24
    );
    previous = now;
    render();
  }, systemsFrame);
  render();
};

if (require.main === module) runTerminal();
