/**
 * Helpers to render the three.js scene graph headlessly (no WebGL) with
 * @react-three/test-renderer and drive its frame loop deterministically.
 */
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { WorldContext, WorldProvider } from "../interface/hooks";
import { World } from "../../engine";
import { FRAME } from "../../testing/harness";

import { createWorldContext } from "../../testing/context";
export { createWorldContext } from "../../testing/context";

export const renderScene = async (
  ecs: World,
  element: React.ReactElement,
  overrides: Partial<WorldContext> = {}
) => {
  const renderer = await ReactThreeTestRenderer.create(
    <WorldProvider value={createWorldContext(ecs, overrides)}>
      {element}
    </WorldProvider>
  );

  /** advance R3F frame loop by `frames` fixed system frames */
  const advanceFrames = (frames: number) =>
    ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(frames, FRAME / 1000);
    });

  return { renderer, advanceFrames };
};
