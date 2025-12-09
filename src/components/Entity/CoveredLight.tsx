import { useMemo } from "react";
import * as THREE from "three";
import { lightHeight, shadowHeight } from "./utils";
import { useOverscan, useViewpoint, useWorld } from "../../bindings/hooks";
import { signedDistance } from "../../game/math/std";
import { LEVEL } from "../../engine/components/level";

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

  return <primitive object={geometry} />;
}

export default function CoveredLight({
  brightness,
  width,
  height,
  x,
  y,
}: {
  brightness: number;
  width: number;
  height: number;
  x: number;
  y: number;
}) {
  const { position } = useViewpoint();
  const overscan = useOverscan(position.x, position.y)
  const { ecs } = useWorld();

  const size = ecs?.metadata.gameEntity[LEVEL].size || 0;
  const paddingX = size && Math.abs(signedDistance(x, position.x, size)) + Math.abs(overscan.x) * 2;
  const paddingY = size && Math.abs(signedDistance(y, position.y, size)) + Math.abs(overscan.y) * 2;

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
          width={width + paddingX * 2}
          height={height + paddingY * 2}
          innerRadius={adjustedBrightness}
          segments={128}
        />
        <meshBasicMaterial color="black" opacity={0.64} transparent />
      </mesh>
    </>
  );
}
