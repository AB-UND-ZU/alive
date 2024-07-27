import { useRef } from "react";
import Controls from "../Controls";
import Dimensions from "../Dimensions";
import Screen from "../Screen";
import Stats from "../Stats";
import "./index.css";

export default function App() {
  const appRef = useRef<HTMLDivElement>(null);
  return (
    <div className="App" ref={appRef}>
      <Stats />
      <Screen />
      <Controls />

      <Dimensions appRef={appRef} />
    </div>
  );
}
