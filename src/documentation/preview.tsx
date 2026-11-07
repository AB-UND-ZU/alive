import { createPresetWorld, PresetName } from "./presets";
import { DemoFrame } from "./DemoFrame";
import { InterfaceLabels } from "./InterfaceLabels";
import { muteAudio } from "../game/sound/resumable";
import { getTab } from "../engine/systems/popup";
import { getHero } from "../testing/harness";
import { parseCommand, executeCommand } from "../game/assets/commands";
import Row from "../components/Row";
import { createButton } from "../game/assets/ui";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import World from "../components/World";
import { useWorld } from "../bindings/hooks";
import Dimensions from "../components/Dimensions";
import Terminal from "../components/Terminal";
import Controls from "../components/Controls";
import Stats from "../components/Stats";
import { createPreviewWorld, sceneDefinitions, SceneName } from "./scenes";
import "../components/App/index.css";
muteAudio();
const [scene, option = ""] = window.location.hash.slice(1).split("/");
const name = (scene || "game") as SceneName;
function DemoActions() {
  if (name === "game" || name === "interface") return null;
  return (
    <div className="DemoActions">
      <button
        aria-label="Reset"
        onClick={() =>
          window.parent.postMessage(
            { type: "preview-reset" },
            window.location.origin
          )
        }
      >
        <Row cells={createButton("RESET", 7, false, false, false, "red")} />
      </button>
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
        !sceneDefinitions[name].keys.length ||
        autoIndex >= sceneDefinitions[name].keys.length
      )
        return;
      automatic = true;
      timer = setInterval(() => {
        const keys = sceneDefinitions[name].keys;
        const key = keys[autoIndex++];
        if (!key) {
          stop();
          return;
        }
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key, bubbles: true })
        );
        setTimeout(
          () =>
            window.dispatchEvent(
              new KeyboardEvent("keyup", { key, bubbles: true })
            ),
          240
        );
      }, 800);
    };
    const listener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const action = event.data?.type;
      if (action === "command" && ecs) {
        const hero = getHero(ecs),
          command = parseCommand(event.data.command);
        const result =
          hero && command
            ? executeCommand(ecs, hero, command)
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
    const report = setInterval(() => {
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
    }, 200);
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
      window.removeEventListener("focus", focus);
      window.removeEventListener("blur", blur);
      window.removeEventListener("message", listener);
    };
  }, [ecs, setPaused, setInitial]);
  return null;
}
createRoot(document.getElementById("root")!).render(
  <Dimensions
    className={`App ${name === "game" ? "" : "preview preview-" + name}`}
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
        {name !== "game" && <DemoFrame island={name === "interface"} />}
      </Terminal>
      <Controls compact={name !== "game" && name !== "interface"}>
        <DemoActions />
      </Controls>
      <Bridge />
      {name === "interface" && <InterfaceLabels />}
    </World>
  </Dimensions>
);
