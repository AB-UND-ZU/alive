import { createNpc, createCell } from "../../bindings/creation";
import { npcSequence } from "../../game/assets/utils";
import { registerEntity, moveEntity } from "../../engine/systems/map";
import { INVENTORY } from "../../engine/components/inventory";
import { POSITION } from "../../engine/components/position";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOG } from "../../engine/components/fog";
import { PLAYER } from "../../engine/components/player";
import { STATS } from "../../engine/components/stats";
import {
  advanceUntil,
  advance,
  assertHero,
  createAreaWorld,
  countItems,
  findInArea,
  giveItems,
  step,
} from "../../testing/harness";
import { getMessages, interact, setup } from "../doors/helpers";
import {
  addNpc,
  claimQuest,
  getFocus,
  getLines,
  getStep,
  press,
  revisit,
} from "./helpers";

// ♀ hero, R fire chief, M nomad
const area = `
|              |
|  ♀R          |
|              |
|          M   |
`;

const setupChief = () => {
  const { world, ...rest } = setup(area);
  const hero = world.assertComponents(rest.hero, [
    EQUIPPABLE,
    INVENTORY,
    PLAYER,
    POSITION,
    STATS,
  ]);
  const chief = addNpc(
    world,
    "fireChief",
    findInArea(area, "R"),
    "fireChiefNpc"
  );
  const nomad = addNpc(world, "fireNomad", findInArea(area, "M"));
  step(world, 5);
  return { world, hero, chief, nomad };
};

describe("fire chief", () => {
  it("asks for golem parts and refuses without them", () => {
    const { world, hero, chief } = setupChief();

    expect(getStep(world, chief)).toBe("golem");
    expect(getLines(chief).slice(0, 3)).toEqual([
      "Greetings, I am",
      "the Chief of fire",
      "haven.",
    ]);

    interact(world, 30);
    press(world, "right");

    expect(getMessages(world, hero)).toEqual(["Not completed!"]);
  });

  it("rewards golem parts with gold, experience and a pickaxe", () => {
    const { world, hero, chief } = setupChief();
    giveItems(world, hero, [{ stackable: "golem", amount: 3 }]);

    claimQuest(world);
    advanceUntil(world, () => hero[STATS].xp === 10, 5000);

    expect(countItems(world, hero, { stackable: "golem" })).toBe(0);
    expect(
      countItems(world, hero, { stackable: "resource", material: "gold" })
    ).toBe(1);
    expect(hero[EQUIPPABLE].tool).toBeDefined();
    expect(getStep(world, chief)).toBe("nomad");
    expect(getLines(chief)).toContain("I need to ask you");
  });

  it("points the hero to the hidden nomad", () => {
    const { world, hero, chief, nomad } = setupChief();
    giveItems(world, hero, [{ stackable: "golem", amount: 3 }]);
    claimQuest(world);
    revisit(world);
    nomad[FOG].visibility = "hidden";

    interact(world, 30);
    press(world, "right");

    expect(getFocus(world)).toEqual({
      target: world.getEntityId(nomad),
      highlight: "quest",
    });
    expect(getStep(world, chief)).toBe("nomad");
  });

  it("trades the nomad's schema for gold and a ring or amulet", () => {
    const { world, hero, chief, nomad } = setupChief();
    giveItems(world, hero, [{ stackable: "golem", amount: 3 }]);
    claimQuest(world);
    revisit(world);
    nomad[FOG].visibility = "visible";
    giveItems(world, hero, [{ stackable: "schema", amount: 1 }]);

    interact(world, 30);
    press(world, "right");
    press(world, "down");
    press(world, "right");
    press(world, "close");
    step(world, 5);

    expect(countItems(world, hero, { stackable: "schema" })).toBe(0);
    expect(countItems(world, hero, { accessory: "amulet" })).toBe(1);
    expect(
      countItems(world, hero, { stackable: "resource", material: "gold" })
    ).toBe(2);
    expect(getStep(world, chief)).toBe("worm");
    expect(getLines(chief)).toContain("Legends tell of a");
    expect(hero[PLAYER].popup).toBeUndefined();
  });
});

describe("jetty guard", () => {
  it.each(["left", "right"])(
    "steps %s aside when approached, returns when hero leaves, and can do it again",
    (side) => {
      const world = createAreaWorld(`
|           |
| ♀         |
|           |
|           |
|           |
|           |
|           |
|           |
|           |
`);
      const hero = assertHero(world);
      const guard = createNpc(world, "fireJettyGuard", { x: 5, y: 4 });
      registerEntity(world, guard);
      const blocker = createCell(
        world,
        { x: side === "left" ? 6 : 4, y: 4 },
        "mountain",
        "visible"
      );
      blocker.all.forEach((entity) => {
        if (entity[POSITION]) registerEntity(world, entity);
      });
      npcSequence(world, guard, "fireJettyGuardNpc", { orientation: "up" });
      advance(world, 1200);
      expect(guard[POSITION]).toEqual({ x: 5, y: 4 });
      moveEntity(world, hero, { x: 5, y: 6 });
      advanceUntil(
        world,
        () => guard[POSITION].x === (side === "left" ? 4 : 6)
      );
      advance(world, 2400);
      expect(guard[POSITION]).toEqual({ x: side === "left" ? 4 : 6, y: 4 });
      moveEntity(world, hero, { x: 1, y: 1 });
      advanceUntil(world, () => guard[POSITION].x === 5);
      expect(guard[POSITION]).toEqual({ x: 5, y: 4 });
      moveEntity(world, hero, { x: 5, y: 6 });
      advanceUntil(
        world,
        () => guard[POSITION].x === (side === "left" ? 4 : 6)
      );
    }
  );
});
