import { Canvas } from "@react-three/fiber";
import "./index.css";
import Systems from "../Systems";
import Camera from "../Camera";

export default function Terminal() {
  return (
    <main className="Terminal">
      <Canvas shadows flat>
        <Camera />
        <Systems />
      </Canvas>
    </main>
  );
}
