import { lightHeight, shadowHeight } from "./utils";

export default function CoveredLight({
  brightness,
  shadow,
}: {
  brightness: number;
  shadow: number;
}) {
  const adjustedBrightness = Math.max(0, brightness - 0.25);

  return (
    <>
      <pointLight
        position={[0, 0, lightHeight]}
        decay={-1}
        intensity={Math.PI * 0.293}
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        shadow-camera-near={0.1}
        shadow-camera-far={Math.sqrt(
          adjustedBrightness ** 2 + lightHeight ** 2
        )}
        onUpdate={(self) => {
          // ensure shadow-camera-far changes are applied
          self.shadow.camera.updateProjectionMatrix();
        }}
      />
      <mesh position={[0, 0, shadowHeight]}>
        <ringGeometry args={[adjustedBrightness, shadow, 128]} />
        <meshBasicMaterial color="black" opacity={0.64} transparent />
      </mesh>
    </>
  );
}
