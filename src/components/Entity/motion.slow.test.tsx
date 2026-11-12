import ReactThreeTestRenderer from "@react-three/test-renderer";
import * as THREE from "three";
import { WorldProvider } from "../../bindings/hooks";
import { createWorldContext, renderScene } from "../../testing/render";
import { act, createAreaWorld, giveItems, step } from "../../testing/harness";
import {
  AnvilEntity,
  getShopper,
  openStation,
  selectRow,
} from "../../features/workstations/helpers";
import { FORGABLE } from "../../engine/components/forgable";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { forgeTicks, hittingWidth } from "../../game/balancing/forging";
import { REFERENCE } from "../../engine/components/reference";
import { DimensionsContext } from "../Dimensions/sizing";
import Systems from "../Systems";
import Camera from "../Camera";
import { InstanceRoot } from "./Instances";

jest.mock("@react-three/drei/core/useFont", () => {
  const { Font } = require("three-stdlib");
  return {
    useFont: () =>
      new Font(require("../../../public/fonts/MostPerfectDOSVGA.json")),
  };
});
jest.mock("@react-three/drei/core/OrthographicCamera", () => {
  const React = require("react");
  return {
    OrthographicCamera: React.forwardRef((props: any, ref: any) => (
      <orthographicCamera ref={ref} {...props} />
    )),
  };
});

const setup = () => {
  const world = createAreaWorld("|       |\n|  ♀A   |\n|       |", {
    size: 48,
    legend: { A: "anvil" },
  });
  const hero = getShopper(world);
  giveItems(world, hero, [
    { weapon: "sword", material: "wood", amount: 1 },
    { stackable: "resource", material: "iron", amount: 99 },
  ]);
  const anvil = openStation(world) as AnvilEntity;
  selectRow(world, anvil, 0);
  act(world, "right");
  selectRow(world, anvil, 1);
  act(world, "right");
  act(world, "right");
  step(world, 4);
  expect(anvil[FORGABLE].lastAction).toBe("swing");
  return { world, anvil };
};

const getHammerGroup = (scene: THREE.Object3D) => {
  let glyph: THREE.Object3D | undefined;
  scene.traverse((object) => {
    if (!glyph && object.userData.char === "∞") glyph = object;
  });
  let group = glyph;
  while (group && Math.abs(group.position.y - 8) > 1e-8)
    group = group.parent || undefined;
  if (!group) throw new Error("Forging hammer was not rendered");
  return group;
};

test("the rendered forging hammer follows the same swing phase at high and low frame rates", async () => {
  const { world, anvil } = setup();
  const content = (
    <DimensionsContext.Provider value={world.metadata.dimensions}>
      <InstanceRoot />
      <Camera />
      <Systems />
    </DimensionsContext.Provider>
  );
  const { renderer } = await renderScene(world, content);
  const positions: number[] = [];
  for (const delta of [
    1 / 60,
    1 / 60,
    0.2,
    0.3,
    0.5,
    1 / 60,
    0.25,
    0.4,
    0.3,
    0.35,
    ...Array(12).fill(0.2),
  ]) {
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, delta);
    });
    const duration = world.metadata.gameEntity[REFERENCE].tick * forgeTicks;
    const elapsed =
      anvil[SEQUENCABLE].states.popup!.elapsed -
      anvil[FORGABLE].lastElapsed +
      world.metadata.renderTime -
      world.metadata.elapsed;
    const phase = ((elapsed % (duration * 2)) + duration * 2) % (duration * 2);
    const progress =
      phase < duration ? 1 - phase / duration : (phase - duration) / duration;
    const expected = -(hittingWidth + 1) / 2 + (hittingWidth - 1) * progress;
    const group = getHammerGroup(renderer.scene.instance);
    const actual = group.position.x / world.metadata.dimensions.aspectRatio;
    expect(actual).toBeCloseTo(expected, 5);
    expect(group.matrixAutoUpdate).toBe(false);
    positions.push(actual);
  }
  expect(Math.max(...positions) - Math.min(...positions)).toBeGreaterThan(10);
  const before = getHammerGroup(renderer.scene.instance).position.clone();
  const { renderTime: frozenTime } = world.metadata;
  await renderer.update(
    <WorldProvider value={createWorldContext(world, { paused: true })}>
      {content}
    </WorldProvider>
  );
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(3, 0.5);
  });
  expect(world.metadata.renderTime).toBe(frozenTime);
  expect(getHammerGroup(renderer.scene.instance).position).toEqual(before);
  await renderer.update(
    <WorldProvider value={createWorldContext(world)}>{content}</WorldProvider>
  );
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(1, 1 / 60);
  });
  expect(world.metadata.renderTime).toBeCloseTo(frozenTime + 1000 / 60, 5);
  await renderer.unmount();
});

test("a paused animated entity keeps its initial cached world transform", async () => {
  const Animated = (await import("./Animated")).default;
  const world = createAreaWorld("| ♀ |");
  const { renderer, advanceFrames } = await renderScene(
    world,
    <Animated entity={getShopper(world)} position={[4, 5, 0]}>
      <group name="anchor" />
    </Animated>,
    { paused: true }
  );
  await advanceFrames(1);
  const container = renderer.scene.children[0].instance;
  const anchor = container.children[0];
  expect(container.matrixAutoUpdate).toBe(false);
  expect(anchor.getWorldPosition(new THREE.Vector3()).toArray()).toEqual([
    4, 5, 0,
  ]);
  await renderer.unmount();
});
