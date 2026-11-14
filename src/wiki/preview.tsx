import { enableTouchEmulation, TouchCursor } from "./TouchControls";
import { createPresetWorld, PresetName } from "./presets";
import { DemoFrame } from "./DemoFrame";
import { setAudioActive, ensureAudio } from "../game/sound/resumable";
import { findPath, relativeOrientations } from "../game/math/path";
import { getIdentifierAndComponents } from "../engine/utils";
import { getTab } from "../engine/systems/popup";
import { isInteractable } from "../engine/systems/freeze";
import { getHero } from "../testing/harness";
import { Button } from "./visuals";
import { createRoot } from "react-dom/client";
import { CSSProperties, useEffect, useState } from "react";
import World from "../components/World";
import { useWorld } from "../renderers/interface/hooks";
import Dimensions, { useDimensions } from "../components/Dimensions";
import TerminalClientPreview from "../renderers/terminal/BrowserPreview";
import Terminal from "../components/Terminal";
import Controls from "../components/Controls";
import Stats from "../components/Stats";
import {
  createPreviewWorld,
  sceneDefinitions,
  sceneLayout,
  movementGoals,
  SceneName,
} from "./scenes";
import "../components/App/index.css";
import "./preview-engine.css";
setAudioActive(false);
const [scene, option = ""] = window.location.hash.slice(1).split("/");
const name = (scene || "game") as SceneName;
if (name === "touch") void enableTouchEmulation();
const terminalClient = name === "clients" && option === "terminal";
function DemoActions() {
  if (name === "game" || name === "interface") return null;
  return (
    <div className="DemoActions">
      <Button
        palette="red"
        onClick={() =>
          window.parent.postMessage(
            { type: "preview-reset" },
            window.location.origin
          )
        }
      >
        Reset
      </Button>
    </div>
  );
}
function Bridge({ setShadows }: { setShadows: (enabled: boolean) => void }) {
  const { ecs, setPaused, setInitial } = useWorld();
  useEffect(() => {
    let visible = false;
    let focused = false;
    let automatic = false;
    let autoIndex = 0;
    let openingPopup = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const keys =
      name === "abilities" && option === "trap"
        ? [...sceneDefinitions[name].keys, "ArrowDown"]
        : sceneDefinitions[name].keys;
    const stop = () => {
      clearInterval(timer);
      automatic = false;
      for (const key of new Set([
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        ...keys,
      ]))
        window.dispatchEvent(
          new KeyboardEvent("keyup", { key, bubbles: true })
        );
    };
    const capture = (event: KeyboardEvent) => {
      if (name === "interface") return;
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          " ",
          "Tab",
          "PageUp",
          "PageDown",
          "Home",
          "End",
        ].includes(event.key)
      )
        event.preventDefault();
      if (name === "game") return;
      event.preventDefault();
      const hero = ecs && getHero(ecs);
      if (
        name !== "chat" &&
        name !== "clients" &&
        !hero?.PLAYER?.popup &&
        (["c", "C", "/"].includes(event.key) ||
          (event.key === "Enter" && !ecs?.metadata.interact.active))
      ) {
        event.stopImmediatePropagation();
        return;
      }
      if (event.key === "Escape" && !(ecs && getHero(ecs)?.PLAYER?.popup)) {
        event.stopImmediatePropagation();
        if (event.type !== "keydown" || !event.isTrusted) return;
        event.stopImmediatePropagation();
        window.parent.postMessage(
          { type: "preview-unfocus" },
          window.location.origin
        );
        stop();
        setPaused(true);
      }
    };
    window.addEventListener("keydown", capture, true);
    window.addEventListener("keyup", capture, true);
    const autoplay = () => {
      stop();
      if (
        name === "game" ||
        name === "interface" ||
        (name !== "movement" && !keys.length) ||
        autoIndex >= (name === "movement" ? movementGoals.length : keys.length)
      )
        return;
      automatic = true;
      timer = setInterval(() => {
        const hero = ecs && getHero(ecs);
        if (!hero) return;
        if (openingPopup && hero.PLAYER?.popup) {
          openingPopup = false;
          autoIndex++;
        }
        let key: string | undefined = keys[autoIndex];
        if (name === "movement" && ecs) {
          let goal = movementGoals[autoIndex];
          const apple = getIdentifierAndComponents(ecs, "maze_apple", ["ITEM"]);
          const reached =
            autoIndex === 0
              ? apple?.ITEM.carrier === ecs.getEntityId(hero)
              : goal &&
                hero.POSITION.x === goal.x &&
                hero.POSITION.y === goal.y;
          if (reached) goal = movementGoals[++autoIndex];
          if (!goal) {
            stop();
            return;
          }
          const next = findPath(
            ecs.metadata.gameEntity.LEVEL.walkable,
            hero.POSITION,
            goal,
            true,
            true
          )[0];
          if (!next) return;
          const direction = relativeOrientations(ecs, hero.POSITION, next)[0];
          key = "Arrow" + direction[0].toUpperCase() + direction.slice(1);
        }
        if (!key) {
          stop();
          return;
        }
        if (
          key === "Enter" &&
          name !== "chat" &&
          !hero.PLAYER?.popup &&
          (!ecs?.metadata.interact.active ||
            !isInteractable(ecs, hero) ||
            !document.querySelector("#interact:not([hidden])"))
        )
          return;
        if (
          key === "Enter" &&
          !hero.PLAYER?.popup &&
          ecs?.getEntityById(ecs.metadata.interact.active)?.POPUP
        ) {
          openingPopup = true;
        } else if (name !== "movement") autoIndex++;
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key, bubbles: true })
        );
        setTimeout(
          () =>
            window.dispatchEvent(
              new KeyboardEvent("keyup", { key, bubbles: true })
            ),
          key.startsWith("Arrow") && (hero.PLAYER?.popup || name === "movement")
            ? 60
            : 240
        );
      }, 800);
    };
    const listener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const action = event.data?.type;
      if (action === "shadows") setShadows(event.data.enabled !== false);
      if (action === "pause") {
        setAudioActive(false);
        visible = false;
        stop();
        setPaused(true);
      }
      if (action === "play" || action === "auto" || action === "view") {
        stop();
        if (action !== "view") {
          window.focus();
          window.parent.postMessage(
            { type: "preview-focus", active: true },
            window.location.origin
          );
        }
        setInitial(false);
        setPaused(false);
        visible = true;
        if (!focused) autoplay();
      }
    };
    const reportState = () => {
      const hero = ecs && getHero(ecs);
      const popup =
        ecs && hero?.PLAYER?.popup
          ? ecs.assertById(hero.PLAYER.popup)
          : undefined;
      const editor = name === "sprites" ? popup?.POPUP?.sprite : undefined;
      window.parent.postMessage(
        {
          type: "preview-state",
          position: hero?.POSITION,
          hp: hero?.STATS?.hp,
          automatic,
          sprite: editor?.sprites[editor.selected],
          dialog:
            ecs && hero?.PLAYER?.popup
              ? getTab(ecs, ecs.assertById(hero.PLAYER.popup))
              : "",
          dimensions: ecs?.metadata.dimensions,
        },
        window.location.origin
      );
    };
    const report = setInterval(reportState, 200);
    reportState();
    const enableAudio = (event: Event) => {
      if (!event.isTrusted || name === "interface") return;
      setAudioActive(true);
      void ensureAudio();
    };
    const focus = () => {
      focused = true;
      stop();
      if (name !== "interface") setPaused(false);
      document.body.classList.add("focused");
      window.parent.postMessage(
        { type: "preview-focus", active: true },
        window.location.origin
      );
    };
    const blur = () => {
      setAudioActive(false);
      focused = false;
      document.body.classList.remove("focused");
      stop();
      if (name !== "game" && visible && !document.hidden) {
        setPaused(false);
        autoplay();
      } else setPaused(true);
      window.parent.postMessage(
        { type: "preview-focus", active: false },
        window.location.origin
      );
    };
    const touchFocus = (event: TouchEvent) => {
      enableAudio(event);
      window.focus();
      focus();
    };
    const silence = () => setAudioActive(false);
    window.addEventListener("pagehide", silence);
    window.addEventListener("pointerdown", enableAudio, true);
    window.addEventListener("keydown", enableAudio, true);
    window.addEventListener("touchstart", touchFocus, true);
    window.addEventListener("focus", focus);
    window.addEventListener("blur", blur);
    window.addEventListener("message", listener);
    window.parent.postMessage(
      { type: "preview-ready" },
      window.location.origin
    );
    return () => {
      stop();
      setAudioActive(false);
      window.removeEventListener("pagehide", silence);
      window.removeEventListener("pointerdown", enableAudio, true);
      window.removeEventListener("keydown", enableAudio, true);
      clearInterval(report);
      window.removeEventListener("keydown", capture, true);
      window.removeEventListener("keyup", capture, true);
      window.removeEventListener("touchstart", touchFocus, true);
      window.removeEventListener("focus", focus);
      window.removeEventListener("blur", blur);
      window.removeEventListener("message", listener);
    };
  }, [ecs, setPaused, setInitial, setShadows]);
  return null;
}
function NativeClient() {
  const { ecs, paused, suspended } = useWorld();
  const dimensions = useDimensions();
  if (!ecs) return null;
  return (
    <div className="ClientTerminal">
      <TerminalClientPreview
        world={ecs}
        columns={Math.max(
          33,
          Math.min(65, Math.floor(dimensions.screenWidth / 9))
        )}
        rows={30}
        cellWidth={9}
        cellHeight={16}
        paused={paused || suspended}
      />
      <DemoActions />
    </div>
  );
}

function Preview() {
  const [shadows, setShadows] = useState(true);
  useEffect(() => {
    document.body.dataset.shadows = String(shadows);
  }, [shadows]);
  return (
    <Dimensions
      className={`App ${
        name === "game"
          ? ""
          : name === "interface"
          ? "preview-interface"
          : "preview preview-" + name
      }`}
      style={
        name === "game" || name === "interface"
          ? undefined
          : ({
              "--controls-center-y": `calc(var(--terminal-height) / 2 + ${
                sceneLayout(name).topHudRows
              } * var(--cell-height))`,
            } as CSSProperties)
      }
      options={
        name === "game" || name === "interface"
          ? undefined
          : {
              visibleColumns: 23,
              visibleRows: sceneLayout(name).rows,
              topHudRows: sceneLayout(name).topHudRows,
            }
      }
    >
      <World
        persistent={name === "game"}
        createInitialWorld={
          name === "game"
            ? option && option !== "menu"
              ? () => createPresetWorld(option as PresetName)
              : undefined
            : () => createPreviewWorld(name, decodeURIComponent(option))
        }
      >
        {terminalClient ? (
          <NativeClient />
        ) : (
          <>
            <Stats />
            <Terminal
              shadows={shadows}
              renderer={
                name === "clients" && option === "html" ? "html" : "three-js"
              }
            >
              {name !== "game" && name !== "interface" && <DemoFrame />}
            </Terminal>
            <Controls compact={name !== "game" && name !== "interface"}>
              <DemoActions />
            </Controls>
          </>
        )}
        {name === "touch" && <TouchCursor />}
        <Bridge setShadows={setShadows} />
      </World>
    </Dimensions>
  );
}
createRoot(document.getElementById("root")!).render(<Preview />);
