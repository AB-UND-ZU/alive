import { entities } from "../../engine";
import { FOG } from "../../engine/components/fog";
import { LAYER } from "../../engine/components/layer";
import { POSITION } from "../../engine/components/position";
import { SPRITE } from "../../engine/components/sprite";
import { SWIMMABLE } from "../../engine/components/swimmable";
import { RENDERABLE } from "../../engine/components/renderable";
import { REVIVABLE } from "../../engine/components/revivable";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { getSequence } from "../../engine/systems/sequence";
import { tombstone1 } from "../../game/assets/sprites";
import { npcSequence, questSequence } from "../../game/assets/utils";
import {
  advanceUntil,
  assertHero,
  createAreaWorld,
  findInArea,
  getHero,
  step,
  walk,
} from "../../testing/harness";
import { interactAsPlayer } from "../doors/helpers";
import { addNpc, getDialogs, getFocus, refresh } from "./helpers";

// ♀ hero, H someone to find
const area = `
|                  |
|  ♀          H    |
|                  |
`;

const setupWaypoint = () => {
  const world = createAreaWorld(area, { size: 30 });
  const hero = world.assertComponents(assertHero(world), [STATS, POSITION]);
  const target = addNpc(world, "earthTrader", findInArea(area, "H"));
  questSequence(world, hero, "waypointQuest", {
    distance: 2,
    identifier: "earthTrader",
  });
  refresh(world);
  return { world, hero, target };
};

const createTombstone = () => {
  const world = createAreaWorld(area);
  const tombstone = entities.createTombstone(world, {
    [FOG]: { visibility: "visible", type: "object" },
    [LAYER]: {},
    [POSITION]: { x: 6, y: 1 },
    [RENDERABLE]: { generation: 0 },
    [REVIVABLE]: { available: false },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: tombstone1,
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: { dialogs: [], nextDialog: -1, persistent: false },
  });
  return { world, tombstone };
};

describe("tombstone quest", () => {
  it("resumes the previous quest once the hero is back at the grave", () => {
    const { world, hero, target } = setupWaypoint();
    walk(world, "right", 3);
    const grave = { ...hero[POSITION] };
    hero[STATS].hp = 0;

    advanceUntil(
      world,
      () => !!world.getEntity([REVIVABLE])?.[REVIVABLE].available,
      10000
    );
    advanceUntil(world, () => !!world.metadata.interact.active, 1000);
    interactAsPlayer(world);
    advanceUntil(world, () => !!getHero(world), 10000);
    step(world, 5);
    const revived = assertHero(world);

    expect(getSequence(world, revived, "quest")?.name).toBe("tombstoneQuest");
    expect(getFocus(world).highlight).toBe("tombstone");

    walk(world, "right", grave.x - revived[POSITION].x);
    step(world, 10);

    expect(getSequence(world, revived, "quest")?.name).toBe("waypointQuest");
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(target),
      highlight: "quest",
    });
  });
});

describe("tombstone", () => {
  it("shows RIP once its vision has ended", () => {
    const { world, tombstone } = createTombstone();
    npcSequence(world, tombstone, "tombstoneNpc", {});

    step(world, 5);

    expect(getDialogs(tombstone)).toEqual(["RIP"]);
    expect(tombstone[TOOLTIP].override).toBe("visible");
    expect(getSequence(world, tombstone, "npc")).toBeUndefined();
  });
});
