import Controls from "../Controls";
import Dimensions from "../Dimensions";
import Screen from "../Screen";
import Stats from "../Stats";
import "./index.css";

export default function App() {
  return (
    <Dimensions className="App">
      <Stats />
      <Screen />
      <Controls />
    </Dimensions>
  );
}
