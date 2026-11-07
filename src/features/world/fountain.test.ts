import { AFFECTABLE } from "../../engine/components/affectable";
import { PLAYER } from "../../engine/components/player";
import { STATS } from "../../engine/components/stats";
import { advance, advanceUntil, createAreaWorld } from "../../testing/harness";
import { assertUnit } from "./helpers";

// ♀ hero, ⌠ fountain
const plaza = `
|                  |
| ♀⌠               |
|                  |
`;

const far = `
|                  |
| ⌠      ♀         |
|                  |
`;

const setup = (area: string) => {
  const world = createAreaWorld(area, { size: 24 });
  const hero = assertUnit(world);
  hero[STATS].maxHp = 20;
  hero[STATS].hp = 5;
  return { world, hero };
};

describe("fountain", () => {
  it("heals a hurt hero standing next to it up to full health", () => {
    const { world, hero } = setup(plaza);

    advanceUntil(world, () => hero[STATS].hp > 5, 10000);
    advanceUntil(world, () => hero[STATS].hp === hero[STATS].maxHp, 60000);

    expect(hero[PLAYER].receivedStats.hp).toBe(15);
  });

  it("does not heal a hero further away", () => {
    const { world, hero } = setup(far);

    advance(world, 20000);

    expect(hero[STATS].hp).toBe(5);
  });

  it("puts out a burning hero next to it", () => {
    const { world, hero } = setup(plaza);
    hero[AFFECTABLE].burn = 10;

    advanceUntil(world, () => hero[AFFECTABLE].burn === 0, 3000);
  });
});
