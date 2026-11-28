import { entities } from "../../engine";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LOOTABLE } from "../../engine/components/lootable";
import { POSITION } from "../../engine/components/position";
import { SPRITE } from "../../engine/components/sprite";
import { createItemAsDrop, dropBagItem } from "../../engine/systems/drop";
import { getItemSprite } from "../../game/assets/utils";
import { advanceUntil, countItems, giveItems } from "../../testing/harness";
import { advanceTicks, createCreatureWorld, getCreature } from "./helpers";

const stick = { stackable: "stick", amount: 1 } as const;
const field = `
|             |
|             |
|             |
|  P   ♀      |
|             |
|             |
|             |
`;

function setup(area = field) {
  const { world, hero } = createCreatureWorld(area, { P: "pet" });
  const pet = world.assertComponents(getCreature(world, "pet"), [
    "TAMEABLE", "STATS", POSITION, INVENTORY, "TOOLTIP",
  ]);
  pet.TAMEABLE.owner = world.getEntityId(hero);
  pet.TAMEABLE.skills = [];
  pet.TAMEABLE.attributes = {};
  pet.STATS.level = 1;
  pet.STATS.maxXp = 10;
  const returned = () => world.getEntities([LOOTABLE, INVENTORY]).find(
    drop => drop[LOOTABLE].droppedBy === world.getEntityId(pet)
  );
  const toss = () => {
    const [item] = giveItems(world, hero, [stick]);
    dropBagItem(world, hero, world.assertComponents(item, [ITEM, SPRITE]), { x: 2, y: 2 });
  };
  const waitForRequest = () => {
    pet.TAMEABLE.attributes.vocal = false;
    const roll = jest.spyOn(Math, "random").mockReturnValue(0);
    try {
      advanceUntil(world, () => pet.TOOLTIP.override === "visible" &&
        pet.TOOLTIP.dialogs.some(line => line.some(sprite => sprite.name === "Stick")), 30000);
    } finally {
      roll.mockRestore();
    }
  };
  return { world, pet, hero, returned, toss, waitForRequest };
}

it.each([false, true])("retrieves loose sticks without Collect (tamed %s)", tamed => {
  const { world, pet, returned } = setup();
  if (!tamed) delete pet.TAMEABLE.owner;
  createItemAsDrop(world, { x: 3, y: 3 }, entities.createItem, {
    [ITEM]: { ...stick, bound: false }, [SPRITE]: getItemSprite(stick),
  });
  advanceUntil(world, () => !!returned() && countItems(world, returned()!, stick) === 1);
  const gift = returned();
  advanceTicks(world, 6);
  expect(returned()).toBe(gift);
  expect(pet.STATS.xp).toBe(0);
});

it.each([[false, false], [true, false], [true, true]])(
  "fetches a thrown stick, waits and returns it (tamed %s, requested %s)", (tamed, requested) => {
    const { world, pet, hero, toss, returned, waitForRequest } = setup();
    if (!tamed) delete pet.TAMEABLE.owner;
    if (requested) waitForRequest();
    toss();
    advanceUntil(world, () => countItems(world, pet, stick) === 1);
    const path: string[] = [];
    const ticks: number[] = [];
    advanceUntil(world, () => {
      const point = [pet[POSITION].x - hero[POSITION].x, pet[POSITION].y - hero[POSITION].y].join(",");
      if (path.at(-1) !== point) {
        path.push(point);
        ticks.push(world.metadata.gameEntity.RENDERABLE.generation);
      }
      return !!returned();
    }, 20000);
    const ring = ["0,-1", "1,-1", "1,0", "1,1", "0,1", "-1,1", "-1,0", "-1,-1"];
    const start = path.indexOf(ring[0]);
    expect(start).toBeGreaterThanOrEqual(0);
    const dance = requested ? [...ring, ...ring, ring[0]] : ring.slice(0, 4);
    expect(path.slice(start, start + dance.length)).toEqual(dance);
    const end = start + dance.length;
    const leftAt = ticks[end] ?? world.metadata.gameEntity.RENDERABLE.generation;
    expect(leftAt - ticks[end - 1]).toBeGreaterThanOrEqual(2);
    expect(countItems(world, pet, stick)).toBe(0);
    expect(pet.STATS.xp).toBe(requested ? 1 : 0);
    expect(pet.TOOLTIP.idle?.name === "HP").toBe(requested);
    advanceUntil(world, () => countItems(world, returned()!, stick) === 1);
    advanceTicks(world, 5);
    expect(pet.STATS.xp).toBe(requested ? 1 : 0);
  }
);

it("returns a requested stick and awards play XP in a narrow passage", () => {
  const { world, pet, toss, returned, waitForRequest } = setup(`
|█████████████|
|█████████████|
|█           █|
|█ P   ♀     █|
|█████████████|
`);
  waitForRequest();
  toss();
  advanceUntil(world, () => !!returned(), 20000);
  expect(pet.STATS.xp).toBe(1);
  expect(pet.TOOLTIP.idle?.name).toBe("HP");
  expect(pet.TOOLTIP.idle?.layers[0].color).toBe(pet.TAMEABLE.heartColor);
});
