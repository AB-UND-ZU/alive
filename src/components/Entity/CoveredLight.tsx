import { lightHeight, shadowHeight } from "./utils";

export default function CoveredLight({
  brightness,
  shadow,
}: {
  brightness: number;
  shadow: number;
}) {
  return (
    <>
      <pointLight
        position={[0, 0, lightHeight]}
        decay={-0.96}
        intensity={Math.PI * 0.31}
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        shadow-camera-near={0.1}
        shadow-camera-far={Math.sqrt(
          (brightness - 0.25) ** 2 + lightHeight ** 2
        )}
      />
      <mesh position={[0, 0, shadowHeight]}>
        <ringGeometry args={[brightness - 0.25, shadow, 128]} />
        <meshBasicMaterial color="black" opacity={0.64} transparent />
      </mesh>
    </>
  );
}
