import { OrbitControls, Text, Text3D } from "@react-three/drei";
import { Canvas, ThreeElements } from "@react-three/fiber";
import { useDimensions } from "../Dimensions";
import "./index.css";

function Box(props: ThreeElements["mesh"]) {
  const dimensions = useDimensions();

  return (
    <mesh
      castShadow
      receiveShadow
      {...props}
    >
      <boxGeometry args={[dimensions.aspectRatio, 1, 1]} />
      <meshStandardMaterial color="white" />
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
          zoom: 64,
          near: 0.1,
          far: 64,
        }}
        orthographic
        shadows
        flat
      >
        <OrbitControls />
        <pointLight
          position={[5, 3, 1.02]}
          decay={0}
          intensity={Math.PI * 100}
          castShadow
        />

        <Text3D font="/fonts/MostPerfectDOSVGA.json" receiveShadow castShadow position={[dimensions.aspectRatio / -2, -0.5, -0.5]}>
          {"\u010b"}
          <meshStandardMaterial color="white" />
        </Text3D>
        
        <Box position={[-dimensions.aspectRatio, 0, 0]} />
        <Box position={[dimensions.aspectRatio, 0, 0]} />
      </Canvas>
    </main>
  );
}
