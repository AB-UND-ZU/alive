import { OrbitControls, Text } from "@react-three/drei";
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
          position={[0, 0, 1.02]}
          decay={0}
          intensity={Math.PI * 100}
          castShadow
        />

        <Text color="white" font="/fonts/MostPerfectDOSVGA.woff">
          {"\u010b"}
        </Text>

        <Box position={[-dimensions.aspectRatio, 0, 0]} />
        <Box position={[dimensions.aspectRatio, 0, 0]} />
      </Canvas>
    </main>
  );
}
