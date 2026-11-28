import { BEHAVIOUR } from "../../engine/components/behaviour";
import { createChest } from "../../bindings/creation";
import { applyEffects } from "../../engine/systems/damage";
import { moveEntity, registerEntity } from "../../engine/systems/map";
import { BURNABLE } from "../../engine/components/burnable";
import { INVENTORY } from "../../engine/components/inventory";
import { ATTACKABLE } from "../../engine/components/attackable";
import { TAMEABLE } from "../../engine/components/tameable";
import { BELONGABLE } from "../../engine/components/belongable";
import { NpcType } from "../../engine/components/npc";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { rage } from "../../game/assets/ui";
import { advanceUntil, giveItems, holdMove } from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  distanceBetween,
  giveSword,
  getCreature,
  toughen,
  trace,
} from "./helpers";

const setup = (type: NpcType) => {
  const { world, hero } = createCreatureWorld(
    `
|♀ P       |
`,
    { P: type }
  );
  toughen(hero);
  const plant = getCreature(world, type);
  return { world, hero, plant };
};

const awaken = (
  world: ReturnType<typeof setup>["world"],
  plant: ReturnType<typeof setup>["plant"]
) => {
  holdMove(world, ["right"]);
  advanceUntil(world, () => plant[BELONGABLE].faction === "wild", 2000);
  holdMove(world, []);
  advanceUntil(world, () => ATTACKABLE in plant, 5000);
};

describe("dormant plants", () => {
  it.each(["rose", "violet", "clover"] as NpcType[])(
    "keeps a %s passive and unharmable until the hero touches it",
    (type) => {
      const { world, hero, plant } = setup(type);
      const start = { ...plant[POSITION] };

      advanceTicks(world, 6);

      expect(plant[BELONGABLE].faction).toBe("unit");
      expect(ATTACKABLE in plant).toBe(false);
      expect(plant[POSITION]).toEqual(start);
      expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
    }
  );

  it.each(["rose", "violet", "clover"] as NpcType[])(
    "destroys a burning %s and its inventory even on a lethal hit",
    (type) => {
      const { world, plant } = setup(type);
      const id = world.getEntityId(plant);
      const items = [...plant[INVENTORY].items];
      awaken(world, plant);
      applyEffects(world, plant, 3, 0);
      expect(plant[BURNABLE]?.burning).toBe(true);
      plant[STATS].hp = 0;
      advanceUntil(world, () => !world.getEntityById(id), 15000);
      expect(items.every((item) => !world.getEntityById(item))).toBe(true);
    }
  );

  it("burns rotten wood without releasing its worm", () => {
    const { world } = setup("rose");
    const trunk = createChest(world, "rotten", { x: 6, y: 0 }, [{ stackable: "worm", amount: 1 }]);
    registerEntity(world, trunk);
    const worm = trunk[INVENTORY].items[0];
    const id = world.getEntityId(trunk);
    world.assertByIdAndComponents(id, [BURNABLE])[BURNABLE].burning = true;
    advanceUntil(world, () => !world.getEntityById(id), 15000);
    expect(world.getEntityById(worm)).toBeUndefined();
  });

  it("wakes up with rage and becomes vulnerable after being touched", () => {
    const { world, plant } = setup("rose");

    holdMove(world, ["right"]);
    advanceUntil(world, () => plant[TOOLTIP].idle?.id === rage.id, 2000);
    holdMove(world, []);

    expect(plant[BELONGABLE].faction).toBe("wild");
    expect(ATTACKABLE in plant).toBe(false);

    advanceUntil(world, () => ATTACKABLE in plant, 5000);
  });

  it("lets a pet with Attack scratch an awakened rose and take its thorns", () => {
    const { world, hero } = createCreatureWorld(
      "|██████|\n|█ ♀R██|\n|█ P ██|\n|██████|", { R: "rose", P: "pet" }
    );
    const pet = getCreature(world, "pet");
    const rose = getCreature(world, "rose");
    Object.assign(pet[TAMEABLE]!, { owner: world.getEntityId(hero), skills: ["attack"], attributes: {} });
    pet[BELONGABLE].faction = "settler";
    if (!pet.EQUIPPABLE?.weapon) giveItems(world, pet, [{ weapon: "sword", material: "iron", amount: 0, bound: true }]);
    pet[STATS].power = 0;
    toughen(hero);
    awaken(world, rose);
    rose[BEHAVIOUR].patterns = [];
    moveEntity(world, rose, { x: 3, y: 1 });
    moveEntity(world, hero, { x: 2, y: 1 });
    moveEntity(world, pet, { x: 3, y: 2 });
    giveSword(world, hero);
    holdMove(world, ["right"]);
    advanceUntil(world, () => rose[STATS].hp < rose[STATS].maxHp, 5000);
    holdMove(world, []);
    const remaining = rose[STATS].hp;
    const petHp = pet[STATS].hp;
    advanceUntil(world, () => rose[STATS].hp < remaining, 5000);
    expect(remaining - rose[STATS].hp).toBe(1 - rose[STATS].armor);
    expect(pet[STATS].hp).toBeLessThan(petHp);
  });

  it("lets a rose run away from the hero until it is out of reach", () => {
    const { world, hero, plant } = setup("rose");
    awaken(world, plant);

    advanceTicks(world, 16);
    const escaped = { ...plant[POSITION] };
    advanceTicks(world, 4);

    expect(
      distanceBetween(world, plant[POSITION], hero[POSITION])
    ).toBeGreaterThanOrEqual(4);
    expect(plant[POSITION]).toEqual(escaped);
    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
  });

  it("lets a rose step only every second tick", () => {
    const { world, plant } = setup("rose");
    awaken(world, plant);

    const positions = trace(world, 6, () => plant[POSITION].x);
    const steps = positions
      .slice(1)
      .filter((x, index) => x !== positions[index]).length;

    expect(steps).toBeGreaterThan(0);
    expect(steps).toBeLessThanOrEqual(3);
  });

  it("lets a violet keep its distance and cast bolts at the hero", () => {
    const { world, hero, plant } = setup("violet");
    awaken(world, plant);

    const idles = trace(world, 6, () => plant[TOOLTIP].idle?.id);

    expect(idles).toContain(rage.id);
    expect(hero[STATS].hp).toBeLessThan(hero[STATS].maxHp);

    expect(
      distanceBetween(world, plant[POSITION], hero[POSITION])
    ).toBeGreaterThan(1);
  });

  it("lets a clover chase and hit the hero", () => {
    const { world, hero, plant } = setup("clover");
    awaken(world, plant);

    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp, 3000);
  });

  it("lets a clover pause its attacks to heal itself", () => {
    const { world, hero, plant } = setup("clover");
    awaken(world, plant);
    plant[STATS].hp = 10;

    advanceUntil(world, () => plant[TOOLTIP].idle?.id === rage.id, 10000);
    const hp = hero[STATS].hp;
    advanceUntil(world, () => plant[STATS].hp > 10, 5000);

    expect(hero[STATS].hp).toBe(hp);
  });

  it("does not let a clover heal while the hero is far away", () => {
    const { world, hero, plant } = setup("clover");
    awaken(world, plant);
    plant[STATS].hp = 10;

    holdMove(world, ["left"]);
    advanceUntil(
      world,
      () => distanceBetween(world, plant[POSITION], hero[POSITION]) > 9,
      10000
    );
    holdMove(world, []);
    advanceTicks(world, 40);

    expect(plant[STATS].hp).toBe(10);
  });
});
