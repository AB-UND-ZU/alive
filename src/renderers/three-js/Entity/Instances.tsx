import * as THREE from "three";
import { useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { updateLocalMatrix } from "./matrixUpdates";
import { SpringValue } from "@react-spring/three";

/**
 * Instanced rendering of opaque sprite layers.
 *
 * Every glyph layer used to be its own mesh with its own geometry and material,
 * which costs one draw call plus per-object state changes in three.js. Here a
 * layer only mounts an invisible anchor (keeping all springs and the scene
 * graph intact) and registers with a batch per geometry and material type.
 * Once per frame, all anchors' world matrices and colors are copied into one
 * InstancedMesh per batch.
 */

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

type Batch = {
  key: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  receiveShadow: boolean;
  mesh: THREE.InstancedMesh;
  capacity: number;
  entries: Entry[];
};

const root = new THREE.Group();
root.name = "instances";
root.matrixAutoUpdate = false;
const batches = new Map<string, Batch>();

const materials = {
  lambert: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  basic: new THREE.MeshBasicMaterial({ color: 0xffffff }),
};

const createMesh = (batch: Batch, capacity: number) => {
  const mesh = new THREE.InstancedMesh(
    batch.geometry,
    batch.material,
    capacity
  );
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(capacity * 3),
    3
  );
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.receiveShadow = batch.receiveShadow;
  mesh.matrixAutoUpdate = false;
  mesh.count = 0;
  return mesh;
};

const getBatch = (
  key: string,
  geometry: THREE.BufferGeometry,
  lambert: boolean
) => {
  const batchKey = `${lambert ? "l" : "b"}:${key}`;
  let batch = batches.get(batchKey);
  if (!batch) {
    batch = {
      key: batchKey,
      geometry,
      material: lambert ? materials.lambert : materials.basic,
      receiveShadow: lambert,
      mesh: null as unknown as THREE.InstancedMesh,
      capacity: 64,
      entries: [],
    };
    batch.mesh = createMesh(batch, batch.capacity);
    root.add(batch.mesh);
    batches.set(batchKey, batch);
  }
  return batch;
};

const register = (batch: Batch, entry: Entry) => {
  if (batch.entries.length >= batch.capacity) {
    const capacity = batch.capacity * 2;
    const mesh = createMesh(batch, capacity);
    root.remove(batch.mesh);
    batch.mesh.dispose();
    batch.mesh = mesh;
    batch.capacity = capacity;
    root.add(mesh);
  }
  entry.index = batch.entries.length;
  batch.entries.push(entry);
};

const unregister = (batch: Batch, entry: Entry) => {
  const last = batch.entries.pop()!;
  if (last !== entry) {
    batch.entries[entry.index] = last;
    last.index = entry.index;
  }
};

const tempColor = new THREE.Color();

// Keep pending changes until WebGL consumes them. A canvas may advance more
// than once before rendering, or a temporarily hidden batch may not upload.
const updateRange = (
  attribute: THREE.BufferAttribute,
  first: number,
  last: number
) => {
  if (last < 0) return;
  for (const range of attribute.updateRanges) {
    first = Math.min(first, range.start);
    last = Math.max(last, range.start + range.count - 1);
  }
  attribute.clearUpdateRanges();
  attribute.addUpdateRange(first, last - first + 1);
  attribute.needsUpdate = true;
};

/** Mount once inside the canvas. */
export function InstanceRoot() {
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    scene.add(root);
    // matrices are updated once per frame below, before copying
    scene.matrixWorldAutoUpdate = false;
    return () => {
      scene.remove(root);
      scene.matrixWorldAutoUpdate = true;
    };
  }, [scene]);

  useFrame(() => {
    scene.updateMatrixWorld();

    batches.forEach((batch) => {
      const { entries, mesh } = batch;
      let matrixFirst = Infinity,
        matrixLast = -1;
      let colorFirst = Infinity,
        colorLast = -1;
      const matrices = mesh.instanceMatrix.array as Float32Array;
      const colors = mesh.instanceColor!.array as Float32Array;

      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        const movedSlot = entry.bufferMesh !== mesh || entry.bufferIndex !== i;
        if (movedSlot || !entry.matrix?.equals(entry.anchor.matrixWorld)) {
          matrices.set(entry.anchor.matrixWorld.elements, i * 16);
          (entry.matrix ||= new THREE.Matrix4()).copy(entry.anchor.matrixWorld);
          matrixFirst = Math.min(matrixFirst, i * 16);
          matrixLast = i * 16 + 15;
        }

        let color = entry.color;
        if (entry.darkness) {
          color = tempColor.copy(color).multiplyScalar(entry.darkness.get());
        }
        if (
          movedSlot ||
          entry.red !== color.r ||
          entry.green !== color.g ||
          entry.blue !== color.b
        ) {
          colors[i * 3] = entry.red = color.r;
          colors[i * 3 + 1] = entry.green = color.g;
          colors[i * 3 + 2] = entry.blue = color.b;
          colorFirst = Math.min(colorFirst, i * 3);
          colorLast = i * 3 + 2;
        }
        entry.bufferMesh = mesh;
        entry.bufferIndex = i;
      }

      mesh.count = entries.length;
      updateRange(mesh.instanceMatrix, matrixFirst, matrixLast);
      updateRange(mesh.instanceColor!, colorFirst, colorLast);
    });
  });

  return null;
}

/** Drop-in replacement for an opaque glyph or box mesh. */
export function Instance({
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
}) {
  const anchor = useRef<THREE.Object3D>(null);
  const entry = useRef<Entry>();

  // keep latest values without re-registering
  if (entry.current) {
    entry.current.color = color;
    entry.current.darkness = darkness;
  }

  useLayoutEffect(() => {
    const batch = getBatch(batchKey, geometry, lambert);
    const current: Entry = {
      anchor: anchor.current!,
      color,
      darkness,
      index: -1,
    };
    entry.current = current;
    register(batch, current);
    return () => {
      unregister(batch, current);
      entry.current = undefined;
    };
    // color and darkness are synced on render above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchKey, geometry, lambert]);

  return (
    <object3D
      ref={anchor}
      position={position}
      userData={userData}
      matrixAutoUpdate={false}
      onUpdate={updateLocalMatrix}
    />
  );
}
