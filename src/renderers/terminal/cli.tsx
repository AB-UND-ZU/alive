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
import { soundsLoading, worldLoading } from "../../game/assets/loading";
import type { Sprite } from "../../engine/components/sprite";
import type {
  GenerationMessage,
  GenerationRequest,
  LevelDestination,
} from "../../game/levels/generation";
import { Worker } from "worker_threads";
import { TEST_MODE } from "../../engine/utils";
import { levelConfig } from "../../game/levels";
import { checkUnlocks } from "../../game/unlocks";
import {
  canSave,
  createSave,
  getSummary,
  pauseSaveDelay,
  restoreSavedWorld,
  SaveGame,
  setSaveSummaries,
  upgradeSave,
} from "../../game/saves";
import {
  createSnapshot,
  restoreSnapshot,
  WorldSnapshot,
} from "../../engine/snapshot";
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
import { loadSounds } from "../../game/sound";
import { heroBaseHaste } from "../../engine/components/stats";
import { classDefinitions } from "../../game/balancing/classes";
import { getHasteInterval } from "../../engine/systems/movement";
import { frameHeight, popupDelay } from "../../game/assets/utils";

const savePath = () =>
  join(
    process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"),
    "alive",
    "terminal.save"
  );

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

export const runTerminal = async () => {
  const args = process.argv.slice(2);
  const levelArg = args[args.indexOf("--level") + 1];
  const level = Object.keys(levelConfig).find(
    (name) => name.toLowerCase().replace("level_", "") === levelArg
  ) as LevelName | undefined;
  let world = createWorld();
  createLevel(world, "LEVEL_MENU", levelConfig.LEVEL_MENU.size);
  let loading: Sprite[] | undefined;
  let flipped = false;
  let suspended = false,
    paused = false,
    stopped = false;
  let input = createTerminalInput(world, openTerminalLink),
    clock = createFrameClock(world);
  let state = { castableQuadrants: {} };
  let saved: SaveGame | undefined;
  let pauseSelection = 0;
  let saveFailed = false;
  let saveAt = 0;
  try {
    saved = upgradeSave(deserialize(readFileSync(savePath())) as SaveGame);
    setSaveSummaries([getSummary(saved)]);
  } catch {}
  const save = (snapshot?: WorldSnapshot) => {
    saveAt = 0;
    if (!canSave(world)) return;
    try {
      checkUnlocks(world);
      saved = createSave(world, undefined, snapshot);
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
    state = { castableQuadrants: {} };
    world.metadata.setFlipped = (value) => {
      flipped = value;
    };
    world.metadata.generateLevel = (destination) => {
      checkUnlocks(world);
      void generate(destination, createSnapshot(world)).catch((error) =>
        console.error("Loading failed:", error)
      );
    };
    world.metadata.setLoading = (value) => {
      loading = value;
    };
    world.metadata.loadGame = () => {
      if (!saved) return;
      const restored = restoreSavedWorld(saved);
      restored.metadata.initial = false;
      checkUnlocks(restored);
      createSystems(restored);
      preloadLevel(restored);
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
  const generate = async (
    destination: LevelDestination,
    source?: WorldSnapshot
  ) => {
    suspended = true;
    loading = worldLoading(levelConfig[destination.level].name);
    const request: GenerationRequest = { ...destination, source };
    const worker = new Worker(join(__dirname, "generation.cjs"), {
      workerData: {
        request,
        testMode: TEST_MODE,
        saves: saved ? [getSummary(saved)] : [],
      },
    });
    try {
      const snapshot = await new Promise<WorldSnapshot>((resolve, reject) => {
        worker.on("message", (message: GenerationMessage) => {
          if ("line" in message) {
            loading = message.line;
            if (frameArg === -1 && !stopped) render();
          } else resolve(message.snapshot);
        });
        worker.once("error", reject);
        worker.once("exit", (code) =>
          reject(new Error("Level worker exited: " + code))
        );
      });
      if (stopped) return;
      const next = restoreSnapshot(snapshot);
      next.metadata.initial = false;
      if (source) next.metadata.saveId = world.metadata.saveId;
      createSystems(next);
      preloadLevel(next);
      attach(next);
      if (frameArg === -1 && destination.level !== "LEVEL_MENU") save(snapshot);
    } finally {
      await worker.terminate();
      suspended = false;
    }
  };

  if (frameArg !== -1) {
    await generate({ level: level ?? "LEVEL_MENU" });
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
  process.stdout.write("\x1b[?1049h\x1b[?25l\x1b[2J");
  const root = createTerminalRoot((output) => process.stdout.write(output));
  const closeAudio = startTerminalAudio();
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
          loading,
          flipped,
          selection: pauseSelection,
          saveName:
            saved && saved.id === world.metadata.saveId
              ? saved.name
              : undefined,
          failed: saveFailed,
          saving: !!saveAt,
        }}
      />
    );
  };
  if (closeAudio) {
    suspended = true;
    loading = soundsLoading();
    render();
    await loadSounds(
      {
        move: Object.values(classDefinitions).map(({ stats }) =>
          getHasteInterval(world, heroBaseHaste + stats.haste)
        ),
        open: [(frameHeight - 1) * popupDelay],
      },
      (current, total) => {
        loading = soundsLoading(current, total);
        render();
      }
    );
    suspended = false;
  }
  await generate({ level: level ?? "LEVEL_MENU" });
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    closeAudio?.();
    input.stop();
    if (!suspended) save();
    root.unmount();
    process.stdin.off("keypress", keypress);
    process.stdout.off("resize", render);
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdout.write("\x1b[0m\x1b[?25h\x1b[?1049l");
  };
  const savePausedGame = (delay = 0) => {
    if (canSave(world) && !saveAt) saveAt = performance.now() + delay;
  };
  const keypress = (_text: string, key: Key) => {
    if (key.ctrl && key.name === "c") {
      stop();
      return;
    }
    if (suspended) return;
    const hero = world.getEntities([PLAYER])[0];
    const popup =
      hero && world.getEntityByIdAndComponents(hero[PLAYER].popup, [POPUP]);
    if (paused) {
      const actions = getPauseActions(world, !!saveAt);
      if (key.name === "escape" || key.name === "space" || key.name === "r") {
        paused = false;
      } else if (key.name === "up" || key.name === "w") {
        pauseSelection = (pauseSelection + actions.length - 1) % actions.length;
      } else if (key.name === "down" || (key.name === "s" && !key.ctrl)) {
        pauseSelection = (pauseSelection + 1) % actions.length;
      } else if (key.ctrl && key.name === "s") {
        savePausedGame();
      } else if (key.name === "return" || key.name === "enter") {
        const action = actions[pauseSelection];
        if (!action.disabled) {
          if (action.name === "RESUME") paused = false;
          else if (action.name === "SAVE") savePausedGame();
          else {
            save();
            void generate({ level: "LEVEL_MENU" });
            paused = false;
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
      savePausedGame(pauseSaveDelay);
      render();
      return;
    }
    input.press(key);
  };
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
    if (saveAt && (!paused || now >= saveAt)) save();
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
