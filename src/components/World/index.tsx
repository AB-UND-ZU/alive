import { createDialog } from "../../game/assets/ui";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createWorld, World as WorldType } from "../../engine";
import { soundsLoading, worldLoading } from "../../game/assets/loading";
import { loadLevel } from "../../game/levels/worker";
import { createSnapshot, restoreSnapshot } from "../../engine/snapshot";
import type { LevelDestination } from "../../game/levels/generation";
import {
  LoadingContext,
  SaveStatus,
  WorldProvider,
} from "../../renderers/interface/hooks";
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
import { isDead } from "../../engine/systems/damage";
import { submitChat } from "../../engine/systems/popup";

declare global {
  interface Window {
    aliveChat?: (line?: string) => ReturnType<typeof submitChat>;
  }
}

export { gameVersion } from "../../game/assets/version";

const initialLevel: LevelName = "LEVEL_MENU";

export default function World({
  createInitialWorld,
  preset,
  persistent = !createInitialWorld,
  children,
}: React.PropsWithChildren<{
  createInitialWorld?: () => WorldType;
  preset?: {
    level: LevelName;
    seed: number;
    prepare: (world: WorldType) => void;
  };
  persistent?: boolean;
}>) {
  const dimensions = useDimensions();
  const [paused, setPaused] = useState(true);
  const [loading, setLoading] = useState(() => soundsLoading());
  const [suspended, setSuspended] = useState(!createInitialWorld);
  const [initial, setInitial] = useState(!createInitialWorld && !preset);
  const [flipped, setFlipped] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>();
  const pauseRef = useRef(paused);
  const suspendedRef = useRef(suspended);
  const generation = useRef<AbortController>();
  const activeWorld = useRef<WorldType>();
  const dimensionsRef = useRef(dimensions);
  suspendedRef.current = suspended;
  dimensionsRef.current = dimensions;

  // world callbacks only use stable state setters, so they are created once
  const [actions] = useState(() => {
    const connectWorld = (world: WorldType) => {
      activeWorld.current = world;
      world.metadata.generateLevel = (destination) => {
        if (activeWorld.current === world) void generate(world, destination);
      };
      world.metadata.setLoading = setLoading;
      world.metadata.setFlipped = setFlipped;
      world.metadata.loadGame = loadGame;
      world.metadata.readOnlySaves = !persistent;
      world.metadata.eraseGame = (saveId) => {
        if (!persistent) return;
        return eraseGame(saveId).catch((error) =>
          console.error("Erasing failed:", error)
        );
      };
      world.metadata.dimensions = dimensionsRef.current;
    };

    // switching worlds remounts all children to drop old entity references
    const showWorld = (world: WorldType, boot = false) =>
      setCurrent((previous) => ({
        ecs: world,
        key: previous.key + 1,
        boot,
      }));

    const createMenu = () => {
      const world = createWorld();
      connectWorld(world);
      createLevel(world, initialLevel, levelConfig[initialLevel].size);
      createSystems(world);

      return world;
    };

    const openMenu = () => {
      setLoading(worldLoading(levelConfig[initialLevel].name));
      setSuspended(true);
      setSaveStatus(undefined);
      const world = createMenu();
      world.metadata.initial = false;
      showWorld(world, true);
    };

    const install = (
      world: WorldType,
      initial: boolean,
      prepare?: (world: WorldType) => void
    ) => {
      connectWorld(world);
      world.metadata.initial = initial;
      createSystems(world);
      preloadLevel(world);
      prepare?.(world);
      setSaveStatus(undefined);
      showWorld(world);
      setSuspended(false);
    };

    const generate = async (
      source: WorldType,
      destination: LevelDestination,
      preview?: typeof preset
    ) => {
      setSuspended(true);
      generation.current?.abort();
      const controller = new AbortController();
      generation.current = controller;
      const menu = destination.level === initialLevel;
      try {
        if (menu) {
          await loadSaveSummaries(persistent ? "readwrite" : "readonly").catch(
            (error) => console.error("Loading saves failed:", error)
          );
          if (controller.signal.aborted) return;
        }
        const snapshot = await loadLevel(
          {
            ...destination,
            source: menu || preview ? undefined : createSnapshot(source),
            seed: preview?.seed,
          },
          setLoading,
          controller.signal
        );
        if (controller.signal.aborted || activeWorld.current !== source) return;
        const world = restoreSnapshot(snapshot);
        world.metadata.saveId = menu ? undefined : source.metadata.saveId;
        install(world, menu && source.metadata.initial, preview?.prepare);
        if (!menu && !preview && persistent) {
          try {
            await storeGame(world, snapshot);
          } catch (error) {
            console.error("Saving failed:", error);
            if (activeWorld.current === world)
              setSaveStatus({ saving: false, failed: true });
          }
        }
      } catch (error) {
        if (controller.signal.aborted || activeWorld.current !== source) return;
        console.error("Loading failed:", error);
        if (menu || preview) setLoading(createDialog("Loading failed."));
        else setSuspended(false);
      }
    };

    const loadGame = async (saveId: string) => {
      setSuspended(true);
      try {
        const world = await restoreGame(saveId);
        install(world, false);
      } catch (error) {
        console.error("Loading failed:", error);
        openMenu();
      }
    };

    return { connectWorld, createMenu, openMenu, generate };
  });

  const [current, setCurrent] = useState(() => {
    if (!createInitialWorld)
      return { ecs: actions.createMenu(), key: 0, boot: true, preset };

    const world = createInitialWorld();
    actions.connectWorld(world);
    return { ecs: world, key: 0, boot: false };
  });
  const { ecs } = current;

  useEffect(() => {
    if (!current.boot) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    // Paint the loading text before starting synthesis, including its fallback.
    const frame = requestAnimationFrame(() => {
      timer = setTimeout(async () => {
        await loadSounds(
          {
            move: Object.values(classDefinitions).map(({ stats }) =>
              getHasteInterval(ecs, stats.haste)
            ),
            open: [(frameHeight - 1) * popupDelay],
          },
          (current, total) => {
            if (!cancelled) setLoading(soundsLoading(current, total));
          }
        );
        if (cancelled) return;
        const start = current.preset?.level ?? initialLevel;
        setLoading(worldLoading(levelConfig[start].name));
        timer = setTimeout(() => {
          void actions.generate(ecs, { level: start }, current.preset);
        }, 0);
      }, 0);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [actions, ecs, current.boot, current.preset]);

  useEffect(
    () => () => {
      activeWorld.current = undefined;
      generation.current?.abort();
    },
    []
  );
  useEffect(() => {
    activeWorld.current = ecs;
  }, [ecs]);

  const saveGame = useCallback(() => {
    if (suspendedRef.current || !canSave(ecs)) return;

    setSaveStatus({ saving: true });
    storeGame(ecs).then(
      (save) => setSaveStatus({ saving: false, name: save.name }),
      (error) => {
        console.error("Saving failed:", error);
        setSaveStatus({ saving: false, failed: true });
      }
    );
  }, [ecs]);

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

  useEffect(() => {
    if (!TEST_MODE) return;
    const aliveChat = (line = "") => {
      const hero = ecs.getEntities([PLAYER, POSITION])[0];
      if (hero && !isDead(ecs, hero)) return submitChat(ecs, hero, line);
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
      <LoadingContext.Provider value={loading}>
        <Fragment key={current.key}>{children}</Fragment>
      </LoadingContext.Provider>
    </WorldProvider>
  );
}
