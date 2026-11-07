# Instances

Shares Three.js instance buffers across repeated glyph and sprite geometry.

```tsx
InstanceRoot()
Instance({
  batchKey,
  geometry,
  lambert,
  color,
  darkness,
  position,
  userData,
}: {
  batchKey: string;
  geometry: THREE.BufferGeometry;
  lambert: boolean;
  color: THREE.Color;
  darkness?: SpringValue<number>;
  position: [number, number, number];
  userData?: Record<string, unknown>;
})
```
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
