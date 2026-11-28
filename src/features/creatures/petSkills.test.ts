import { saveAndLoad } from "../../testing/saves";
import { submitChat } from "../../engine/systems/popup";
import { getDistance } from "../../game/math/std";
import { sleep1, sleep2 } from "../../game/assets/ui";
import { getHarvestable } from "../../engine/systems/harvest";
import { gainPetXp } from "../../engine/systems/petCare";
import { getSequence } from "../../engine/systems/sequence";
import { INVENTORY } from "../../engine/components/inventory";
import { SPRITE } from "../../engine/components/sprite";
import { calculateDamage, getEntityStats } from "../../engine/systems/damage";
import { moveEntity } from "../../engine/systems/map";
import { createItemAsDrop, dropBagItem } from "../../engine/systems/drop";
import { entities } from "../../engine";
import { getItemSprite } from "../../game/assets/utils";
import { resolveSprite } from "../../game/assets/spriteIds";
import { getSceneFrame } from "../../renderers/interface/frame";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { BELONGABLE } from "../../engine/components/belongable";
import { HOMING } from "../../engine/components/homing";
import { ITEM } from "../../engine/components/item";
import { LOOTABLE } from "../../engine/components/lootable";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { PetSkill, petSkills, TAMEABLE } from "../../engine/components/tameable";
import { collectItem, getLootable } from "../../engine/systems/collect";
import {
  advanceUntil,
  face,
  countItems,
  giveItems,
  getMessages,
  getEntitiesAt,
  holdMove,
} from "../../testing/harness";
import { advanceTicks, createCreatureWorld, getCreature } from "./helpers";

const setup = (area: string, skills: PetSkill[]) => {
  const { world, hero } = createCreatureWorld(area, {
    P: "pet",
    C: "coin_one",
    S: "stump",
    B: "berry_one",
    T: "apple",
    W: "water",
    D: "water_deep",
    A: "sand",
    E: "prism",
  });
  const pet = world.assertComponents(getCreature(world, "pet"), [
    TAMEABLE,
    POSITION,
    STATS,
    BELONGABLE,
    INVENTORY,
  ]);
  pet[TAMEABLE].owner = world.getEntityId(hero);
  pet[BELONGABLE].faction = hero[BELONGABLE]!.faction;
  pet[TAMEABLE].skills = skills;
  if ((skills.includes("heal") || skills.includes("attack")) && !pet.EQUIPPABLE?.weapon) {
    giveItems(world, pet, [
      { weapon: "sword", material: "iron", amount: 0, bound: true },
    ]);
  }
  pet[TAMEABLE].attributes = {};
  return { world, hero, pet };
};

it("carries visible loot back, leaves it for the owner, and ignores loot behind walls", () => {
  const { world, hero, pet } = setup(
    `
| C      |
|███████ |
|        |
| ♀P C   |
|        |
`,
    ["collect"]
  );
  const hidden = getLootable(world, { x: 1, y: 0 })!;
  advanceUntil(world, () =>
    world
      .getEntities([LOOTABLE])
      .some((drop) => drop[LOOTABLE].droppedBy === world.getEntityId(pet))
  );
  const gift = world
    .getEntities([LOOTABLE, POSITION])
    .find((drop) => drop[LOOTABLE].droppedBy === world.getEntityId(pet))!;
  advanceTicks(world, 12);
  expect(getLootable(world, hidden[POSITION])).toBe(hidden);
  expect(getLootable(world, gift[POSITION])).toBe(gift);
  expect(collectItem(world, hero, gift)).toBe(true);
  advanceUntil(
    world,
    () => countItems(world, hero, { stackable: "coin" }) >= 1
  );
});

it("reserves one health and mana food and leaves health food when the owner is injured", () => {
  const { world, pet, hero } = setup("| ♀P   |", []);
  pet[TAMEABLE].attributes.hunger = false;
  hero[STATS].hp = hero[STATS].maxHp = 20;
  hero[STATS].mp = hero[STATS].maxMp = 10;
  const carrier = world.assertComponents(pet, [POSITION, "INVENTORY"]);
  giveItems(world, carrier, [
    { stackable: "apple", amount: 2 },
    { stackable: "shroom", amount: 1 },
  ]);
  advanceUntil(
    world,
    () => countItems(world, carrier, { stackable: "apple" }) === 1
  );
  advanceTicks(world, 6);
  expect(countItems(world, carrier, { stackable: "apple" })).toBe(1);
  hero[STATS].hp = 8;
  advanceUntil(
    world,
    () => countItems(world, carrier, { stackable: "apple" }) === 0
  );
  expect(countItems(world, carrier, { stackable: "shroom" })).toBe(1);
});

it("brings one piece of ore from a nearby mountain without a pickaxe", () => {
  const { world, pet } = setup(
    `
|      |
| ♀P█  |
|      |
`,
    ["harvest"]
  );
  advanceUntil(world, () =>
    world
      .getEntities([ITEM])
      .some(
        (item) =>
          item[ITEM].stackable === "ore" &&
          item[ITEM].amount === 1 &&
          world.getEntityById(item[ITEM].carrier)?.[LOOTABLE]?.droppedBy ===
            world.getEntityId(pet)
      )
  );
});

it("heals its injured owner with melee hits and delivers one mana drop for two kills", () => {
  const { world, pet, hero } = setup(
    `
|          |
| ♀P   E   |
|      E   |
|          |
`,
    ["disc", "heal", "mana"]
  );
  pet[TAMEABLE].attributes.aggression = true;
  hero[STATS].maxHp = 6;
  hero[STATS].hp = 4.75;
  hero[STATS].mp = 0;
  hero[STATS].maxMp = 5;
  for (const enemy of world.getEntities(["NPC", STATS, BEHAVIOUR])) {
    if (enemy.NPC.type !== "prism") continue;
    enemy[BEHAVIOUR].patterns = [];
    enemy[STATS].hp = 2;
    enemy[STATS].resist = 0;
  }
  advanceUntil(world, () => world.getEntities([HOMING]).length > 0);
  advanceUntil(world, () => hero[STATS].hp === 5.75);
  expect(hero[STATS].mp).toBe(0);
  advanceUntil(world, () => hero[STATS].hp === 6);
  expect(pet.MELEE!.hits).toBe(2);
  expect(hero[STATS].mp).toBe(0);
  const manaDrop = () => world.getEntities([LOOTABLE, INVENTORY, POSITION]).find(drop =>
    drop[LOOTABLE].droppedBy === world.getEntityId(pet) &&
    countItems(world, drop, { stat: "mp" }) === 1
  );
  advanceUntil(world, () => !!manaDrop());
  const mana = manaDrop()!;
  expect(collectItem(world, hero, mana)).toBe(true);
  advanceUntil(world, () => hero[STATS].mp === 1);
  expect(getMessages(world, hero)).toContain("+1");
  expect(getMessages(world, hero)).not.toContain("+0.25");
});

it("banks a healing hit at full health and spends it when the hero is injured", () => {
  const { world, hero, pet } = setup("| ♀P  E  |", ["disc", "heal"]);
  pet[TAMEABLE].attributes.aggression = true;
  const prism = getCreature(world, "prism");
  prism[BEHAVIOUR].patterns = [];
  prism[STATS].hp = 2;
  prism[STATS].resist = 0;
  hero[STATS].hp = hero[STATS].maxHp = 20;
  advanceUntil(world, () => !!hero.PLAYER?.defeatedUnits.prism);
  advanceTicks(world, 10);
  expect(pet.MELEE!.hits).toBe(0);
  hero[STATS].hp -= 1;
  advanceUntil(world, () => hero[STATS].hp === 20);
  expect(pet.MELEE!.hits).toBe(1);
  expect(getMessages(world, hero)).toContain("+1");
});

it("joins the owner's melee attack with its natural weapon", () => {
  const { world, hero, pet } = setup(
    `
|       |
|  ♀E   |
|  P    |
|       |
`,
    ["attack"]
  );
  const enemy = getCreature(world, "prism");
  enemy[BEHAVIOUR].patterns = [];
  enemy[STATS].hp = enemy[STATS].maxHp = 20;
  enemy[STATS].armor = 0;
  giveItems(world, hero, [{ weapon: "sword", material: "wood", amount: 1 }]);
  holdMove(world, ["right"]);
  advanceUntil(world, () => enemy[STATS].hp < 20);
  holdMove(world, []);
  const hits = pet.MELEE!.hits;
  const remaining = enemy[STATS].hp;
  advanceUntil(world, () => pet.MELEE!.hits > hits);
  expect(enemy[STATS].hp).toBeLessThan(remaining);
});

it("eats nearby food when injured without learning to collect or becoming tamed", () => {
  const { world, pet } = setup("| ♀ P    |", []);
  delete pet[TAMEABLE].owner;
  pet[STATS].hp = 3;
  const apple = { stackable: "apple", amount: 1, bound: false } as const;
  createItemAsDrop(world, { x: 5, y: 0 }, entities.createItem, {
    ITEM: apple,
    SPRITE: getItemSprite(apple),
  });
  advanceUntil(world, () => pet[STATS].hp === 5);
  expect(getLootable(world, { x: 5, y: 0 })).toBeUndefined();
  expect(pet[TAMEABLE].owner).toBeUndefined();
});

it("lets a newly tamed healer scratch grass without digging up grain", () => {
  const { world, hero } = createCreatureWorld("| ♀P, |", { P: "pet" });
  const pet = world.assertComponents(getCreature(world, "pet"), [TAMEABLE, "BUMPABLE"]);
  pet[TAMEABLE].attributes = { aggression: true };
  const grass = getHarvestable(world, { x: 3, y: 0 })!;
  const healRoll = (petSkills.indexOf("heal") + 0.5) / petSkills.length;
  const random = jest.spyOn(Math, "random").mockReturnValue(0).mockReturnValueOnce(healRoll);
  try {
    gainPetXp(world, pet, world.getEntityId(hero), 3);
    expect(pet[TAMEABLE].skills).toEqual(["heal"]);
    advanceUntil(world, () => pet.BUMPABLE.orientation === "right");
    expect(grass.HARVESTABLE.amount).toBe(grass.HARVESTABLE.maximum);
    expect(world.getEntities([ITEM]).some(entity => entity[ITEM].stackable === "grain")).toBe(false);
  } finally {
    random.mockRestore();
  }
});

it("digs out a stump and brings its stick even without the collecting skill", () => {
  const { world, pet } = setup("| ♀PS   |", ["harvest"]);
  advanceUntil(world, () =>
    world
      .getEntities([ITEM])
      .some(
        (item) =>
          item[ITEM].stackable === "stick" &&
          item[ITEM].amount === 1 &&
          world.getEntityById(item[ITEM].carrier)?.[LOOTABLE]?.droppedBy ===
            world.getEntityId(pet)
      )
  );
});

it.each([true, false])(
  "adds one damage on the pet's preferred terrain (%s water)",
  (preference) => {
    const { world, pet, hero } = setup("| ♀PWA |", ["attack"]);
    pet[TAMEABLE].attributes.water = preference;
    pet[STATS].power = hero[STATS].armor = 0;
    const scratch = () =>
      calculateDamage(world, { melee: 1 }, pet, hero).damage;
    expect(scratch()).toBe(1);
    moveEntity(world, pet, { x: 3, y: 0 });
    expect(scratch()).toBe(preference ? 2 : 1);
    moveEntity(world, pet, { x: 4, y: 0 });
    expect(scratch()).toBe(preference ? 1 : 2);
  }
);

it("gathers loose coins, berries and apples before delivery and leaves both plants standing", () => {
  const { world, hero, pet } = setup(
    `
|        |
| ♀PCC   |
|   BT   |
`,
    ["collect"]
  );
  face(world, "down");
  const plants = [
    { x: 3, y: 2 },
    { x: 4, y: 2 },
  ];
  const sources = plants.map((position) => getHarvestable(world, position)!);
  advanceUntil(
    world,
    () => !!getSequence(world, pet, "collect")?.particles.loot
  );
  advanceUntil(world, () =>
    countItems(world, pet, { stackable: "coin" }) === 2 &&
    countItems(world, pet, { stackable: "berry" }) === 1 &&
    countItems(world, pet, { stackable: "apple" }) === 1
  );
  const picked = [...pet[INVENTORY].items];
  expect(picked).toHaveLength(3);
  expect(
    world
      .getEntities([LOOTABLE])
      .filter((drop) => drop[LOOTABLE].droppedBy === world.getEntityId(pet))
  ).toHaveLength(0);
  advanceUntil(world, () =>
    world
      .getEntities([LOOTABLE])
      .some(
        (drop) =>
          drop[LOOTABLE].droppedBy === world.getEntityId(pet) &&
          !!getSequence(world, drop, "collect")?.particles.loot
      )
  );
  advanceTicks(world, 10);
  const gifts = world
    .getEntities([LOOTABLE, INVENTORY, POSITION])
    .filter((drop) => drop[LOOTABLE].droppedBy === world.getEntityId(pet));
  expect(gifts.flatMap((drop) => drop[INVENTORY].items).sort()).toEqual(
    picked.sort()
  );
  expect(gifts.map(drop => drop[POSITION])).toContainEqual({
    x: hero[POSITION].x, y: hero[POSITION].y + 1,
  });
  expect(new Set(gifts.map(drop => JSON.stringify(drop[POSITION]))).size).toBe(gifts.length);
  for (const [index, position] of plants.entries()) {
    expect(getLootable(world, position)).toBeUndefined();
    expect(getHarvestable(world, position)).toBe(sources[index]);
    expect(sources[index].HARVESTABLE.amount).toBe(
      sources[index].HARVESTABLE.maximum
    );
  }
});

it("shows a picked berry as loose fruit after the pet delivers it", () => {
  const { world, pet } = setup("| ♀P B |", ["collect"]);
  const berry = { stackable: "berry", amount: 1 } as const;
  const bush = getLootable(world, { x: 4, y: 0 })!;
  const fruit = world.assertByIdAndComponents(bush[INVENTORY].items[0], [SPRITE]);
  expect(resolveSprite(fruit[SPRITE]).layers).toEqual(
    getItemSprite(berry, "resource").layers
  );
  const delivered = () =>
    getSceneFrame(world, 15, 11).find(
      (sprite) =>
        sprite.loot && sprite.entity[LOOTABLE]?.droppedBy === world.getEntityId(pet)
    );
  advanceUntil(world, () => !!delivered());
  expect(delivered()!.sprite.layers).toEqual(getItemSprite(berry).layers);
});

it("eats the offered fish even with an identical stack already in its bag", () => {
  const { world, hero, pet } = setup("| ♀P |", []);
  delete pet[TAMEABLE].owner;
  const favourite = pet[TAMEABLE].favourites[0];
  const [saved] = giveItems(world, pet, [{ ...favourite.item, amount: 2 }]);
  const [gift] = giveItems(world, hero, [{ ...favourite.item, amount: 1 }]);
  dropBagItem(world, hero, world.assertComponents(gift, [ITEM, SPRITE]));
  advanceUntil(world, () => pet[STATS].xp === favourite.xp);
  expect(pet[INVENTORY].items).toEqual([world.getEntityId(saved)]);
  expect(saved[ITEM].amount).toBe(2);
});

it("leaves the same grass and visibility after a pet or hero picks a flower", () => {
  const source = { x: 2, y: 1 };
  const remaining = [false, true].map((usePet) => {
    const { world, hero, pet } = setup(
      "\n|     |\n| ♀·P |\n|     |",
      usePet ? ["collect"] : []
    );
    const plant = getHarvestable(world, source)!;
    const flower = getLootable(world, source)!;
    const carrierId = world.getEntityId(flower);
    if (usePet) {
      advanceUntil(world, () =>
        world
          .getEntities([LOOTABLE, INVENTORY])
          .some(
            (drop) =>
              drop[LOOTABLE].droppedBy === world.getEntityId(pet) &&
              countItems(world, drop, { stackable: "flower" }) === 1
          )
      );
    } else {
      holdMove(world, ["right"]);
      advanceUntil(
        world,
        () => countItems(world, hero, { stackable: "flower" }) === 1
      );
      holdMove(world, []);
    }
    advanceUntil(world, () => !world.getEntityById(carrierId));
    expect(getHarvestable(world, source)).toBe(plant);
    return getEntitiesAt(world, source)
      .filter((cell) => cell.FOG && !cell.MOVABLE)
      .map((cell) => ({
        sprite: cell.SPRITE?.id,
        fog: cell.FOG,
        resource: cell.HARVESTABLE,
      }));
  });
  expect(remaining[0]).toContainEqual(
    expect.objectContaining({
      resource: expect.objectContaining({ resource: "grass" }),
      fog: expect.objectContaining({ visibility: "visible" }),
    })
  );
  expect(remaining[1]).toEqual(remaining[0]);
});

it("shares the same two Totem bonuses only while its owner is within two cells", () => {
  const { world, hero, pet } = setup("| ♀ P     |", ["aura"]);
  pet[TAMEABLE].attributes.distance = false;
  const stats = ["power", "armor", "wisdom", "resist"] as const;
  const bonuses = () => {
    const current = getEntityStats(world, hero);
    return stats.map(stat => current[stat] - hero[STATS][stat]);
  };
  const ring = () => Object.keys(getSequence(world, pet, "aura")?.particles ?? {}).length;
  advanceUntil(world, () => ring() > 0);
  const active = bonuses();
  expect([...active].sort()).toEqual([0, 0, 1, 1]);
  advanceTicks(world, 8);
  expect(pet[STATS].hp).toBe(pet[STATS].maxHp);
  moveEntity(world, hero, { x: 6, y: 0 });
  advanceUntil(world, () => ring() === 0);
  expect(bonuses()).toEqual([0, 0, 0, 0]);
  moveEntity(world, hero, { x: pet[POSITION].x, y: pet[POSITION].y + 2 });
  advanceUntil(world, () => ring() > 0);
  expect(bonuses()).toEqual(active);
});

it("wakes to gather chat drops and walks into place to deliver each stack", () => {
  const { world, hero, pet } = setup(
    "\n|          |\n|   ♀ P    |\n|          |",
    ["collect"]
  );
  face(world, "left");
  advanceUntil(
    world,
    () => [sleep1, sleep2].some((sprite) => sprite === pet.TOOLTIP?.idle),
    30000
  );
  for (const line of ["/give sword", "/give arrow 5", "/give worm"]) {
    submitChat(world, world.assertComponents(hero, ["PLAYER"]), line);
  }
  const items = world
    .getEntities([LOOTABLE, INVENTORY])
    .flatMap((drop) => drop[INVENTORY].items);
  expect(items).toHaveLength(3);
  const front = { x: hero[POSITION].x - 1, y: hero[POSITION].y };
  const delivered = (id: number) =>
    world.getEntityById(world.assertByIdAndComponents(id, [ITEM]).ITEM.carrier)
      ?.LOOTABLE?.droppedBy === world.getEntityId(pet);
  const placements = new Map<number, { x: number; y: number }>();
  advanceUntil(world, () => {
    const gifts = world.getEntities([LOOTABLE, POSITION])
      .filter(drop => drop.LOOTABLE.droppedBy === world.getEntityId(pet));
    for (const drop of gifts) {
      const id = world.getEntityId(drop);
      if (placements.has(id)) continue;
      expect(getDistance(pet[POSITION], drop[POSITION], 40, 1)).toBe(1);
      expect(gifts.filter(other =>
        other[POSITION].x === drop[POSITION].x && other[POSITION].y === drop[POSITION].y
      )).toHaveLength(1);
      placements.set(id, { ...drop[POSITION] });
    }
    return items.every(delivered);
  }, 20000);
  expect([...placements.values()][0]).toEqual(front);
  expect(placements.size).toBe(3);
  expect(
    items
      .map((id) => world.assertByIdAndComponents(id, [ITEM]).ITEM.amount)
      .sort()
  ).toEqual([1, 1, 5]);
  advanceTicks(world, 8);
  expect(pet[INVENTORY].items).toEqual([]);
});

it("keeps its next stack until the only delivery cell is free", () => {
  const { world, hero, pet } = setup("|█████|\n|█♀ P█|\n|█████|", []);
  face(world, "right");
  giveItems(world, pet, [
    { stackable: "plank", amount: 2 },
    { stackable: "flower", amount: 1 },
  ]);
  const front = { x: 2, y: 1 };
  advanceUntil(world, () => !!getLootable(world, front));
  advanceTicks(world, 6);
  expect(countItems(world, pet, { stackable: "flower" })).toBe(1);
  const planks = getLootable(world, front)!;
  expect(countItems(world, planks, { stackable: "plank" })).toBe(2);
  expect(collectItem(world, hero, planks)).toBe(true);
  advanceUntil(world, () => {
    const next = getLootable(world, front);
    return !!next && countItems(world, next, { stackable: "flower" }) === 1;
  });
});

it("carries at most four different items each trip and leaves an unreachable pile", () => {
  const { world, pet } = setup(
    `
|      DDDDD  |
|      DDDDD  |
|  ♀  PDDDDD  |
|      DDDDD  |
|      DDDDD  |
`,
    ["collect"]
  );
  face(world, "left");
  const goods = ["coin", "stick", "berry", "plank", "flower"] as const;
  const item = (
    stackable: (typeof goods)[number],
    amount: number,
    x: number,
    y: number
  ) =>
    createItemAsDrop(world, { x, y }, entities.createItem, {
      ITEM: { stackable, amount },
      SPRITE: getItemSprite({ stackable }),
    });
  const stranded = item("coin", 8, 8, 2);
  const ids = goods.map((good, index) =>
    world.getEntityId(item(good, 1, 4 + (index % 2), 3 + Math.floor(index / 2)))
  );
  const delivered = (id: number) =>
    world.getEntityById(world.assertByIdAndComponents(id, [ITEM]).ITEM.carrier)
      ?.LOOTABLE?.droppedBy === world.getEntityId(pet);
  advanceUntil(world, () => pet[INVENTORY].items.length === 4);
  const firstTrip = [...pet[INVENTORY].items];
  const duplicate = world.getEntityId(
    item(goods[ids.findIndex(id => id === firstTrip[0])], 1, pet.POSITION.x, pet.POSITION.y)
  );
  advanceUntil(world, () => {
    expect(pet[INVENTORY].items.every((id) => firstTrip.includes(id))).toBe(
      true
    );
    return firstTrip.every(delivered);
  });
  advanceUntil(world, () => [...ids, duplicate].every(delivered), 30000);
  expect(world.getEntityById(stranded[ITEM].carrier)?.POSITION).toEqual({
    x: 8,
    y: 2,
  });
});

it("delivers a merged stack above 99 after saving during the second pickup", () => {
  const { world, pet } = setup("| ♀P   |", ["collect"]);
  const arrows = { stackable: "arrow", amount: 80 } as const;
  for (const x of [3, 4]) {
    createItemAsDrop(world, { x, y: 0 }, entities.createItem, {
      ITEM: arrows, SPRITE: getItemSprite(arrows),
    });
  }
  advanceUntil(world, () => countItems(world, pet, { stackable: "arrow" }) === 160);
  expect(pet[INVENTORY].items).toHaveLength(1);
  expect(getSequence(world, pet, "collect")?.args.amount).toBe(80);
  const petId = world.getEntityId(pet);
  const loaded = saveAndLoad(world);
  const gifts = () => loaded.getEntities([LOOTABLE, INVENTORY])
    .filter(drop => drop[LOOTABLE].droppedBy === petId && drop[INVENTORY].items.length);
  advanceUntil(loaded, () => gifts().length > 0);
  expect(gifts()).toHaveLength(1);
  expect(countItems(loaded, gifts()[0], { stackable: "arrow" })).toBe(160);
});

it("keeps spare hearts and mana without Collect, eats a heart, and offers one pickup at a time", () => {
  const { world, hero, pet } = setup("\n|       |\n| ♀P    |\n|       |", []);
  hero[STATS].hp = hero[STATS].maxHp = 20;
  hero[STATS].mp = hero[STATS].maxMp = 10;
  pet[STATS].hp--;
  for (const stat of ["hp", "mp"] as const) {
    const item = { stat, amount: 3 };
    createItemAsDrop(world, { x: stat === "hp" ? 3 : 4, y: 1 }, entities.createItem, {
      [ITEM]: item, [SPRITE]: getItemSprite(item),
    });
  }
  const held = (stat: "hp" | "mp") => countItems(world, pet, { stat });
  const offered = (stat: "hp" | "mp") =>
    world.getEntities([LOOTABLE, INVENTORY]).filter(drop =>
      drop[LOOTABLE].droppedBy === world.getEntityId(pet) && countItems(world, drop, { stat }) > 0
    );
  advanceUntil(world, () => held("hp") === 2 && held("mp") === 3 && pet[STATS].hp === pet[STATS].maxHp);
  advanceTicks(world, 4);
  expect(offered("hp")).toHaveLength(0);
  expect(offered("mp")).toHaveLength(0);
  hero[STATS].hp -= 2;
  advanceUntil(world, () => offered("hp").length === 1);
  advanceTicks(world, 5);
  expect(held("hp")).toBe(1);
  const first = offered("hp")[0];
  expect(countItems(world, first, { stat: "hp" })).toBe(1);
  collectItem(world, hero, first);
  advanceUntil(world, () => hero[STATS].hp === 19 && offered("hp").length === 1);
  collectItem(world, hero, offered("hp")[0]);
  advanceUntil(world, () => hero[STATS].hp === 20);
  expect(held("hp")).toBe(0);

  hero[STATS].mp--;
  advanceUntil(world, () => offered("mp").length === 1);
  expect(held("mp")).toBe(2);
  hero[STATS].mp = hero[STATS].maxMp;
  advanceUntil(world, () => held("mp") === 3);
  expect(offered("mp")).toHaveLength(0);
});

it("eats and stores hearts while its opponent is still alive, then offers the spare heart", () => {
  const { world, pet, hero } = setup("|          |\n| ♀ P  E   |\n|          |", ["attack"]);
  const enemy = getCreature(world, "prism");
  enemy[BEHAVIOUR].patterns = [];
  enemy[STATS].maxHp = enemy[STATS].hp = 100;
  hero[STATS].maxHp = hero[STATS].hp = 20;
  pet[TAMEABLE].attributes.aggression = true;
  pet[STATS].hp--;
  advanceUntil(world, () => enemy[STATS].hp < 100);
  const heart = { stat: "hp", amount: 1 } as const;
  const dropHeart = () => createItemAsDrop(world, { x: pet[POSITION].x - 2, y: pet[POSITION].y }, entities.createItem, {
    [ITEM]: heart, [SPRITE]: getItemSprite(heart),
  });
  dropHeart();
  advanceUntil(world, () => pet[STATS].hp === pet[STATS].maxHp);
  dropHeart();
  advanceUntil(world, () => countItems(world, pet, heart) === 1);
  expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
  expect(enemy[STATS].hp).toBeGreaterThan(0);
  hero[STATS].hp--;
  const offered = () => world.getEntities([LOOTABLE, INVENTORY]).find(drop =>
    drop[LOOTABLE].droppedBy === world.getEntityId(pet) && countItems(world, drop, heart) === 1
  );
  advanceUntil(world, () => !!offered());
  expect(collectItem(world, hero, offered()!)).toBe(true);
  advanceUntil(world, () => hero[STATS].hp === hero[STATS].maxHp);
  expect(enemy[STATS].hp).toBeGreaterThan(0);
});

it("earns healing and mana when the enemy falls, before its death animation finishes", () => {
  const { world, hero, pet } = setup("\n|      |\n| P♀E  |\n|      |", ["heal", "mana"]);
  const enemy = getCreature(world, "prism");
  enemy[BEHAVIOUR].patterns = [];
  enemy[STATS].hp = 1;
  enemy[STATS].armor = 0;
  hero[STATS].maxHp = 20;
  hero[STATS].hp = 19;
  hero[STATS].mp = hero[STATS].maxMp = 10;
  pet[TAMEABLE].kills = 1;
  giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);
  holdMove(world, ["right"]);
  advanceUntil(world, () => !!getSequence(world, enemy, "decay"));
  holdMove(world, []);
  expect(countItems(world, pet, { stat: "mp" })).toBe(1);
  expect(pet[TAMEABLE].healingHits).toBe(1);
  advanceUntil(world, () => pet.MELEE!.hits > 0);
  expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
  expect(getMessages(world, hero)).toContain("+1");
  expect(countItems(world, pet, { stat: "mp" })).toBe(1);
});

it("leaves permanent stat pickups in single units", () => {
  const { world, pet } = setup("| ♀P    |", ["collect"]);
  const item = { stat: "power", amount: 3 } as const;
  createItemAsDrop(world, { x: 4, y: 0 }, entities.createItem, {
    [ITEM]: item, [SPRITE]: getItemSprite(item),
  });
  const drops = () => world.getEntities([LOOTABLE, INVENTORY]).filter(drop =>
    drop[LOOTABLE].droppedBy === world.getEntityId(pet) && countItems(world, drop, { stat: "power" }) > 0
  );
  advanceUntil(world, () => drops().length === 3);
  expect(drops().map(drop => countItems(world, drop, { stat: "power" }))).toEqual([1, 1, 1]);
});
