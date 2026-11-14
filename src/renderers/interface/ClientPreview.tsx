import { useEffect } from "react";
import { useWorld } from "./hooks";
import { PLAYER } from "../../engine/components/player";
import { POPUP } from "../../engine/components/popup";
import { getTab } from "../../engine/systems/popup";
import { ensureAudio, setAudioActive } from "../../game/sound/resumable";

export const isClientPreview = () =>
  new URLSearchParams(window.location.search).has("preview");

export default function ClientPreview() {
  const { ecs, suspended, setInitial, setPaused } = useWorld();
  useEffect(() => {
    let visible = false;
    setAudioActive(false);
    const send = (message: object) =>
      window.parent.postMessage(message, window.location.origin);
    const message = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent
      )
        return;
      if (["play", "auto", "view"].includes(event.data?.type)) {
        visible = true;
        setInitial(false);
        setPaused(false);
      } else if (event.data?.type === "pause") {
        visible = false;
        setAudioActive(false);
        setPaused(true);
      }
    };
    const focus = () => {
      if (visible) setPaused(false);
      send({ type: "preview-focus", active: true });
    };
    const blur = () => {
      setAudioActive(false);
      setPaused(!visible || document.hidden);
      send({ type: "preview-focus", active: false });
    };
    const input = (event: Event) => {
      if (!event.isTrusted) return;
      setAudioActive(true);
      void ensureAudio();
    };
    const key = (event: KeyboardEvent) => {
      const hero = ecs?.getEntities([PLAYER])[0];
      if (
        event.key === "Escape" &&
        !ecs?.getEntityByIdAndComponents(hero?.[PLAYER].popup, [POPUP])?.[POPUP]
          .active
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        send({ type: "preview-unfocus" });
      } else if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          " ",
          "Tab",
        ].includes(event.key)
      ) {
        event.preventDefault();
      }
    };
    const report = () => {
      const hero = ecs?.getEntities([PLAYER])[0];
      const popup = ecs?.getEntityByIdAndComponents(hero?.[PLAYER].popup, [
        POPUP,
      ]);
      send({
        type: "preview-state",
        position: hero?.POSITION,
        hp: hero?.STATS?.hp,
        dialog: ecs && popup?.[POPUP].active ? getTab(ecs, popup) : "",
        automatic: false,
      });
    };
    const timer = setInterval(report, 200);
    window.addEventListener("message", message);
    window.addEventListener("focus", focus);
    window.addEventListener("blur", blur);
    window.addEventListener("keydown", key, true);
    window.addEventListener("keydown", input, true);
    window.addEventListener("pointerdown", input, true);
    if (!suspended) send({ type: "preview-ready" });
    report();
    return () => {
      clearInterval(timer);
      setAudioActive(false);
      window.removeEventListener("message", message);
      window.removeEventListener("focus", focus);
      window.removeEventListener("blur", blur);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("keydown", input, true);
      window.removeEventListener("pointerdown", input, true);
    };
  }, [ecs, suspended, setInitial, setPaused]);
  return null;
}
