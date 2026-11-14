import { useEffect, useRef, useState } from "react";
import { serverUrl, ConnectionStatus } from "../engine/network/client";
import { Button, Input, Text } from "./visuals";
import "./ServerPreview.css";

export function ServerPreview({ base }: { base: string }) {
  const frames = useRef<(HTMLIFrameElement | null)[]>([]);
  const [address, setAddress] = useState(`${window.location.hostname}:3001`);
  const [connection, setConnection] = useState<{
    url: string;
    revision: number;
  }>();
  const [error, setError] = useState("");
  const [statuses, setStatuses] = useState<ConnectionStatus[]>([]);
  useEffect(() => {
    if (!connection) return;
    let timer: ReturnType<typeof setTimeout>;
    const states: ConnectionStatus[] = ["connecting", "connecting"];
    const connected = [false, false];
    const fail = () => {
      setError("Connection failed. Check the server URL and try again.");
      setConnection(undefined);
      setStatuses([]);
    };
    const wait = () => {
      clearTimeout(timer);
      timer = setTimeout(fail, 15000);
    };
    wait();
    const message = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const index = frames.current.findIndex(
        (frame) => frame?.contentWindow === event.source
      );
      if (index < 0 || event.data?.type !== "server-status") return;
      const status = event.data.status as ConnectionStatus;
      if (
        ![
          "connecting",
          "connected",
          "reconnecting",
          "rejected",
          "closed",
        ].includes(status)
      )
        return;
      if (
        status === "rejected" ||
        status === "closed" ||
        (status === "reconnecting" && !connected[index])
      ) {
        fail();
        return;
      }
      const previous = states[index];
      states[index] = status;
      if (status === "connected") connected[index] = true;
      setStatuses([...states]);
      if (states.every((state) => state === "connected")) clearTimeout(timer);
      else if (previous === "connected") wait();
    };
    window.addEventListener("message", message);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("message", message);
    };
  }, [connection]);
  const connect = () => {
    try {
      const url = serverUrl(address.trim());
      setError("");
      setStatuses(["connecting", "connecting"]);
      setConnection((previous) => ({
        url,
        revision: (previous?.revision || 0) + 1,
      }));
    } catch {
      setError("Enter a valid server URL.");
    }
  };
  return (
    <section className="ServerPreview" aria-label="Two-player server preview">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          connect();
        }}
      >
        <Input label="Server URL" value={address} onChange={setAddress} />
        <Button onClick={connect} palette="lime">
          Connect
        </Button>
      </form>
      {error && (
        <p role="alert">
          <Text>{error}</Text>
        </p>
      )}
      <div className="ServerGames">
        {[0, 1].map((index) => (
          <section key={index} aria-label={`Player ${index + 1}`}>
            <p role="status">
              <Text>{`Player ${index + 1}${
                statuses[index] ? ": " + statuses[index] : ""
              }`}</Text>
            </p>
            {connection && (
              <iframe
                key={connection.revision}
                ref={(frame) => {
                  frames.current[index] = frame;
                }}
                title={`Player ${index + 1} game`}
                src={`${base}preview.html?server=${encodeURIComponent(
                  connection.url
                )}&client=${index + 1}#servers`}
              />
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
