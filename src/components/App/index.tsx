import Controls from "../Controls";
import Dimensions from "../Dimensions";
import Stats from "../Stats";
import Terminal from "../Terminal";
import "./index.css";

export default function App() {
  return (
    <Dimensions className="App">
      <Stats />
      <Terminal />
      <Controls />
    </Dimensions>
  );
}
