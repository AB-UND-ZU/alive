import {
  advanceUntil,
  createAreaWorld,
  findEntityAt,
  getItems,
  walk,
} from "../../testing/harness";
import { MAX_STAT_VALUE, STATS } from "../../engine/components/stats";
import { PLAYER } from "../../engine/components/player";
import { LOOTABLE } from "../../engine/components/lootable";
import {
  finishCollecting,
  placeDrop,
  recordMessages,
  setupHero,
} from "./helpers";

const area = `
|     |
| ♀   |
|     |
`;
const ground = { x: 2, y: 1 };

const setup = () => {
  const world = createAreaWorld(area);
  const hero = setupHero(world);
  hero[STATS].maxHp = 10;
  hero[STATS].hp = 4;
  hero[STATS].maxMp = 5;
  hero[STATS].mp = 0;
  return { world, hero };
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("stat pickups", () => {
  it("restores health directly instead of adding an item", () => {
    const { world, hero } = setup();
    placeDrop(world, ground, [{ stat: "hp", amount: 3 }]);

    walk(world, "right");
    finishCollecting(world, hero);

    expect(hero[STATS].hp).toBe(7);
    expect(hero[PLAYER].receivedStats.hp).toBe(3);
    expect(getItems(world, hero)).toEqual([]);
  });

  it("caps health at maximum and only counts the restored part", () => {
    const { world, hero } = setup();
    placeDrop(world, ground, [{ stat: "hp", amount: 9 }]);

    walk(world, "right");
    finishCollecting(world, hero);

    expect(hero[STATS].hp).toBe(10);
    expect(hero[PLAYER].receivedStats.hp).toBe(6);
  });

  it("shows zero when health is already full", () => {
    const { world, hero } = setup();
    const messages = recordMessages();
    hero[STATS].hp = 10;
    placeDrop(world, ground, [{ stat: "hp", amount: 2 }]);

    walk(world, "right");
    finishCollecting(world, hero);

    expect(hero[STATS].hp).toBe(10);
    expect(hero[PLAYER].receivedStats.hp).toBe(0);
    expect(messages).toEqual(["0"]);
  });

  it("restores mana up to maximum mana", () => {
    const { world, hero } = setup();
    placeDrop(world, ground, [{ stat: "mp", amount: 8 }]);

    walk(world, "right");
    finishCollecting(world, hero);

    expect(hero[STATS].mp).toBe(5);
    expect(hero[PLAYER].receivedStats.mp).toBe(5);
  });

  it("raises maximum health up to its cap", () => {
    const { world, hero } = setup();
    hero[STATS].maxHpCap = 12;
    placeDrop(world, ground, [{ stat: "maxHp", amount: 5 }]);

    walk(world, "right");
    finishCollecting(world, hero);

    expect(hero[STATS].maxHp).toBe(12);
    expect(hero[PLAYER].receivedStats.maxHp).toBe(2);
  });

  it("limits uncapped stats to the highest stat value", () => {
    const { world, hero } = setup();
    hero[STATS].maxHpCap = MAX_STAT_VALUE - 1;
    placeDrop(world, ground, [{ stat: "maxHpCap", amount: 5 }]);

    walk(world, "right");
    finishCollecting(world, hero);

    expect(hero[STATS].maxHpCap).toBe(MAX_STAT_VALUE);
  });

  it("does not take experience into the inventory but grants it nearby", () => {
    const { world, hero } = setup();
    const position = { x: 3, y: 1 };
    placeDrop(world, position, [{ stat: "xp", amount: 2 }]);

    advanceUntil(world, () => hero[STATS].xp === 2);

    expect(getItems(world, hero)).toEqual([]);
    expect(findEntityAt(world, position, [LOOTABLE])).toBeUndefined();
  });
});
