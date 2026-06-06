import { Canvas } from "@react-three/fiber";
import "./index.css";
import Systems from "../Systems";
import Camera from "../Camera";
import { OrbitControls } from "@react-three/drei";
import Paused from "../Paused";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import { colors } from "../../game/assets/colors";
import { overscanRows } from "../Dimensions/sizing";
import { ExtendedStats } from "../Debug";
import { createText } from "../../game/assets/ui";

const stats = false;
const controls = false;

export const frameColor = colors.silver;

export default function Terminal() {
  const dimensions = useDimensions();

  return (
    <main className="Terminal">
      <div className="LeftEdge">
        {Array.from({ length: dimensions.renderedRows - overscanRows + 1 }).map(
          (_, index) => (
            <Row key={index} cells={createText("│", frameColor)} />
          )
        )}
      </div>
      <Canvas shadows="basic" flat>
        {stats && <ExtendedStats />}
        {controls && <OrbitControls />}
        <ambientLight intensity={Math.PI / 8} />
        <Camera />
        <Systems />
      </Canvas>
      <div className="RightEdge">
        {Array.from({ length: dimensions.renderedRows - overscanRows + 1 }).map(
          (_, index) => (
            <Row key={index} cells={createText("│", frameColor)} />
          )
        )}
      </div>
      <Paused />
    </main>
  );
}
