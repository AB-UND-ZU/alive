import { enableTouchEmulation, TouchCursor } from "./TouchControls";
import { createPresetWorld, PresetName } from "./presets";
import { DemoFrame } from "./DemoFrame";
import { muteAudio } from "../game/sound/resumable";
import { findPath, relativeOrientations } from "../game/math/path";
import { getIdentifierAndComponents } from "../engine/utils";
import { getTab, submitChat } from "../engine/systems/popup";
import { isInteractable } from "../engine/systems/freeze";
import { getHero } from "../testing/harness";
import { Button } from "./visuals";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import World from "../components/World";
import { useWorld } from "../bindings/hooks";
import Dimensions from "../components/Dimensions";
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
muteAudio();
const [scene, option = ""] = window.location.hash.slice(1).split("/");
const name = (scene || "game") as SceneName;
if (name === "touch") void enableTouchEmulation();
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
function Bridge() {
  const { ecs, setPaused, setInitial } = useWorld();
  useEffect(() => {
    let visible = false;
    let focused = false;
    let automatic = false;
    let autoIndex = 0;
    let openingPopup = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      clearInterval(timer);
      automatic = false;
      for (const key of new Set([
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        ...sceneDefinitions[name].keys,
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
        (name !== "movement" && !sceneDefinitions[name].keys.length) ||
        autoIndex >=
          (name === "movement"
            ? movementGoals.length
            : sceneDefinitions[name].keys.length)
      )
        return;
      automatic = true;
      timer = setInterval(() => {
        const keys = sceneDefinitions[name].keys;
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
      if (action === "command" && ecs) {
        const hero = getHero(ecs);
        const result =
          hero && typeof event.data.command === "string"
            ? submitChat(ecs, hero, event.data.command)
            : "Invalid command";
        window.parent.postMessage(
          {
            type: "command-result",
            result: typeof result === "string" ? result : "OK",
          },
          window.location.origin
        );
      }

      if (action === "pause") {
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
      window.parent.postMessage(
        {
          type: "preview-state",
          position: hero?.POSITION,
          hp: hero?.STATS?.hp,
          automatic,
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
    const touchFocus = () => {
      window.focus();
      focus();
    };
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
      clearInterval(report);
      window.removeEventListener("keydown", capture, true);
      window.removeEventListener("keyup", capture, true);
      window.removeEventListener("touchstart", touchFocus, true);
      window.removeEventListener("focus", focus);
      window.removeEventListener("blur", blur);
      window.removeEventListener("message", listener);
    };
  }, [ecs, setPaused, setInitial]);
  return null;
}
createRoot(document.getElementById("root")!).render(
  <Dimensions
    className={`App ${
      name === "game"
        ? ""
        : name === "interface"
        ? "preview-interface"
        : "preview preview-" + name
    }`}
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
      <Stats />
      <Terminal>
        {name !== "game" && name !== "interface" && <DemoFrame />}
      </Terminal>
      <Controls compact={name !== "game" && name !== "interface"}>
        <DemoActions />
      </Controls>
      {name === "touch" && <TouchCursor />}
      <Bridge />
    </World>
  </Dimensions>
);
