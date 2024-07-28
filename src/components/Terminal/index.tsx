import { useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas, ThreeElements, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDimensions } from "../Dimensions";
import "./index.css";

function Box(props: ThreeElements["mesh"]) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  useFrame((state, delta) => (meshRef.current.rotation.x += delta));
  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 2 : 1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
    </mesh>
  );
}

export default function Terminal() {
  const dimensions = useDimensions();

  return (
    <main className="Terminal">
      <Canvas
        camera={{
          position: [0, 0, 32],
          zoom: 10,
          near: 0.1,
          far: 64,
        }}
        orthographic={false}
        shadows
      >
        <OrbitControls />
        <ambientLight intensity={Math.PI / 4} />
        <pointLight
          position={[-5, 0, 0]}
          decay={0}
          intensity={Math.PI * 100}
          castShadow
        />

        <mesh position={[-5, 0, 0]}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="red" />
        </mesh>

        <Box position={[-1.2, 0, 0]} />
        <Box position={[1.2, 0, 0]} />
      </Canvas>
    </main>
  );
}
