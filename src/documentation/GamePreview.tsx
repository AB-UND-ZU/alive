import { useEffect, useRef, useState } from "react";
import { PresetName } from "./presets";
import { createDialog } from "../game/assets/ui";
import { Pixels } from "./visuals";
import { Choice } from "./visuals";
import { sceneDefinitions, SceneName } from "./scenes";

export function GamePreview({
  name,
  base,
  preset,
  testMode = true,
}: {
  name: SceneName;
  base: string;
  preset?: PresetName;
  testMode?: boolean;
}) {
  const frame = useRef<HTMLIFrameElement>(null),
    container = useRef<HTMLElement>(null),
    pending = useRef<string>(),
    command = useRef<string>(),
    ready = useRef(false),
    visible = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [isReady, setReady] = useState(false);
  const [active, setActive] = useState(false),
    [revision, setRevision] = useState(0),
    [option, setOption] = useState("");
  const [state, setState] = useState<{
    x?: number;
    y?: number;
    hp?: number;
    dialog?: string;
    automatic?: boolean;
  }>({});
  const [width, setWidth] = useState(576);
  const options: Partial<Record<SceneName, string[]>> = {
    abilities: ["wave", "beam", "trap", "dash", "bolt", "blast"],
    skills: ["slash", "bow", "spear", "wand", "zap", "block", "totem"],
    harvesting: ["axe", "pickaxe", "shovel"],
    classes: ["rogue", "knight", "mage", "scout", "???"],
  };
  const send = (type: string) =>
    frame.current?.contentWindow?.postMessage({ type }, window.location.origin);
  useEffect(() => {
    const pause = () => {
      pending.current = undefined;
      send("pause");
    };
    const message = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      if (event.data.type === "preview-unfocus") {
        frame.current?.blur();
        document.getElementById("content")?.focus({ preventScroll: true });
        setActive(false);
      }
      if (event.data.type === "preview-focus") setActive(event.data.active);
      if (event.data.type === "preview-reset") {
        ready.current = false;
        setReady(false);
        pending.current = visible.current ? "view" : "pause";
        setActive(false);
        setRevision((n) => n + 1);
      }
      if (event.data.type === "preview-state")
        setState({
          x: event.data.position?.x,
          y: event.data.position?.y,
          hp: event.data.hp,
          dialog: event.data.dialog,
          automatic: event.data.automatic,
        });
      if (event.data.type === "preview-ready") {
        ready.current = true;
        setReady(true);
        const action =
          pending.current || (visible.current ? "view" : undefined);
        if (action) {
          send(action);
        }
        pending.current = undefined;
        if (command.current) {
          frame.current?.contentWindow?.postMessage(
            { type: "command", command: command.current },
            window.location.origin
          );
          command.current = undefined;
        }
      }
    };
    const show = () => {
      if (document.hidden || !visible.current) return;
      setLoaded(true);

      if (ready.current) send("view");
      else pending.current = "view";
    };
    const visibility = () => {
      if (document.hidden) pause();
      else show();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
        if (entry.isIntersecting) show();
        else pause();
      },
      { threshold: 0.05 }
    );
    if (container.current) observer.observe(container.current);
    const resize = new ResizeObserver(([entry]) =>
      setWidth(
        Math.max(
          378,
          name === "game" || name === "interface"
            ? Math.min(576, Math.floor(entry.contentRect.width / 18) * 18)
            : 378
        )
      )
    );
    if (container.current) resize.observe(container.current);
    const runCommand = (event: Event) => {
      if (name !== "chat") return;
      const value = (event as CustomEvent<string>).detail;
      if (ready.current)
        frame.current?.contentWindow?.postMessage(
          { type: "command", command: value },
          window.location.origin
        );
      else {
        command.current = value;
        setLoaded(true);
      }
      container.current?.scrollIntoView({ block: "start" });
    };
    window.addEventListener("docs-command", runCommand);
    window.addEventListener("message", message);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      send("pause");
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("docs-command", runCommand);
      window.removeEventListener("message", message);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [name]);
  return (
    <section
      ref={container}
      className={`Preview ${active ? "active" : ""}`}
      data-scene={name}
      aria-label={sceneDefinitions[name].title}
    >
      {options[name] && (
        <Choice
          label="Select"
          values={options[name]!}
          value={option || options[name]![0]}
          onChange={(value) => {
            ready.current = false;
            setReady(false);
            pending.current = visible.current ? "view" : undefined;
            setState({});
            setOption(value);

            setActive(false);
            setRevision((n) => n + 1);
          }}
        />
      )}
      <div className="PreviewScroll">
        {!isReady && (
          <div className="PreviewLoading" role="status">
            <Pixels rows={[createDialog("Loading map...")]} />
          </div>
        )}
        {loaded ? (
          <iframe
            key={`${name}-${revision}`}
            ref={frame}
            title={sceneDefinitions[name].title}
            tabIndex={name === "interface" ? -1 : 0}
            src={`${base}preview.html${testMode ? "?test" : ""}#${name}${
              preset || option ? "/" + encodeURIComponent(preset || option) : ""
            }`}
            style={{ width, height: 640 }}
            data-x={state.x}
            data-y={state.y}
            data-hp={state.hp}
            data-dialog={state.dialog}
            data-auto={state.automatic}
          />
        ) : (
          <div
            className="PreviewPlaceholder"
            style={{ width, height: 640 }}
            aria-label="Preview loads when visible"
          />
        )}
      </div>
    </section>
  );
}
