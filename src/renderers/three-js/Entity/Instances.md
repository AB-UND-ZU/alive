# Instances

Batches opaque glyphs and boxes that share geometry and material settings. `InstanceRoot` updates changed ranges of the shared Three.js buffers before rendering; `Instance` registers a transform anchor in a batch and unregisters it on unmount.

| Input                             | Role                                                   |
| --------------------------------- | ------------------------------------------------------ |
| `batchKey`, `geometry`, `lambert` | Select the shared batch                                |
| `position`, `userData`            | Place the anchor in its parent group                   |
| `color`, `darkness`               | Update the instance color without registering it again |

`Layer` uses this path for opaque artwork. Independently fading glyphs use their own animated material instead.

Each entry remembers its last world matrix, color and buffer slot. Unchanged entries avoid buffer writes and GPU uploads. Removing an entry swaps the last entry into its slot; moving slots or replacing a grown mesh forces the affected data to be copied again.

Pending ranges accumulate until WebGL consumes them. A frame that advances without drawing must not discard earlier dirty data. A batch keeps one bounding range per attribute, including any unchanged entries between the first and last change.

Static anchors use [cached local transforms](matrixUpdates.md); animated parents still update their world positions normally.
<!-- source-types -->

## Entry

```ts src/renderers/three-js/Entity/Instances.tsx
type Entry = {
  anchor: THREE.Object3D;
  color: THREE.Color;
  darkness?: SpringValue<number>;
  index: number;
  bufferIndex?: number;
  bufferMesh?: THREE.InstancedMesh;
  matrix?: THREE.Matrix4;
  red?: number;
  green?: number;
  blue?: number;
};
```

## Batch

```ts src/renderers/three-js/Entity/Instances.tsx
type Batch = {
  key: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  receiveShadow: boolean;
  mesh: THREE.InstancedMesh;
  capacity: number;
  entries: Entry[];
};
```
