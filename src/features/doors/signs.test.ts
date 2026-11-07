import {
  advanceUntil,
  findEntityAt,
  findInArea,
  step,
  trigger,
} from "../../testing/harness";
import { ACTIONABLE } from "../../engine/components/actionable";
import { PLAYER } from "../../engine/components/player";
import { POPUP } from "../../engine/components/popup";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { getTab, isInPopup } from "../../engine/systems/popup";
import { getPrompt, interact, setup } from "./helpers";

// ♀ hero, S sign
const area = `
|        |
|   ♀S   |
|        |
`;

const signs = [
  "menu_sign",
  "spawn_sign",
  "fruit_sign",
  "potion_sign",
  "guide_sign",
  "trader_sign",
  "worm_sign",
];

const setupSign = (cell: string) => {
  const { world, hero } = setup(area, { legend: { S: cell } });
  const sign = findEntityAt(world, findInArea(area, "S"), [
    POPUP,
    POSITION,
    STATS,
  ])!;
  return { world, hero, sign };
};

describe("signs", () => {
  it.each(signs)("reads the %s as a tip", (cell) => {
    const { world, hero, sign } = setupSign(cell);

    expect(hero[ACTIONABLE].popup).toBe(world.getEntityId(sign));
    expect(getPrompt(world, sign)).toBe("READ");

    interact(world, 30);

    expect(hero[PLAYER].popup).toBe(world.getEntityId(sign));
    expect(getTab(world, sign)).toBe("info");
    expect(sign[POPUP].lines[0].length).toBeGreaterThan(0);

    step(world, 30);
    trigger(world, "close");
    advanceUntil(world, () => !isInPopup(world, hero), 1000);
  });

  it("can't read a destroyed sign", () => {
    const { world, hero, sign } = setupSign("guide_sign");

    sign[STATS].hp = 0;
    step(world, 5);

    expect(hero[ACTIONABLE].popup).toBeUndefined();
    interact(world, 30);
    expect(hero[PLAYER].popup).toBeUndefined();
  });
  it("closes when the reading hero gets hit", () => {
    const corridor = `
|███████|
|█S♀  ◀█|
|███████|
`;
    const { world, hero } = setup(corridor, { legend: { S: "spawn_sign" } });
    const sign = findEntityAt(world, findInArea(corridor, "S"), [POPUP])!;
    hero[STATS].maxHp = 20;
    hero[STATS].hp = 20;

    interact(world, 30);
    expect(hero[PLAYER].popup).toBe(world.getEntityId(sign));

    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp, 10000);
    step(world);

    expect(isInPopup(world, hero)).toBeFalsy();
  });
});
