import { useEffect } from "react";
import Dimensions, { useDimensions } from "../../components/Dimensions";
import World from "../../components/World";
import { useWorld } from "../interface/hooks";
import ClientPreview, { isClientPreview } from "../interface/ClientPreview";
import BrowserPreview from "./BrowserPreview";
import "../../index.css";
import "../../components/App/index.css";
import "./App.css";

function TerminalClient() {
  const { ecs, paused, suspended, setInitial, setPaused } = useWorld();
  const dimensions = useDimensions();
  const preview = isClientPreview();
  useEffect(() => {
    if (!suspended && !preview) {
      setInitial(false);
      setPaused(false);
    }
  }, [ecs, suspended, preview, setInitial, setPaused]);
  if (!ecs) return null;
  const cellHeight = Math.min(
    dimensions.cellHeight,
    dimensions.screenWidth / 33 / (9 / 16),
    dimensions.screenHeight / 24
  );
  const cellWidth = cellHeight * (9 / 16);
  return (
    <BrowserPreview
      world={ecs}
      columns={Math.max(33, Math.floor(dimensions.screenWidth / cellWidth))}
      rows={Math.max(24, Math.floor(dimensions.screenHeight / cellHeight))}
      cellWidth={cellWidth}
      cellHeight={cellHeight}
      paused={paused || suspended}
      interactiveSession
    />
  );
}

export default function App() {
  const preview = isClientPreview();
  return (
    <Dimensions className="App TerminalClientApp">
      <World persistent={!preview}>
        <TerminalClient />
        {preview && <ClientPreview />}
      </World>
    </Dimensions>
  );
}
