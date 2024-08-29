import { Canvas } from "@react-three/fiber";
import "./index.css";
import Systems from "../Systems";
import Camera from "../Camera";
import { OrbitControls, Stats } from "@react-three/drei";

const stats = false;
const controls = false;

export default function Terminal() {
  return (
    <main className="Terminal">
      <Canvas shadows="basic" flat>
        {stats && <Stats />}
        {controls && <OrbitControls />}
        <ambientLight intensity={Math.PI / 8} />
        <Camera />
        <Systems />
      </Canvas>
    </main>
  );
}
