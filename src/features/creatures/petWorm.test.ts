import { getSightCells } from "../../engine/systems/visibility";
import { entities } from "../../engine";
import { BELONGABLE } from "../../engine/components/belongable";
import { INVENTORY } from "../../engine/components/inventory";
import { LOOTABLE } from "../../engine/components/lootable";
import { ITEM } from "../../engine/components/item";
import { POSITION } from "../../engine/components/position";
import { TAMEABLE } from "../../engine/components/tameable";
import { createItemAsDrop } from "../../engine/systems/drop";
import { getItemSprite } from "../../game/assets/utils";
import {
  advanceUntil,
  countItems,
  giveItems,
  walk,
} from "../../testing/harness";
import { advanceTicks, createCreatureWorld } from "./helpers";

const drop = (
  world: ReturnType<typeof createCreatureWorld>["world"],
  x: number,
  y: number,
  stackable: "worm" | "coin"
) =>
  createItemAsDrop(world, { x, y }, entities.createItem, {
    ITEM: { stackable, amount: 1 },
    SPRITE: getItemSprite({ stackable }),
  });

function setup(
  area: string,
  level: "LEVEL_TUTORIAL" | "LEVEL_ISLAND" = "LEVEL_TUTORIAL"
) {
  const { world, hero } = createCreatureWorld(area, { P: "pet" }, { level });
  const [pet] = world.getEntities([POSITION, BELONGABLE, TAMEABLE, INVENTORY]);
  Object.assign(pet[TAMEABLE], {
    owner: world.getEntityId(hero),
    attributes: {},
    skills: [],
  });
  pet[BELONGABLE].faction = "settler";
  return { world, hero, pet };
}

it("catches a crawling worm and then gathers another item", () => {
  const { world, pet } = setup(
    "|             |\n|             |\n|  P  ♀       |\n|             |\n|             |"
  );
  const worm = drop(world, 8, 2, "worm");
  const carrier = world.assertByIdAndComponents(worm[ITEM].carrier, [POSITION]);
  advanceUntil(
    world,
    () => carrier[POSITION].x !== 8 || carrier[POSITION].y !== 2
  );
  pet[TAMEABLE].skills = ["collect"];
  advanceUntil(
    world,
    () => countItems(world, pet, { stackable: "worm" }) === 1
  );
  const coin = drop(world, 4, 2, "coin");
  advanceUntil(world, () => coin[ITEM].carrier === world.getEntityId(pet));
});

it("gathers other items when a visible worm is unreachable", () => {
  const { world, hero, pet } = setup(
    "|█████████████|\n|█   ±±±±±  ██|\n|█ ♀P±   ±  ██|\n|█   ±±±±±  ██|\n|█          ██|\n|█████████████|"
  );
  pet[TAMEABLE].skills = ["collect"];
  const worm = drop(world, 6, 2, "worm");
  const coin = drop(world, 7, 4, "coin");
  const carrier = worm[ITEM].carrier;
  advanceTicks(world, 1);
  expect(getSightCells(hero)).toContainEqual(
    world.assertByIdAndComponents(carrier, [POSITION])[POSITION]
  );
  advanceUntil(world, () => coin[ITEM].carrier === world.getEntityId(pet));
  advanceTicks(world, 4);
  expect(worm[ITEM].carrier).toBe(carrier);
});

it("brings its cargo back when the worm it was chasing leaves the owner's sight", () => {
  const { world, hero, pet } = setup(
    "|██████████████████████|\n|█                    █|\n|█   ±±±±±±±±±±±      █|\n|█       P♀           █|\n|█                    █|\n|█                    █|\n|██████████████████████|",
    "LEVEL_ISLAND"
  );
  const worm = drop(world, 9, 1, "worm");
  const moving = world.assertByIdAndComponents(worm[ITEM].carrier, [POSITION]);
  advanceUntil(
    world,
    () => moving[POSITION].x !== 9 || moving[POSITION].y !== 1
  );
  expect(getSightCells(hero)).toContainEqual(moving[POSITION]);
  giveItems(world, pet, [{ stackable: "stick", amount: 3 }]);
  pet[TAMEABLE].skills = ["collect"];
  const start = { ...pet[POSITION] };
  advanceUntil(world, () => pet[POSITION].x !== start.x);
  walk(world, "right", 9);
  expect(getSightCells(hero)).not.toContainEqual(moving[POSITION]);
  advanceUntil(world, () =>
    world
      .getEntities([LOOTABLE, INVENTORY])
      .some(
        (carrier) =>
          carrier[LOOTABLE].droppedBy === world.getEntityId(pet) &&
          countItems(world, carrier, { stackable: "stick" }) === 3
      )
  );
  expect(worm[ITEM].carrier).toBe(world.getEntityId(moving));
});
