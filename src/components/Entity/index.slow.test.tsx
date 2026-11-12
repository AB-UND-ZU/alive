import Entity from ".";
import {
  assertHero,
  createAreaWorld,
  FRAME,
  step,
} from "../../testing/harness";
import { createWorldContext, renderScene } from "../../testing/render";
import { WorldProvider } from "../../bindings/hooks";
import { POSITION } from "../../engine/components/position";
import { SPRITE } from "../../engine/components/sprite";
import { RENDERABLE } from "../../engine/components/renderable";
import { ORIENTABLE } from "../../engine/components/orientable";
import { getFacingLayers } from "../../game/assets/ui";
import {
  getEntityGeneration,
  rerenderEntity,
} from "../../engine/systems/renderer";
import { entities, World } from "../../engine";
import { TypedEntity } from "../../engine/entities";
import ReactThreeTestRenderer, {
  type ReactThreeTest,
} from "@react-three/test-renderer";
import { Globals } from "@react-spring/three";
import { raf } from "@react-spring/rafz";
import * as THREE from "three";
import { PARTICLE } from "../../engine/components/particle";
import { REFERENCE } from "../../engine/components/reference";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { smokeLight } from "../../game/assets/sprites";
import { particleHeight } from "./utils";

// the font is loaded over the network, provide it from disk instead.
// glyphs are tagged with their char to be found in the scene
jest.mock("@react-three/drei/core/useFont", () => {
  const { Font } = require("three-stdlib");
  const font = new Font(
    require("../../../public/fonts/MostPerfectDOSVGA.json")
  );
  return {
    useFont: () => font,
  };
});

const getGlyphs = (scene: ReactThreeTest.Renderer["scene"]) =>
  scene
    .findAll((node) => typeof node.instance.userData?.char === "string")
    .map((node) => node.instance.userData.char as string);

const renderEntity = (
  world: World,
  entity: TypedEntity<"POSITION" | "SPRITE" | "RENDERABLE">
) =>
  renderScene(
    world,
    <Entity
      entity={entity}
      x={entity[POSITION].x}
      y={entity[POSITION].y}
      generation={getEntityGeneration(world, entity)}
      inRadius
      inside={false}
      outside={false}
    />
  );

// ♀ hero
const area = `
|   |
| ♀ |
|   |
`;

describe("Entity", () => {
  it("renders the hero sprite as stacked glyphs", async () => {
    const world = createAreaWorld(area);
    const hero = world.assertComponents(assertHero(world), [
      POSITION,
      SPRITE,
      RENDERABLE,
    ]);
    step(world, 5);

    const { renderer } = await renderEntity(world, hero);
    const glyphs = getGlyphs(renderer.scene);
    const expected = getFacingLayers(hero[SPRITE], hero[ORIENTABLE]?.facing)
      .map((layer) => layer.char)
      .filter((char) => char !== "█" && char.trim());

    expect(expected.length).toBeGreaterThan(0);
    expect(glyphs).toEqual(expect.arrayContaining(expected));
  });

  it("places the entity at its grid position", async () => {
    const world = createAreaWorld(area);
    const hero = world.assertComponents(assertHero(world), [
      POSITION,
      SPRITE,
      RENDERABLE,
    ]);
    hero[POSITION] = { x: 3, y: 2 };

    const { renderer } = await renderEntity(world, hero);
    const container = renderer.scene.children[0].instance;
    const { aspectRatio } = world.metadata.dimensions;

    expect(container.position.x).toBeCloseTo(3 * aspectRatio);
    expect(container.position.y).toBeCloseTo(-2);
  });

  describe("particles", () => {
    // animate springs on a clock advanced by rendered frames
    let clock = 0;
    beforeAll(() => Globals.assign({ now: () => clock }));
    afterAll(() => Globals.assign({ now: () => performance.now() }));

    const getParticleGlyphs = (scene: ReactThreeTest.Renderer["scene"]) => {
      scene.instance.updateMatrixWorld(true);
      return scene
        .findAll((node) => ["~", "≈"].includes(node.instance.userData?.char))
        .map((node) => {
          const position = node.instance.getWorldPosition(new THREE.Vector3());
          return {
            char: node.instance.userData.char as string,
            x: +position.x.toFixed(3),
            y: +position.y.toFixed(3),
          };
        })
        .sort((first, second) => first.x - second.x);
    };

    it("moves a changed particle while its siblings stay in place", async () => {
      const world = createAreaWorld(area);
      const hero = world.assertComponents(assertHero(world), [
        POSITION,
        SPRITE,
        RENDERABLE,
        SEQUENCABLE,
      ]);
      const frame = entities.createFrame(world, {
        [REFERENCE]: {
          tick: -1,
          delta: 0,
          suspended: false,
          suspensionCounter: -1,
        },
        [RENDERABLE]: { generation: 1 },
      });
      const createSmoke = (offsetX: number) =>
        entities.createParticle(world, {
          [PARTICLE]: {
            offsetX,
            offsetY: -1,
            offsetZ: particleHeight,
            animatedOrigin: { x: offsetX, y: 0 },
            amount: 1,
            duration: 350,
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: smokeLight,
        });
      const still = createSmoke(-1);
      const rising = createSmoke(1);
      hero[SEQUENCABLE].states.smoke = {
        name: "smokeWind",
        reference: world.getEntityId(frame),
        elapsed: 0,
        args: { generation: 0, extinguish: 0, simmer: false },
        particles: {
          still: world.getEntityId(still),
          rising: world.getEntityId(rising),
        },
      };
      const render = () => (
        <Entity
          entity={hero}
          x={hero[POSITION].x}
          y={hero[POSITION].y}
          generation={getEntityGeneration(world, hero)}
          inRadius
          inside={false}
          outside={false}
        />
      );
      const { renderer, advanceFrames } = await renderScene(world, render());
      // the test renderer skips global effects that advance springs
      const settle = async () => {
        for (let frame = 0; frame < 15; frame += 1) {
          clock += FRAME;
          await advanceFrames(1);
          raf.advance();
        }
      };
      await settle();
      const [stillBefore, risingBefore] = getParticleGlyphs(renderer.scene);

      const update = async () => {
        rerenderEntity(world, frame);
        await ReactThreeTestRenderer.act(async () =>
          renderer.update(
            <WorldProvider value={createWorldContext(world)}>
              {render()}
            </WorldProvider>
          )
        );
        await settle();
        return getParticleGlyphs(renderer.scene);
      };

      // rise one more cell
      rising[PARTICLE].offsetY = -2;
      const [stillRisen, risen] = await update();

      expect(stillRisen).toEqual(stillBefore);
      expect(risen).toEqual({ ...risingBefore, y: risingBefore.y + 1 });

      // thicken in place
      rising[PARTICLE].amount = 2;
      const [stillThick, thick] = await update();

      expect(stillThick).toEqual(stillBefore);
      expect(thick).toEqual({ ...risen, char: "≈" });
    });
  });
});

it("can hide circular lighting without changing unit glyphs or fog visibility", async () => {
  const { LightingContext } = await import("./CoveredLight");
  const world = createAreaWorld(area);
  const hero = world.assertComponents(assertHero(world), [
    POSITION,
    SPRITE,
    RENDERABLE,
    "LIGHT",
  ]);
  hero.LIGHT.brightness = 5;
  const visibility = world
    .getEntities(["FOG"])
    .map((entity) => entity.FOG.visibility);
  const scene = (enabled: boolean) => (
    <LightingContext.Provider value={enabled}>
      <Entity
        entity={hero}
        x={hero.POSITION.x}
        y={hero.POSITION.y}
        generation={getEntityGeneration(world, hero)}
        inRadius
        inside={false}
        outside={false}
      />
    </LightingContext.Provider>
  );
  const { renderer } = await renderScene(world, scene(true));
  expect(
    renderer.scene.findAll((node) => node.instance instanceof THREE.PointLight)
  ).toHaveLength(1);
  const before = getGlyphs(renderer.scene);
  await renderer.update(
    <WorldProvider value={createWorldContext(world)}>
      {scene(false)}
    </WorldProvider>
  );
  expect(
    renderer.scene.findAll((node) => node.instance instanceof THREE.PointLight)
  ).toHaveLength(0);
  expect(getGlyphs(renderer.scene)).toEqual(before);
  expect(
    world.getEntities(["FOG"]).map((entity) => entity.FOG.visibility)
  ).toEqual(visibility);
  await renderer.unmount();
});
