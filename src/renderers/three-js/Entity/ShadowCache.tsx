import * as THREE from "three";
import { useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Point light shadows render a cube map: six passes that each traverse the
 * whole scene. The result only changes if a shadow casting light or a shadow
 * caster changes, so only re-render the shadow map in that case.
 */
export default function ShadowCache() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const signature = useRef<number[]>([]);
  const casters = useRef<THREE.Object3D[]>([]);
  const lights = useRef<THREE.Light[]>([]);

  useLayoutEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);

  // priority 0: runs after springs advanced and before rendering
  useFrame(() => {
    // casters and lights are collected without allocating per frame
    casters.current.length = 0;
    lights.current.length = 0;
    scene.traverseVisible((object) => {
      if ((object as THREE.Light).isLight && object.castShadow)
        lights.current.push(object as THREE.Light);
      else if ((object as THREE.Mesh).isMesh && object.castShadow)
        casters.current.push(object);
    });

    // compare world transforms of the few lights and casters
    const next = signature.current;
    let index = 0;
    let changed = false;
    const push = (value: number) => {
      if (next[index] !== value) {
        next[index] = value;
        changed = true;
      }
      index += 1;
    };

    push(lights.current.length);
    push(casters.current.length);
    for (const light of lights.current) {
      light.updateWorldMatrix(true, false);
      const e = light.matrixWorld.elements;
      push(e[12]);
      push(e[13]);
      push(e[14]);
      const shadow = light.shadow as THREE.LightShadow;
      push((shadow.camera as THREE.PerspectiveCamera).far);
      push(shadow.mapSize.x);
    }
    for (const caster of casters.current) {
      caster.updateWorldMatrix(true, false);
      const e = caster.matrixWorld.elements;
      push(e[12]);
      push(e[13]);
      push(e[14]);
      push(e[0]);
      push(e[5]);
      push(e[10]);
      push((caster as THREE.Mesh).geometry.id);
    }
    if (next.length !== index) {
      next.length = index;
      changed = true;
    }

    if (changed) gl.shadowMap.needsUpdate = true;
  });

  return null;
}
