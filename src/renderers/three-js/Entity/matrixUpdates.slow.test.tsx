import * as THREE from "three";
import Box from "./Box";
import Sprite from "./Sprite";
import { shadow } from "../../../game/assets/sprites";
import { createAreaWorld } from "../../../testing/harness";
import { createWorldContext, renderScene } from "../testing";
import { WorldProvider } from "../../interface/hooks";
import { DimensionsContext } from "../../../components/Dimensions/sizing";
import { InstanceRoot } from "./Instances";

jest.mock("@react-three/drei/core/useFont", () => {
  const { Font } = require("three-stdlib");
  return {
    useFont: () =>
      new Font(require("../../../../public/fonts/MostPerfectDOSVGA.json")),
  };
});

it("updates cached shadow-caster transforms after orientation, sizing and parent movement", async () => {
  const world = createAreaWorld("| ♀ |", { size: 64 });
  const content = (orientation: "left" | "right", aspectRatio = 9 / 16) => (
    <DimensionsContext.Provider
      value={{ ...world.metadata.dimensions, aspectRatio }}
    >
      <group name="parent" position={[10, 0, 0]}>
        <Box height={2} orientation={orientation} castShadow>
          <meshBasicMaterial />
        </Box>
      </group>
    </DimensionsContext.Provider>
  );
  const { renderer, advanceFrames } = await renderScene(world, content("left"));
  await advanceFrames(1);
  let mesh!: THREE.Mesh;
  renderer.scene.instance.traverse((object) => {
    if (object instanceof THREE.Mesh) mesh = object;
  });
  expect(mesh.matrixAutoUpdate).toBe(false);
  expect(mesh.getWorldPosition(new THREE.Vector3()).x).toBeCloseTo(10 - 5 / 32);
  mesh.parent!.position.x = 20;
  await advanceFrames(1);
  expect(mesh.getWorldPosition(new THREE.Vector3()).x).toBeCloseTo(20 - 5 / 32);
  await renderer.update(
    <WorldProvider value={createWorldContext(world)}>
      {content("right", 0.75)}
    </WorldProvider>
  );
  await advanceFrames(1);
  expect(mesh.getWorldPosition(new THREE.Vector3()).x).toBeCloseTo(
    20 + (0.75 * 4) / 18
  );
  expect(mesh.getWorldPosition(new THREE.Vector3()).z).toBe(1);
  await renderer.unmount();
});

it("repositions cached sprite groups and glyph anchors after React prop updates", async () => {
  const world = createAreaWorld("| ♀ |", { size: 64 });
  const content = (x: number) => (
    <>
      <InstanceRoot />
      <Sprite
        sprite={shadow}
        offsetX={x}
        offsetY={2}
        offsetZ={1}
        layerProps={{ isTransparent: false, receiveShadow: false }}
      />
    </>
  );
  const { renderer, advanceFrames } = await renderScene(world, content(1));
  await advanceFrames(1);
  let glyph!: THREE.Object3D;
  renderer.scene.instance.traverse((object) => {
    if (object.userData.char) glyph = object;
  });
  const before = glyph.getWorldPosition(new THREE.Vector3());
  expect(glyph.matrixAutoUpdate).toBe(false);
  await renderer.update(
    <WorldProvider value={createWorldContext(world)}>
      {content(5)}
    </WorldProvider>
  );
  await advanceFrames(1);
  const after = glyph.getWorldPosition(new THREE.Vector3());
  expect(after.x - before.x).toBe(4);
  expect(after.y).toBe(before.y);
  await renderer.unmount();
});
