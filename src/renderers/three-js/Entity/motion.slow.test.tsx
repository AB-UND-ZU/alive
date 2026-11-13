import ReactThreeTestRenderer from "@react-three/test-renderer";
import * as THREE from "three";
import { WorldProvider } from "../../interface/hooks";
import { createWorldContext, renderScene } from "../testing";
import {
  act,
  createAreaWorld,
  giveItems,
  step,
  assertHero,
  holdMove,
  advanceUntil,
} from "../../../testing/harness";
import {
  AnvilEntity,
  getShopper,
  openStation,
  selectRow,
} from "../../../features/workstations/helpers";
import { getBumpMotion, getMotion, sampleMotion } from "../../../engine/motion";
import Animated from "./Animated";
import { FORGABLE } from "../../../engine/components/forgable";
import { SEQUENCABLE } from "../../../engine/components/sequencable";
import { forgeTicks, hittingWidth } from "../../../game/balancing/forging";
import { REFERENCE } from "../../../engine/components/reference";
import { DimensionsContext } from "../../../components/Dimensions/sizing";
import Systems from "../Systems";
import Camera from "../Camera";
import { InstanceRoot } from "./Instances";
import { AnimatedSprite } from "./Sprite";
import { cast, createSpellWorld } from "../../../features/spells/helpers";

jest.mock("@react-three/drei/core/useFont", () => {
  const { Font } = require("three-stdlib");
  return {
    useFont: () =>
      new Font(require("../../../../public/fonts/MostPerfectDOSVGA.json")),
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

test("a pickup bump renders immediately and settles without another React commit", async () => {
  const world = createAreaWorld("|     |\n| ♀∙  |\n|     |");
  const hero = assertHero(world);
  const { aspectRatio } = world.metadata.dimensions;
  const position: [number, number, number] = [
    hero.POSITION.x * aspectRatio,
    -hero.POSITION.y,
    0,
  ];
  const { renderer, advanceFrames } = await renderScene(
    world,
    <DimensionsContext.Provider value={world.metadata.dimensions}>
      <Animated entity={hero} position={position} />
    </DimensionsContext.Provider>
  );
  const group = renderer.scene.children[0].instance;
  holdMove(world, ["right"]);
  advanceUntil(world, () => hero.BUMPABLE?.orientation === "right", 1000);
  holdMove(world, []);
  expect(hero.POSITION.x * aspectRatio).toBe(position[0]);
  await advanceFrames(1);
  expect(group.position.x).toBeCloseTo(position[0] + 0.225 * aspectRatio);
  const bump = getBumpMotion(hero)!;
  world.metadata.renderTime = bump.startedAt + 100;
  await advanceFrames(1);
  expect(group.position.x).toBeGreaterThan(position[0]);
  expect(group.position.x).toBeLessThan(position[0] + 0.225 * aspectRatio);
  world.metadata.renderTime = bump.startedAt + 2000;
  await advanceFrames(1);
  expect(group.position.x).toBeCloseTo(position[0]);
  expect(group.position.y).toBeCloseTo(position[1]);
  await renderer.unmount();
});

test("dissolving Wave edges stay on their trajectory until the next React commit", async () => {
  const { world } = createSpellWorld(
    "| ♀ |",
    { spell: "wave", material: "wood" },
    { size: 48 }
  );
  cast(world, "up");
  const wave = world.getEntities(["CASTABLE", "SEQUENCABLE"]).find(
    (entity) => entity.SEQUENCABLE.states.spell?.name === "castWave1"
  );
  if (!wave) throw new Error("Wave was not cast");
  const state = wave.SEQUENCABLE.states.spell!;
  advanceUntil(world, () => state.args.progress >= state.args.range - 2, 4000);
  const particles = Object.entries(state.particles)
    .filter(([name]) => name.startsWith("side-"))
    .map(([, id]) =>
      world.assertByIdAndComponents(id, ["PARTICLE", "SPRITE", "ORIENTABLE"])
    );
  expect(particles).toHaveLength(4);
  const motions = particles.map((particle) => getMotion(particle)!);
  const { aspectRatio } = world.metadata.dimensions;
  const { renderer, advanceFrames } = await renderScene(
    world,
    <DimensionsContext.Provider value={world.metadata.dimensions}>
      <InstanceRoot />
      {particles.map((particle, index) => (
        <group key={index} name={`wave-edge-${index}`}>
          <AnimatedSprite
            sprite={particle.SPRITE}
            facing={particle.ORIENTABLE.facing}
            offsetX={particle.PARTICLE.offsetX * aspectRatio}
            offsetY={-particle.PARTICLE.offsetY}
            offsetZ={particle.PARTICLE.offsetZ}
            layerProps={{
              isTransparent: false,
              receiveShadow: false,
              animatedOrigin: particle.PARTICLE.animatedOrigin,
              duration: particle.PARTICLE.duration,
              particle,
            }}
          />
        </group>
      ))}
    </DimensionsContext.Provider>
  );
  try {
    let removed = -1;
    for (let frame = 0; frame < 40 && removed === -1; frame++) {
      step(world);
      await advanceFrames(1);
      const active = new Set(Object.values(state.particles));
      removed = particles.findIndex(
        (particle) => !active.has(world.getEntityId(particle))
      );
    }
    expect(removed).toBeGreaterThanOrEqual(0);
    const particle = particles[removed];
    const sampled = sampleMotion(motions[removed], world.metadata.renderTime);
    expect(
      Math.hypot(
        sampled.x - particle.PARTICLE.offsetX,
        sampled.y - particle.PARTICLE.offsetY
      )
    ).toBeGreaterThan(0.001);
    const group = renderer.scene.instance.getObjectByName(
      `wave-edge-${removed}`
    )!.children[0];
    expect(group.position.x / aspectRatio).toBeCloseTo(sampled.x, 8);
    expect(-group.position.y).toBeCloseTo(sampled.y, 8);
  } finally {
    await renderer.unmount();
  }
});
