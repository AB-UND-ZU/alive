import Controls from "../Controls";
import Dimensions from "../Dimensions";
import Stats from "../Stats";
import Terminal from "../Terminal";
import World from "../World";
import "./index.css";

export default function App() {
  return (
    <Dimensions className="App">
      <World>
        <Stats />
        <Terminal />
        <Controls />
      </World>
    </Dimensions>
  );
}
