import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createWorld, World as WorldType } from "../../engine";
import { SaveStatus, WorldProvider } from "../../bindings/hooks";
import { loadSounds } from "../../game/sound";
import { classDefinitions } from "../../game/balancing/classes";
import { getHasteInterval } from "../../engine/systems/movement";
import { frameHeight, popupDelay } from "../../game/assets/utils";
import { ensureAudio, suspendAudio } from "../../game/sound/resumable";
import { createLevel, createSystems, preloadLevel } from "../../engine/ecs";
import { LevelName } from "../../engine/components/level";
import { levelConfig } from "../../game/levels";
import { useDimensions } from "../Dimensions";
import { canSave } from "../../game/saves";
import {
  eraseGame,
  loadSaveSummaries,
  restoreGame,
  storeGame,
} from "../../game/saves/storage";
import { TEST_MODE } from "../../engine/utils";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { submitChat } from "../../engine/systems/popup";
import packageJson from "../../../package.json";

declare global {
  interface Window {
    aliveChat?: (line?: string) => ReturnType<typeof submitChat>;
  }
}

// encode package version as V<major>x<minor>[.<patch>], e.g. 0.2.0 -> V0x02
const [major = 0, minor = 0, patch = 0] = packageJson.version
  .split(".")
  .map((part) => parseInt(part, 10) || 0);
export const gameVersion = `V${major}x${minor.toString().padStart(2, "0")}${
  patch ? `.${patch}` : ""
}`;

const initialLevel: LevelName = "LEVEL_MENU";

export default function World({
  createInitialWorld,
  persistent = !createInitialWorld,
  children,
}: React.PropsWithChildren<{
  createInitialWorld?: () => WorldType;
  persistent?: boolean;
}>) {
  const dimensions = useDimensions();
  const [paused, setPaused] = useState(true);
  const [loadingSounds, setLoadingSounds] = useState(!createInitialWorld);
  const [suspended, setSuspended] = useState(!createInitialWorld);
  const [initial, setInitial] = useState(!createInitialWorld);
  const [flipped, setFlipped] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>();
  const pauseRef = useRef(paused);
  const suspendedRef = useRef(suspended);
  const dimensionsRef = useRef(dimensions);
  suspendedRef.current = suspended;
  dimensionsRef.current = dimensions;

  // world callbacks only use stable state setters, so they are created once
  const [actions] = useState(() => {
    const connectWorld = (world: WorldType) => {
      world.metadata.suspend = () => setSuspended(true);
      world.metadata.resume = () => setSuspended(false);
      world.metadata.setFlipped = setFlipped;
      world.metadata.loadGame = loadGame;
      world.metadata.eraseGame = (saveId) =>
        eraseGame(saveId).catch((error) =>
          console.error("Erasing failed:", error)
        );
      world.metadata.dimensions = dimensionsRef.current;
    };

    // switching worlds remounts all children to drop old entity references
    const showWorld = (world: WorldType, loadMenu = false) =>
      setCurrent((previous) => ({
        ecs: world,
        key: previous.key + 1,
        loadMenu,
      }));

    const createMenu = () => {
      const world = createWorld();
      connectWorld(world);
      createLevel(world, initialLevel, levelConfig[initialLevel].size);
      createSystems(world);

      return world;
    };

    const openMenu = () => {
      setSuspended(true);
      setSaveStatus(undefined);
      const world = createMenu();
      world.metadata.initial = false;
      showWorld(world, true);
    };

    const loadGame = async (saveId: string) => {
      try {
        const world = await restoreGame(saveId);
        connectWorld(world);
        world.metadata.initial = false;
        createSystems(world);
        preloadLevel(world);
        setSaveStatus(undefined);
        showWorld(world);
        world.metadata.resume();
      } catch (error) {
        console.error("Loading failed:", error);
        openMenu();
      }
    };

    return { connectWorld, createMenu, openMenu };
  });

  const [current, setCurrent] = useState(() => {
    if (!createInitialWorld)
      return { ecs: actions.createMenu(), key: 0, loadMenu: true };

    const world = createInitialWorld();
    actions.connectWorld(world);
    return { ecs: world, key: 0, loadMenu: false };
  });
  const { ecs } = current;

  useEffect(() => {
    if (!current.loadMenu) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    // Paint the loading text before starting synthesis, including its fallback.
    const frame = requestAnimationFrame(() => {
      timer = setTimeout(async () => {
        await loadSounds({
          move: Object.values(classDefinitions).map(({ stats }) =>
            getHasteInterval(ecs, stats.haste)
          ),
          open: [(frameHeight - 1) * popupDelay],
        });
        if (cancelled) return;
        setLoadingSounds(false);
        timer = setTimeout(() => {
          levelConfig[initialLevel].generator(ecs);
          preloadLevel(ecs);
          ecs.metadata.resume();
        }, 0);
      }, 0);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [ecs, current.loadMenu]);

  const saveGame = useCallback(() => {
    // Composed wiki scenes must not overwrite playable saves.
    if (!persistent || suspendedRef.current || !canSave(ecs)) return;

    setSaveStatus({ saving: true });
    storeGame(ecs).then(
      (save) => setSaveStatus({ saving: false, name: save.name }),
      (error) => {
        console.error("Saving failed:", error);
        setSaveStatus({ saving: false, failed: true });
      }
    );
  }, [ecs, persistent]);

  const handlePause = useCallback(
    (action: React.SetStateAction<boolean>) => {
      const newPause =
        typeof action === "function" ? action(pauseRef.current) : action;

      if (!newPause && suspendedRef.current) return;
      ecs.metadata.initial = false;

      // toggle sound and save when pausing
      if (newPause) {
        suspendAudio();
        if (!pauseRef.current) saveGame();
      } else {
        ensureAudio();
      }

      setPaused(newPause);
      pauseRef.current = newPause;
    },
    [setPaused, pauseRef, ecs, saveGame]
  );

  const openMenu = useCallback(() => {
    saveGame();
    actions.openMenu();
    handlePause(false);
  }, [saveGame, actions, handlePause]);

  const context = useMemo(
    () => ({
      ecs,
      loadingSounds,
      suspended,
      setSuspended,
      paused,
      setPaused: handlePause,
      initial,
      setInitial,
      flipped,
      setFlipped,
      saveStatus,
      saveGame,
      openMenu,
    }),
    [
      ecs,
      loadingSounds,
      suspended,
      setSuspended,
      paused,
      handlePause,
      initial,
      flipped,
      saveStatus,
      saveGame,
      openMenu,
    ]
  );

  // list saves for continuing
  useEffect(() => {
    if (!persistent) return;
    loadSaveSummaries().catch((error) =>
      console.error("Loading saves failed:", error)
    );
  }, [persistent]);

  useEffect(() => {
    if (!TEST_MODE) return;
    const aliveChat = (line = "") => {
      const hero = ecs.getEntities([PLAYER, POSITION])[0];
      if (hero) return submitChat(ecs, hero, line);
    };
    window.aliveChat = aliveChat;
    return () => {
      if (window.aliveChat === aliveChat) delete window.aliveChat;
    };
  }, [ecs]);

  // expose utilities to world metadata
  useEffect(() => {
    ecs.metadata.dimensions = dimensions;
  }, [ecs.metadata, dimensions]);

  return (
    <WorldProvider value={context}>
      <Fragment key={current.key}>{children}</Fragment>
    </WorldProvider>
  );
}
