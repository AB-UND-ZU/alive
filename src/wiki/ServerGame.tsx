import { useEffect, useMemo, useRef } from "react";
import { useWorld } from "../bindings/hooks";
import Controls from "../components/Controls";
import Dimensions from "../components/Dimensions";
import Stats from "../components/Stats";
import Terminal from "../components/Terminal";
import World from "../components/World";
import { ensureAudio, setAudioActive } from "../game/sound/resumable";

function Connection({
  address,
  username,
  started,
}: {
  address: string;
  username?: string;
  started: { current: boolean };
}) {
  const { joinServer, serverStatus, loadingSounds } = useWorld();
  useEffect(() => {
    if (started.current || loadingSounds || !joinServer) return;
    started.current = true;
    joinServer(address, username);
  }, [address, username, joinServer, loadingSounds, started]);
  useEffect(() => {
    window.parent.postMessage(
      { type: "server-status", status: serverStatus || "connecting" },
      window.location.origin
    );
  }, [serverStatus]);
  useEffect(() => {
    const activate = (event: Event) => {
      if (!event.isTrusted) return;
      setAudioActive(true);
      void ensureAudio();
    };
    const silence = () => setAudioActive(false);
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

export function ServerGame() {
  const started = useRef(false);
  const query = new URLSearchParams(window.location.search);
  const address = query.get("server") || "";
  const username = query.get("username") || undefined;
  const slot = query.get("client") === "2" ? "2" : "1";
  const storage = useMemo(
    () => ({
      getItem: (key: string) =>
        localStorage.getItem(`alive.wiki.client.${slot}:${key}`),
      setItem: (key: string, value: string) =>
        localStorage.setItem(`alive.wiki.client.${slot}:${key}`, value),
    }),
    [slot]
  );
  return (
    <Dimensions className="App">
      <World serverStorage={storage}>
        <Stats />
        <Terminal />
        <Controls pauseOnBlur={false} />
        <Connection address={address} username={username} started={started} />
      </World>
    </Dimensions>
  );
}
