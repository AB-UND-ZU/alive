import { Canvas } from "@react-three/fiber";
import "./index.css";
import Systems from "../Systems";
import Camera from "../Camera";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import Paused from "../Paused";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import { colors } from "../../game/assets/colors";
import { overscanRows } from "../Dimensions/sizing";
import { ExtendedStats } from "../Debug";
import { createText } from "../../game/assets/ui";
import { InstanceRoot } from "../Entity/Instances";
import { LightingContext } from "../Entity/CoveredLight";
import ShadowCache from "../Entity/ShadowCache";

const stats = false;
const controls = false;

export const frameColor = colors.silver;

export default function Terminal({
  children,
  shadows = true,
}: React.PropsWithChildren<{ shadows?: boolean }>) {
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
      <Canvas shadows={shadows ? "basic" : false} flat>
        <LightingContext.Provider value={shadows}>
          {stats && <ExtendedStats />}
          {controls && <OrbitControls />}
          <InstanceRoot />
          <ShadowCache />
          <ambientLight intensity={shadows ? Math.PI / 8 : Math.PI} />
          <Camera />
          <Systems />
        </LightingContext.Provider>
      </Canvas>
      <div className="RightEdge">
        {Array.from({ length: dimensions.renderedRows - overscanRows + 1 }).map(
          (_, index) => (
            <Row key={index} cells={createText("│", frameColor)} />
          )
        )}
      </div>
      {children}
      <Paused />
    </main>
  );
}
