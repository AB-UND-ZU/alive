import { Sprite } from "../engine/components/sprite";
import { SpriteCode } from "./SpriteCode";
import { useEffect, useRef, useState } from "react";
import { displayedClasses } from "../game/assets/pixels";
import { PresetName, presets } from "./presets";
import { createDialog } from "../game/assets/ui";
import { Pixels, Text } from "./visuals";
import "./preview-layout.css";
import { GridCenteredNote } from "./GridCenteredNote";
import { Choice } from "./visuals";
import { sceneDefinitions, sceneLayout, SceneName } from "./scenes";

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
    sprite?: Sprite;
  }>({});
  const responsive = name === "chat" || name === "sprites";
  const [width, setWidth] = useState(
    name === "game" || name === "interface" ? 576 : 414
  );
  const options: Partial<Record<SceneName, string[]>> = {
    abilities: ["wave", "beam", "trap", "dash", "bolt", "blast"],
    skills: ["slash", "bow", "spear", "wand", "zap", "block", "totem"],
    harvesting: ["axe", "pickaxe", "shovel"],
    classes: [...displayedClasses],
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
        setState({});
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
          sprite: event.data.sprite,
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
          name === "game" || name === "interface" ? 378 : 414,
          name === "game" || name === "interface"
            ? Math.min(576, Math.floor(entry.contentRect.width / 18) * 18)
            : 414
        )
      )
    );
    if (container.current) resize.observe(container.current);
    window.addEventListener("message", message);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      send("pause");
      observer.disconnect();
      resize.disconnect();
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
      <div className="PreviewLayout">
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
                preset || option
                  ? "/" + encodeURIComponent(preset || option)
                  : ""
              }`}
              style={{
                width,
                height: name === "chat" ? "auto" : sceneLayout(name).height,
                maxWidth: responsive ? "100%" : undefined,
                aspectRatio:
                  name === "chat"
                    ? `414 / ${sceneLayout(name).height}`
                    : undefined,
              }}
              data-x={state.x}
              data-y={state.y}
              data-hp={state.hp}
              data-dialog={state.dialog}
              data-auto={state.automatic}
            />
          ) : (
            <div
              className="PreviewPlaceholder"
              style={{
                width,
                height: name === "chat" ? "auto" : sceneLayout(name).height,
                maxWidth: responsive ? "100%" : undefined,
                aspectRatio:
                  name === "chat"
                    ? `414 / ${sceneLayout(name).height}`
                    : undefined,
              }}
              aria-label="Preview loads when visible"
            />
          )}
        </div>
        <GridCenteredNote>
          <Text>
            {name === "game" && preset
              ? `Play ${presets[preset].title} using the normal game controls.`
              : sceneDefinitions[name].instruction}
          </Text>
        </GridCenteredNote>
      </div>
      {name === "sprites" && <SpriteCode sprite={state.sprite} />}
    </section>
  );
}
