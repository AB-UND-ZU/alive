import * as THREE from "three";
import { useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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
  const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, capacity);
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
      const matrices = mesh.instanceMatrix.array as Float32Array;
      const colors = mesh.instanceColor!.array as Float32Array;

      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        matrices.set(entry.anchor.matrixWorld.elements, i * 16);

        let color = entry.color;
        if (entry.darkness) {
          color = tempColor.copy(color).multiplyScalar(entry.darkness.get());
        }
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      mesh.count = entries.length;
      mesh.instanceMatrix.clearUpdateRanges();
      mesh.instanceMatrix.addUpdateRange(0, entries.length * 16);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor!.clearUpdateRanges();
      mesh.instanceColor!.addUpdateRange(0, entries.length * 3);
      mesh.instanceColor!.needsUpdate = true;
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

  return <object3D ref={anchor} position={position} userData={userData} />;
}
