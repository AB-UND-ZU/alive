import { Canvas } from "@react-three/fiber";
import "./index.css";
import Systems from "../Systems";
import Camera from "../Camera";
import { OrbitControls } from "@react-three/drei";
import { useWorld } from "../../bindings/hooks";
import Paused from "../Paused";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import { createText } from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { overscanRows } from "../Dimensions/sizing";
import { ExtendedStats } from "../Debug";

const stats = false;
const controls = false;

export default function Terminal() {
  const dimensions = useDimensions();
  const { paused, initial } = useWorld();

  return (
    <main className="Terminal">
      <div className="LeftEdge">
        {Array.from({ length: dimensions.renderedRows - overscanRows + 1 }).map(
          (_, index) => (
            <Row key={index} cells={createText("│", colors.grey)} />
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
            <Row key={index} cells={createText("│", colors.grey)} />
          )
        )}
      </div>
      <Paused />
    </main>
  );
}
