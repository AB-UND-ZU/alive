# Instances

Batches opaque glyphs and boxes that share geometry and material settings. `InstanceRoot` updates the shared Three.js buffers before rendering; `Instance` registers a transform anchor in a batch and unregisters it on unmount.

| Input | Role |
| --- | --- |
| `batchKey`, `geometry`, `lambert` | Select the shared batch |
| `position`, `userData` | Place the anchor in its parent group |
| `color`, `darkness` | Update the instance color without registering it again |

`Layer` uses this path for opaque artwork. Independently fading glyphs use their own animated material instead.
<!-- source-types -->

## Entry

```ts src/components/Entity/Instances.tsx
type Entry = {
  anchor: THREE.Object3D;
  color: THREE.Color;
  darkness?: SpringValue<number>;
  index: number;
};
```

## Batch

```ts src/components/Entity/Instances.tsx
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
