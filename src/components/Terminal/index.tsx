import { Canvas } from "@react-three/fiber";
import "./index.css";
import System from "../System";
import { World } from "../../engine";

export default function Terminal({ world }: { world: World }) {
  return (
    <main className="Terminal">
      <Canvas
        camera={{
          position: [0, 0, 32],
          zoom: 64,
          near: 0.1,
          far: 64,
        }}
        orthographic
        shadows
        flat
      >
        <System world={world} />
      </Canvas>
    </main>
  );
}
