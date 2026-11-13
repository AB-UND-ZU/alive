import { OrthographicCamera } from "@react-three/drei/core/OrthographicCamera";
import { OrthographicCamera as CameraObject, Vector3Tuple } from "three";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { useDimensions } from "../../../components/Dimensions";
import { useWorld } from "../../interface/hooks";
import { cameraHeight } from "../../interface/segments";
import {
  getCameraMotion,
  releaseCameraMotion,
  sampleMotion,
  updateCameraMotion,
} from "../../../engine/motion";

export default function Camera() {
  const { ecs } = useWorld();
  const dimensions = useDimensions();
  const camera = useRef<CameraObject>(null);
  const sample = useRef({ x: 0, y: 0 });
  const initialPosition = useRef<Vector3Tuple>([0, 0, cameraHeight]);

  useLayoutEffect(() => {
    if (!ecs) return;
    updateCameraMotion(ecs, true);
    return () => {
      releaseCameraMotion(ecs);
    };
  }, [ecs]);

  const updatePosition = () => {
    if (!ecs || !camera.current) return;
    const motion = getCameraMotion(ecs);
    if (!motion) return;
    sampleMotion(motion, ecs.metadata.renderTime, sample.current);
    camera.current.position.set(
      sample.current.x * dimensions.aspectRatio,
      -sample.current.y,
      cameraHeight
    );
  };
  useFrame(updatePosition, -1);
  useLayoutEffect(updatePosition);

  return (
    <OrthographicCamera
      ref={camera}
      makeDefault
      position={initialPosition.current}
      zoom={dimensions.cellHeight}
      near={0.1}
      far={cameraHeight}
    />
  );
}
