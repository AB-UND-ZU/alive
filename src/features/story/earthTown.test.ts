import { entities } from "../../engine";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { TRACKABLE } from "../../engine/components/trackable";
import { getSequence } from "../../engine/systems/sequence";
import { assertIdentifier } from "../../engine/utils";
import { npcSequence } from "../../game/assets/utils";
import {
  advanceUntil,
  assertHero,
  createAreaWorld,
  step,
  walk,
} from "../../testing/harness";
import { getMessages } from "../doors/helpers";

// ♀ hero, φ compass, town from x 6 to 9
const area = `
|              |
|  ♀φ          |
|              |
`;

const setupTown = () => {
  const world = createAreaWorld(area);
  const hero = world.assertComponents(assertHero(world), [
    SPAWNABLE,
    EQUIPPABLE,
  ]);
  const town = entities.createProcessor(world, {
    [POSITION]: { x: 8, y: 1 },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
  });
  npcSequence(world, town, "earthTownNpc", {
    topLeft: { x: 6, y: 0 },
    bottomRight: { x: 9, y: 2 },
    spawn: { x: 8, y: 2 },
  });
  walk(world, "right");
  advanceUntil(world, () => !!hero[EQUIPPABLE].compass, 3000);
  return { world, hero, town };
};

describe("earth town", () => {
  it("keeps the spawn while the hero is outside of town", () => {
    const { world, hero, town } = setupTown();
    const spawn = { ...hero[SPAWNABLE].position };

    walk(world, "right", 2);
    step(world, 10);

    expect(hero[SPAWNABLE].position).toEqual(spawn);
    expect(getSequence(world, town, "npc")).toBeDefined();
  });

  it("moves the spawn into town and points the compass to it", () => {
    const { world, hero, town } = setupTown();

    walk(world, "right", 3);
    step(world, 10);

    const spawnMarker = assertIdentifier(world, "spawn");
    const compass = world.assertByIdAndComponents(hero[EQUIPPABLE].compass, [
      TRACKABLE,
    ]);
    expect(hero[SPAWNABLE].position).toEqual({ x: 8, y: 2 });
    expect(spawnMarker[POSITION]).toEqual({ x: 8, y: 2 });
    expect(compass[TRACKABLE].target).toBe(world.getEntityId(spawnMarker));
    expect(getMessages(world, hero)).toContain("Spawn updated!");
    expect(getSequence(world, town, "npc")).toBeUndefined();
  });
});
