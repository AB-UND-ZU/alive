import { createContext, useEffect, useMemo } from "react";
import * as THREE from "three";
import { lightHeight, shadowHeight } from "../../interface/segments";

// a fixed oversized cover is clipped by the camera and only depends on the
// radius, so the ring is not rebuilt on every step
export const LightingContext = createContext(true);

const ringCover = 1000;

type InvertedRingProps = {
  width: number;
  height: number;
  innerRadius: number;
  segments?: number;
};

function InvertedRingGeometry({
  width,
  height,
  innerRadius,
  segments = 64,
}: InvertedRingProps) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();

    const containedWidth = Math.max(width, innerRadius * 2);
    const containedHeight = Math.max(height, innerRadius * 2);

    // outer plane
    shape.moveTo(-containedWidth / 2, -containedHeight / 2);
    shape.lineTo(containedWidth / 2, -containedHeight / 2);
    shape.lineTo(containedWidth / 2, containedHeight / 2);
    shape.lineTo(-containedWidth / 2, containedHeight / 2);
    shape.closePath();

    // hole cutout
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, false);
    shape.holes.push(hole);

    return new THREE.ShapeGeometry(shape, segments);
  }, [width, height, innerRadius, segments]);

  // primitives are never disposed by R3F, release replaced geometries
  useEffect(() => () => geometry.dispose(), [geometry]);

  return <primitive object={geometry} />;
}

export default function CoveredLight({ brightness }: { brightness: number }) {
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
        <InvertedRingGeometry
          width={ringCover}
          height={ringCover}
          innerRadius={adjustedBrightness}
          segments={128}
        />
        <meshBasicMaterial color="black" opacity={0.64} transparent />
      </mesh>
    </>
  );
}
