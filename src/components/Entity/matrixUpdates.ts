import type { Object3D } from "three";

// Static local transforms are recomputed after React applies new props. Animated
// groups keep matrixAutoUpdate enabled so spring-driven movement stays live.
export const updateLocalMatrix = (object: Object3D) => object.updateMatrix();
