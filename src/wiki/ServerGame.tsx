import { capturePreviewKey } from "./previewInput";
import { useEffect, useMemo, useRef } from "react";
import { useWorld } from "../renderers/interface/hooks";
import Dimensions from "../components/Dimensions";
import World from "../components/World";
import { ensureAudio, setAudioActive } from "../game/sound/resumable";

function Connection({
  address,
  username,
  started,
  joined,
}: {
  address: string;
  username?: string;
  started: { current: boolean };
  joined: { current: boolean };
}) {
  const {
    joinServer,
    serverStatus,
    loadingSounds,
    paused,
    setPaused,
    setInitial,
  } = useWorld();
  useEffect(() => {
    if (started.current || loadingSounds || !joinServer) return;
    started.current = true;
    joinServer(address, username);
  }, [address, username, joinServer, loadingSounds, started]);
  useEffect(() => {
    if (serverStatus === "connected") joined.current = true;
    window.parent.postMessage(
      {
        type: "server-status",
        status: serverStatus || (joined.current ? "closed" : "connecting"),
      },
      window.location.origin
    );
  }, [serverStatus, joined]);
  useEffect(() => {
    if (serverStatus === "connected")
      window.parent.postMessage(
        { type: "preview-ready" },
        window.location.origin
      );
  }, [serverStatus]);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const hiddenPause = useRef(false);
  useEffect(() => {
    const visibility = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent
      )
        return;
      if (event.data?.type === "pause" && !pausedRef.current) {
        hiddenPause.current = true;
        setPaused(true);
      }
      if (event.data?.type === "view" && hiddenPause.current) {
        hiddenPause.current = false;
        setPaused(false);
        setInitial(false);
      }
    };
    window.addEventListener("keydown", capturePreviewKey, true);
    window.addEventListener("keyup", capturePreviewKey, true);
    window.addEventListener("message", visibility);
    return () => {
      window.removeEventListener("keydown", capturePreviewKey, true);
      window.removeEventListener("keyup", capturePreviewKey, true);
      window.removeEventListener("message", visibility);
    };
  }, [setPaused, setInitial]);
  useEffect(() => {
    const activate = (event: Event) => {
      if (!event.isTrusted) return;
      window.parent.postMessage(
        { type: "preview-focus", active: true },
        window.location.origin
      );
      setAudioActive(true);
      void ensureAudio();
    };
    const silence = () => {
      setAudioActive(false);
      window.parent.postMessage(
        { type: "preview-focus", active: false },
        window.location.origin
      );
    };
    window.addEventListener("pointerdown", activate, true);
    window.addEventListener("keydown", activate, true);
    window.addEventListener("blur", silence);
    window.addEventListener("pagehide", silence);
    return () => {
      silence();
      window.removeEventListener("pointerdown", activate, true);
      window.removeEventListener("keydown", activate, true);
      window.removeEventListener("blur", silence);
      window.removeEventListener("pagehide", silence);
    };
  }, []);
  return null;
}

export function ServerGame({ children }: React.PropsWithChildren) {
  const started = useRef(false);
  const joined = useRef(false);
  const query = new URLSearchParams(window.location.search);
  const address = query.get("server") || "";
  const username = query.get("username") || undefined;
  const slot = query.get("client") === "2" ? "2" : "1";
  const storage = useMemo(
    () => ({
      getItem: (key: string) =>
        localStorage.getItem(`alive.wiki.client.${slot}:${key}`),
      removeItem: (key: string) =>
        localStorage.removeItem(`alive.wiki.client.${slot}:${key}`),
      setItem: (key: string, value: string) =>
        localStorage.setItem(`alive.wiki.client.${slot}:${key}`, value),
    }),
    [slot]
  );
  return (
    <Dimensions className="App">
      <World serverStorage={storage}>
        {children}
        <Connection
          address={address}
          username={username}
          started={started}
          joined={joined}
        />
      </World>
    </Dimensions>
  );
}
