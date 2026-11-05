import Entity from ".";
import { assertHero, createAreaWorld, step } from "../../testing/harness";
import { renderScene } from "../../testing/render";
import { POSITION } from "../../engine/components/position";
import { SPRITE } from "../../engine/components/sprite";
import { RENDERABLE } from "../../engine/components/renderable";
import { ORIENTABLE } from "../../engine/components/orientable";
import { getFacingLayers } from "../../game/assets/ui";
import { getEntityGeneration } from "../../engine/systems/renderer";
import { World } from "../../engine";
import { TypedEntity } from "../../engine/entities";
import type { ReactThreeTest } from "@react-three/test-renderer";

// the font is loaded over the network, provide it from disk instead.
// glyphs are tagged with their char to be found in the scene
jest.mock("@react-three/drei", () => {
  const { Font } = require("three-stdlib");
  const font = new Font(require("../../../public/fonts/MostPerfectDOSVGA.json"));
  return {
    ...jest.requireActual("@react-three/drei"),
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
});
