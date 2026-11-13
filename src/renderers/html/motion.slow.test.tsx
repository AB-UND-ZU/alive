import { act } from "@react-three/test-renderer";
import { renderScene } from "../three-js/testing";
import Animated from "../three-js/Entity/Animated";
import { createAreaWorld, assertHero } from "../../testing/harness";
import { POSITION } from "../../engine/components/position";
import { MOVABLE } from "../../engine/components/movable";
import { SPRITE } from "../../engine/components/sprite";
import { moveEntity } from "../../engine/systems/map";
import {
  getCameraMotion,
  sampleMotion,
  updateCameraMotion,
} from "../../engine/motion";
import { aspectRatio } from "../interface/dimensions";
import { getSceneFrame } from "../interface/frame";

it("samples a long timed movement at the same pace as Three.js", async () => {
  const world = createAreaWorld(
    `
|                    |
| ♀                  |
|                    |
`,
    { size: 48 }
  );
  const hero = assertHero(world);
  hero[MOVABLE].spring = { duration: 100 };
  const start = { ...hero[POSITION] };
  updateCameraMotion(world, true);
  const { renderer } = await renderScene(
    world,
    <Animated entity={hero} position={[start.x * aspectRatio, -start.y, 0]} />
  );
  moveEntity(world, hero, { x: start.x + 5, y: start.y });
  updateCameraMotion(world);
  const started = world.metadata.elapsed;
  for (const elapsed of [0, 25, 50, 75, 100, 125]) {
    world.metadata.renderTime = started + elapsed;
    await act(async () => {
      await renderer.advanceFrames(1, 0);
    });
    const body = getSceneFrame(world, 21, 15).find(
      (entry) => entry.entity === hero && entry.sprite === hero[SPRITE]
    )!;
    const camera = sampleMotion(
      getCameraMotion(world)!,
      world.metadata.renderTime
    );
    const htmlX = body.x + camera.x - 10;
    expect(htmlX).toBeCloseTo(
      renderer.scene.children[0].instance.position.x / aspectRatio
    );
    expect(htmlX).toBeCloseTo(start.x + Math.min(5, elapsed / 20));
  }
  await renderer.unmount();
});
