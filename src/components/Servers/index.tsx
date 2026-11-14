import { useState } from "react";
import { useWorld } from "../../bindings/hooks";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import { createButton, createDialog, createText } from "../../game/assets/ui";
import { colors } from "../../game/assets/colors";
import "./index.css";

export default function Servers({ onBack }: { onBack: () => void }) {
  const { joinServer, serverStatus } = useWorld();
  const dimensions = useDimensions();
  const [address, setAddress] = useState(() => {
    try {
      return (
        localStorage.getItem("alive.lastServer") ||
        `${window.location.hostname}:3001`
      );
    } catch {
      return `${window.location.hostname}:3001`;
    }
  });
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string>();
  const connecting =
    serverStatus === "connecting" || serverStatus === "reconnecting";
  const width = Math.max(8, Math.min(30, dimensions.visibleColumns - 2));
  const connect = (event: React.FormEvent) => {
    event.preventDefault();
    if (connecting || !joinServer) return;
    try {
      localStorage.setItem("alive.lastServer", address);
      setError("");
      joinServer(address);
    } catch {
      setError("Storage unavailable");
    }
  };
  return (
    <form
      className="Servers"
      onSubmit={connect}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Row cells={createText("SERVERS", colors.yellow)} />
      <Row />
      <Row cells={createText("Host URL")} />
      <label className="ServerAddress">
        <Row cells={createDialog((address || " ").slice(-(width - 1)) + "_")} />
        <input
          aria-label="Host URL"
          type="text"
          inputMode="url"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          maxLength={200}
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <Row />
      <button
        type="submit"
        aria-label="Connect to server"
        disabled={connecting}
        onFocus={() => setFocused("connect")}
        onBlur={() => setFocused(undefined)}
      >
        <Row
          cells={createButton(
            connecting ? "CONNECTING" : "CONNECT",
            10,
            connecting,
            false,
            focused === "connect",
            "lime"
          )}
        />
      </button>
      <Row
        cells={createText(
          error || (serverStatus === "rejected" ? "Connection rejected" : ""),
          colors.red
        )}
      />
      <button
        type="button"
        aria-label="Back to menu"
        onFocus={() => setFocused("back")}
        onBlur={() => setFocused(undefined)}
        onClick={onBack}
      >
        <Row
          cells={createButton(
            "BACK",
            10,
            false,
            false,
            focused === "back",
            "red"
          )}
        />
      </button>
    </form>
  );
}
