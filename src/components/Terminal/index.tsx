import { Canvas } from "@react-three/fiber";
import "./index.css";
import Systems from "../Systems";
import Camera from "../Camera";
import { OrbitControls, Stats } from "@react-three/drei";
import { useWorld } from "../../bindings/hooks";
import Paused from "../Paused";

const stats = false;
const controls = false;

export default function Terminal() {
  const { paused, initial } = useWorld();
  return (
    <main className="Terminal">
      <Canvas shadows="basic" flat>
        {stats && <Stats />}
        {controls && <OrbitControls />}
        <ambientLight intensity={Math.PI / 8} />
        <Camera />
        <Systems />
      </Canvas>
      {(paused || initial) && <Paused initial={initial} />}
    </main>
  );
}
