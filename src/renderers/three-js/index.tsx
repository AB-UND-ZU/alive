import { WorldProvider, useWorld } from "../interface/hooks";
import { DimensionsContext } from "../../components/Dimensions/sizing";
import { pixels } from "../interface/dimensions";
import { Canvas } from "@react-three/fiber";
import Camera from "./Camera";
import Systems from "./Systems";
import { InstanceRoot } from "./Entity/Instances";
import { LightingContext } from "./Entity/CoveredLight";
import ShadowCache from "./Entity/ShadowCache";
import type { RendererCapabilities, RendererProps } from "../interface/types";

export const capabilities: RendererCapabilities = {
  lighting: true,
  shadows: true,
  healthBars: true,
  stackDots: true,
  smoothMovement: true,
};

export default function ThreeJsRenderer({
  world,
  columns,
  rows,
  cellWidth,
  cellHeight,
  paused,
  shadows = true,
}: RendererProps) {
  const context = useWorld();
  const aspectRatio = cellWidth / cellHeight;
  const dimensions = {
    ...world.metadata.dimensions,
    renderedColumns: columns,
    renderedRows: rows,
    cellWidth,
    cellHeight,
    pixelSize: cellHeight / pixels,
    aspectRatio,
    renderedDiagonal: Math.sqrt(columns ** 2 * aspectRatio + rows ** 2),
  };

  return (
    <WorldProvider value={{ ...context, ecs: world, paused }}>
      <DimensionsContext.Provider value={dimensions}>
        <Canvas shadows={shadows ? "basic" : false} flat>
          <LightingContext.Provider value={shadows}>
            <InstanceRoot />
            <ShadowCache />
            <ambientLight intensity={shadows ? Math.PI / 8 : Math.PI} />
            <Camera />
            <Systems />
          </LightingContext.Provider>
        </Canvas>
      </DimensionsContext.Provider>
    </WorldProvider>
  );
}
