import { entities } from "../../engine";
import { POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { getSequence } from "../../engine/systems/sequence";
import { assertIdentifier } from "../../engine/utils";
import { npcSequence } from "../../game/assets/utils";
import { assertHero, createAreaWorld, step, walk } from "../../testing/harness";
import { getMessages } from "../doors/helpers";

// ♀ hero, haven around x 12
const area = `
|                  |
|  ♀               |
|                  |
`;

const setupHaven = () => {
  const world = createAreaWorld(area);
  const hero = world.assertComponents(assertHero(world), [SPAWNABLE]);
  const center = { x: 12, y: 1 };
  const haven = entities.createProcessor(world, {
    [POSITION]: { ...center },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
  });
  npcSequence(world, haven, "fireHavenNpc", {
    center,
    radius: 4,
    ratio: 1,
    spawn: { x: 12, y: 2 },
  });
  step(world, 5);
  return { world, hero, haven };
};

describe("fire haven", () => {
  it("keeps the spawn outside of the haven walls", () => {
    const { world, hero, haven } = setupHaven();
    const spawn = { ...hero[SPAWNABLE].position };

    walk(world, "right", 4);
    step(world, 10);

    expect(hero[SPAWNABLE].position).toEqual(spawn);
    expect(getSequence(world, haven, "npc")).toBeDefined();
  });

  it("moves the spawn into the haven once the hero arrives", () => {
    const { world, hero, haven } = setupHaven();

    walk(world, "right", 8);
    step(world, 10);

    expect(hero[SPAWNABLE].position).toEqual({ x: 12, y: 2 });
    expect(assertIdentifier(world, "spawn")[POSITION]).toEqual({
      x: 12,
      y: 2,
    });
    expect(getMessages(world, hero)).toContain("Spawn updated!");
    expect(getSequence(world, haven, "npc")).toBeUndefined();
  });
});
