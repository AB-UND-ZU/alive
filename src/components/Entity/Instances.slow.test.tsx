import * as THREE from "three";
import { SpringValue } from "@react-spring/three";
import { Instance, InstanceRoot } from "./Instances";
import { createAreaWorld } from "../../testing/harness";
import { renderScene, createWorldContext } from "../../testing/render";
import { WorldProvider } from "../../bindings/hooks";

type Item = { id: number; x: number; color?: string };

it("uploads only changed instance data and retains undrawn ranges through fading, compaction and growth", async () => {
  const world = createAreaWorld("| ♀ |", { size: 64 });
  const geometry = new THREE.PlaneGeometry();
  const darkness = new SpringValue(1);
  const content = (items: Item[]) => (
    <>
      <InstanceRoot />
      <group name="moving-parent">
        {items.map((item) => (
          <Instance
            key={item.id}
            batchKey="pending-upload"
            geometry={geometry}
            lambert={false}
            color={new THREE.Color(item.color || "red")}
            darkness={darkness}
            position={[item.x, 0, 0]}
          />
        ))}
      </group>
    </>
  );
  let items = [
    { id: 0, x: 1 },
    { id: 1, x: 2 },
  ];
  const { renderer, advanceFrames } = await renderScene(world, content(items));
  const update = async (next: Item[]) => {
    items = next;
    await renderer.update(
      <WorldProvider value={createWorldContext(world)}>
        {content(items)}
      </WorldProvider>
    );
    await advanceFrames(1);
  };
  const find = () =>
    renderer.scene.instance.children
      .find((object) => object.name === "instances")!
      .children.find(
        (object) => (object as THREE.InstancedMesh).geometry === geometry
      ) as THREE.InstancedMesh;
  try {
    await advanceFrames(1);
    let mesh = find();
    mesh.instanceMatrix.clearUpdateRanges();
    mesh.instanceColor!.clearUpdateRanges();
    const version = mesh.instanceMatrix.version,
      colorVersion = mesh.instanceColor!.version;
    await advanceFrames(2);
    expect(mesh.instanceMatrix.version).toBe(version);
    expect(mesh.instanceColor!.version).toBe(colorVersion);
    expect(mesh.instanceMatrix.updateRanges).toEqual([]);
    await update([
      { id: 0, x: 3 },
      { id: 1, x: 2 },
    ]);
    await update([
      { id: 0, x: 3 },
      { id: 1, x: 4, color: "blue" },
    ]);
    expect(mesh.instanceMatrix.updateRanges).toEqual([{ start: 0, count: 32 }]);
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(0, matrix);
    expect(matrix.elements[12]).toBe(3);
    mesh.getMatrixAt(1, matrix);
    expect(matrix.elements[12]).toBe(4);
    darkness.set(0.5);
    await advanceFrames(1);
    await update([{ id: 1, x: 4, color: "blue" }]);
    expect(mesh.count).toBe(1);
    mesh.getMatrixAt(0, matrix);
    expect(matrix.elements[12]).toBe(4);
    const color = new THREE.Color();
    mesh.getColorAt(0, color);
    expect(color.b).toBe(0.5);
    const old = mesh,
      disposed = jest.fn();
    old.addEventListener("dispose", disposed);
    await update(
      Array.from({ length: 130 }, (_, index) => ({
        id: index + 1,
        x: index + 4,
        color: "blue",
      }))
    );
    mesh = find();
    expect(mesh).not.toBe(old);
    expect(disposed).toHaveBeenCalledTimes(1);
    expect(mesh.count).toBe(130);
    mesh.getMatrixAt(0, matrix);
    expect(matrix.elements[12]).toBe(4);
    mesh.getMatrixAt(129, matrix);
    expect(matrix.elements[12]).toBe(133);
    const parent = renderer.scene.instance.children.find(
      (object) => object.name === "moving-parent"
    )!;
    parent.position.x = 10;
    await advanceFrames(1);
    mesh.getMatrixAt(129, matrix);
    expect(matrix.elements[12]).toBe(143);
    await update([]);
    expect(mesh.count).toBe(0);
    await update([{ id: 1000, x: 12, color: "green" }]);
    expect(mesh.count).toBe(1);
    mesh.getMatrixAt(0, matrix);
    expect(matrix.elements[12]).toBe(22);
  } finally {
    await renderer.unmount();
    geometry.dispose();
  }
});
