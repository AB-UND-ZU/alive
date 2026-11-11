import type { Object3D } from "three";

// Static local transforms are recomputed after React applies new props. Animated
// groups update their matrices explicitly when sampled motion changes.
export const updateLocalMatrix = (object: Object3D) => object.updateMatrix();
