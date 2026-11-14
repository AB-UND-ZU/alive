import ReactThreeTestRenderer from "@react-three/test-renderer";
import Entity from ".";
import { useGame } from "../../interface/hooks";
import { renderScene } from "../testing";
import {
  assertHero,
  createAreaWorld,
  step,
  FRAME,
} from "../../../testing/harness";
import { shootHoming } from "../../../engine/systems/homing";
import { getEntityGeneration } from "../../../engine/systems/renderer";
import { POSITION } from "../../../engine/components/position";
import { ORIENTABLE } from "../../../engine/components/orientable";
import { BELONGABLE } from "../../../engine/components/belongable";
import { FOG } from "../../../engine/components/fog";
import { SPRITE } from "../../../engine/components/sprite";
import { getMotion, sampleMotion } from "../../../engine/motion";
import { getFacingLayers } from "../../../game/assets/ui";
import { getSceneFrame } from "../../interface/frame";

jest.mock("@react-three/drei/core/useFont", () => {
  const { Font } = require("three-stdlib");
  const font = new Font(
    require("../../../../public/fonts/MostPerfectDOSVGA.json")
  );
  return { useFont: () => font };
});

it("keeps a homing disc facing its movement while approaching a corner", async () => {
  const world = createAreaWorld(
    `
|               |
| ♀             |
|               |
|               |
|               |
`,
    { size: 48 }
  );
  step(world, 15);
  const hero = world.assertComponents(assertHero(world), [BELONGABLE, POSITION]);
  const start = { ...hero[POSITION] };
  const corner = { x: start.x + 2, y: start.y };
  const disc = shootHoming(world, hero, {
    type: "ironDisc",
    positions: [corner, { x: corner.x, y: corner.y + 3 }],
  });
  disc[BELONGABLE].faction = hero[BELONGABLE].faction;
  disc[FOG].visibility = "visible";
  function Scene() {
    useGame();
    return (
      <Entity
        entity={disc}
        x={disc[POSITION].x}
        y={disc[POSITION].y}
        generation={getEntityGeneration(world, disc)}
        inRadius
        inside={false}
        outside={false}
      />
    );
  }
  const { renderer } = await renderScene(world, <Scene />);
  try {
    for (
      let frame = 0;
      frame < 30 && disc[ORIENTABLE].facing !== "down";
      frame++
    ) {
      await ReactThreeTestRenderer.act(async () => {
        step(world);
        await renderer.advanceFrames(1, FRAME / 1000);
      });
    }
    expect(disc[POSITION]).toEqual(corner);
    expect(disc[ORIENTABLE].facing).toBe("down");
    expect(
      sampleMotion(getMotion(disc)!, world.metadata.renderTime).x
    ).toBeLessThan(corner.x - 0.1);
    const glyphs = () =>
      renderer.scene
        .findAll((node) => typeof node.instance.userData?.char === "string")
        .map((node) => node.instance.userData.char);
    const body = (instant = false) =>
      getSceneFrame(world, 15, 11, undefined, { instant }).find(
        (entry) => entry.entity === disc && entry.sprite === disc[SPRITE]
      )!.layers;
    expect(glyphs()).toEqual(
      getFacingLayers(disc[SPRITE], "right").map((layer) => layer.char)
    );
    expect(body()).toEqual(getFacingLayers(disc[SPRITE], "right"));
    expect(body(true)).toEqual(getFacingLayers(disc[SPRITE], "down"));
    for (let frame = 0; frame < 15 && disc[POSITION].y === corner.y; frame++) {
      await ReactThreeTestRenderer.act(async () => {
        step(world);
        await renderer.advanceFrames(1, FRAME / 1000);
      });
    }
    expect(disc[POSITION].y).toBe(corner.y + 1);
    expect(glyphs()).toEqual(
      getFacingLayers(disc[SPRITE], "down").map((layer) => layer.char)
    );
    expect(body()).toEqual(getFacingLayers(disc[SPRITE], "down"));
  } finally {
    await renderer.unmount();
  }
});
