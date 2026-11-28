import { BELONGABLE } from "../../engine/components/belongable";
import { LOOTABLE } from "../../engine/components/lootable";
import { INVENTORY } from "../../engine/components/inventory";
import { REFERENCE } from "../../engine/components/reference";
import { POSITION } from "../../engine/components/position";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { getEquipmentStats } from "../../game/balancing/equipment";
import { none, xpDot } from "../../game/assets/sprites";
import { dropBagItem } from "../../engine/systems/drop";
import { ITEM } from "../../engine/components/item";
import { MOVABLE } from "../../engine/components/movable";
import { SPRITE } from "../../engine/components/sprite";
import { STATS } from "../../engine/components/stats";
import { petSkills, TAMEABLE } from "../../engine/components/tameable";
import { TOOLTIP } from "../../engine/components/tooltip";
import { act } from "../items/helpers";
import { getSequence } from "../../engine/systems/sequence";
import { feedPet, gainPetXp } from "../../engine/systems/petCare";
import { resolveSprite } from "../../game/assets/spriteIds";
import {
  act as press,
  face,
  advanceUntil,
  countItems,
  getMessages,
  giveItems,
  holdMove,
} from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  getCreature,
  giveSword,
  distanceBetween,
} from "./helpers";

const setup = () => {
  const { world, hero } = createCreatureWorld("| ♀p |", { p: "pet" });
  const pet = world.assertComponents(getCreature(world, "pet"), [
    BELONGABLE,
    TAMEABLE,
    STATS,
    SPRITE,
    MOVABLE,
    TOOLTIP,
  ]);
  return { world, hero, pet };
};

describe("pet care", () => {
  it("tames a wild pet with three of the fish it requests dropped from the Bag", () => {
    const { world, hero, pet } = setup();
    const [wanted] = pet[TAMEABLE].favourites;
    const favourite = wanted.item;
    expect(pet[STATS].level).toBe(0);
    expect(pet[TAMEABLE].skills).toEqual([]);
    expect(pet[EQUIPPABLE]?.weapon).toBeUndefined();
    expect(pet[TAMEABLE].favourites).toHaveLength(1);
    expect(["salmon", "pike"]).toContain(favourite.stackable);
    expect(pet[BELONGABLE].faction).toBe("animal");
    giveItems(world, hero, [{ ...favourite, amount: 3 }]);
    const heroXp = hero[STATS].xp;
    act(world, "inspect");
    for (let i = 0; i < 3; i++) act(world, "left");
    act(world, "close");
    advanceUntil(
      world,
      () =>
        !!world
          .getEntities(["SEQUENCABLE"])
          .find(
            (entity) =>
              getSequence(world, entity, "xp")?.args.offering?.pet ===
              world.getEntityId(pet)
          ),
      8000
    );
    advanceUntil(world, () => pet[STATS].level === 1, 15000);
    expect(hero[STATS].xp).toBe(heroXp);
    expect(countItems(world, hero, favourite)).toBe(0);
    expect(pet[TAMEABLE].owner).toBe(world.getEntityId(hero));
    expect(pet[BELONGABLE].faction).toBe(hero[BELONGABLE]?.faction);
    expect(pet[STATS]).toMatchObject({ level: 1, maxXp: 10, xp: 0 });
    expect(pet[TAMEABLE].favourites).toHaveLength(2);
    expect(["tuna", "cod"]).toContain(
      pet[TAMEABLE].favourites[1].item.stackable
    );
    expect(new Set(pet[TAMEABLE].skills).size).toBe(1);
  });

  it("gains HP and a different favourite and skill at each new level", () => {
    const { world, hero, pet } = setup();
    const state = pet[TAMEABLE];
    const bonus =
      (state.stat === "hp" ? 15 : 0) +
      (state.attributes.survival === false ? 10 : 0);
    const initialPower = pet[STATS].power;
    const initialHaste = pet[STATS].haste;
    const clock = world.assertByIdAndComponents(pet[MOVABLE].reference, [
      REFERENCE,
    ])[REFERENCE];
    const startingInterval = clock.tick;
    let intervalAtTwo = 0;
    const checkLevel = (level: number, base: number) => {
      expect(pet[STATS].level).toBe(level);
      expect(pet[STATS].power).toBe(initialPower + Math.max(0, level - 1));
      expect(pet[STATS].haste).toBe(initialHaste + Number(level >= 2));
      expect(pet[STATS].maxHp).toBe(base + Math.round((base * bonus) / 100));
      expect(new Set(state.skills).size).toBe(level);
      expect(
        new Set(state.favourites.map(({ item }) => JSON.stringify(item))).size
      ).toBe(level + 1);
    };
    checkLevel(0, 20);
    for (const [level, count] of [
      [1, 3],
      [2, 10],
      [3, 25],
    ]) {
      const [fish] = giveItems(
        world,
        world.assertComponents(pet, [INVENTORY, POSITION]),
        [{ ...state.favourites[0].item, amount: count }]
      );
      for (let i = 0; i < count; i++)
        expect(
          feedPet(world, pet, hero, world.assertComponents(fish, [ITEM]))
        ).toBe(true);
      advanceUntil(world, () => pet[STATS].level === level, 12000);
      checkLevel(level, 20 + level * 10);
      if (level === 2) intervalAtTwo = clock.tick;
    }
    const learned = state.favourites[2].item;
    expect(["soup", "toast", "curry", "juice", "tea", "granola", "gold hp potion", "gold mp potion"])
      .toContain(learned.stackable ?? [learned.material, learned.stat, learned.consume].join(" "));
    expect(intervalAtTwo).toBeLessThan(startingInterval);
    expect(clock.tick).toBe(intervalAtTwo);
  });

  it.each(["cod", "tuna"] as const)("gets two feeding XP from its newly learned %s", (fish) => {
    const { world, hero, pet } = setup();
    const fishRoll = fish === "tuna" ? 0 : 0.99;
    const rolls = jest.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(fishRoll);
    try {
      gainPetXp(world, pet, world.getEntityId(hero), 3);
    } finally {
      rolls.mockRestore();
    }
    const favourite = pet[TAMEABLE].favourites[1];
    expect(favourite).toEqual({ item: { stackable: fish }, xp: 2 });
    const [offering] = giveItems(world, hero, [{ stackable: fish, amount: 1 }]);
    dropBagItem(world, hero, world.assertComponents(offering, [ITEM, SPRITE]));
    const dots = new Set<number>();
    const heroXp = hero[STATS].xp;
    const seeDots = () => {
      for (const particle of world.getEntities(["PARTICLE", SPRITE])) {
        if (particle[SPRITE].id === xpDot.id) dots.add(world.getEntityId(particle));
      }
      return dots.size;
    };
    advanceUntil(world, () => seeDots() === 4);
    advanceUntil(world, () => seeDots() === 8);
    advanceUntil(world, () => pet[STATS].xp === 2);
    expect(hero[STATS].xp).toBe(heroXp);
  });

  it("equips an invisible claw when it learns Attack and sends out single-line level rings", () => {
    const { world, hero, pet } = setup();
    const attackRoll = (petSkills.indexOf("attack") + 0.5) / petSkills.length;
    const random = jest.spyOn(Math, "random").mockReturnValueOnce(attackRoll);
    try {
      gainPetXp(world, pet, world.getEntityId(hero), 3);
    } finally {
      random.mockRestore();
    }
    expect(pet[TAMEABLE].skills).toEqual(["attack"]);
    const claw = world.assertByIdAndComponents(pet[EQUIPPABLE]?.weapon, [
      ITEM,
      SPRITE,
    ]);
    expect(claw[ITEM]).toMatchObject({
      weapon: "sword",
      bound: true,
      amount: 0,
    });
    expect(getEquipmentStats(claw[ITEM], "pet").melee).toBe(1);
    expect(claw[SPRITE].id).toBe(none.id);

    advanceUntil(
      world,
      () => getSequence(world, pet, "progress")?.args.ring === 1,
      3000
    );
    const particle = getSequence(world, pet, "progress")!.particles[
      "progress-1-up"
    ];
    const glyph = resolveSprite(
      world.assertByIdAndComponents(particle, [SPRITE])[SPRITE]
    );
    expect(glyph.facing?.up?.[0].char).toBe("│");
    expect(glyph.facing?.right?.[0].char).toBe("─");
    advanceUntil(world, () => getMessages(world, pet).some(line => line.endsWith("Max HP")), 5000);
    expect(pet[TOOLTIP].override).not.toBe("visible");
    advanceUntil(world, () => !getSequence(world, pet, "progress"), 5000);
    expect(pet[TOOLTIP].dialogs[0][1].name).toBe("Melee");
    expect(pet[TOOLTIP].override).toBe("visible");
    advanceUntil(world, () => !pet[TOOLTIP].override, 8000);
    expect(pet[STATS].xp).toBe(0);
    expect(pet[STATS].level).toBe(1);
  });

  it("doubles the favourite's effect and spends one potion charge per feeding", () => {
    const { world, hero, pet } = setup();
    const flask = { consume: "potion", material: "gold", stat: "hp" } as const;
    pet[TAMEABLE].owner = world.getEntityId(hero);
    pet[TAMEABLE].favourites.push({ item: flask, xp: 1 });
    pet[STATS].hp = 1;
    const carrier = world.assertComponents(pet, [INVENTORY, POSITION]);
    const [food] = giveItems(world, carrier, [{ ...flask, amount: 2 }]);
    const potion = world.assertComponents(food, [ITEM]);
    expect(feedPet(world, pet, hero, potion)).toBe(true);
    expect(pet[STATS].hp).toBe(17);
    expect(countItems(world, carrier, flask)).toBe(1);
    expect(feedPet(world, pet, hero, potion)).toBe(true);
    expect(countItems(world, carrier, flask)).toBe(0);
    expect(feedPet(world, pet, hero, potion)).toBe(false);
  });

  it("eats its own favourite for health and gains XP only once it has an owner", () => {
    const { world, hero, pet } = setup();
    const salmon = { stackable: "salmon" } as const;
    pet[TAMEABLE].favourites = [{ item: salmon, xp: 1 }];
    const [fish] = giveItems(
      world,
      world.assertComponents(pet, [INVENTORY, POSITION]),
      [{ ...salmon, amount: 2 }]
    );
    const food = world.assertComponents(fish, [ITEM]);
    pet[STATS].hp = 1;
    expect(feedPet(world, pet, pet, food)).toBe(true);
    expect(pet[STATS].hp).toBe(11);
    expect(pet[TOOLTIP].override).toBe("idle");
    const heart = pet[TOOLTIP].idle!;
    expect(heart.name).toBe("HP");
    const fur = resolveSprite(pet[SPRITE]).layers;
    const body = fur.find(layer => layer.char === "\u0101")!.color;
    expect(fur.filter(layer => layer.color !== body).map(layer => layer.color))
      .toContain(heart.layers[0].color);
    expect(heart.layers[0].color).toBe(pet[TAMEABLE].heartColor);
    expect(pet[STATS].xp).toBe(0);
    pet[TAMEABLE].owner = world.getEntityId(hero);
    expect(feedPet(world, pet, pet, food)).toBe(true);
    advanceUntil(world, () => pet[STATS].xp === 1, 8000);
  });

  it("drinks a dropped water bucket and carries the empty bucket back to the ground in front of its owner", () => {
    const { world, hero, pet } = setup();
    const empty = {
      consume: "bucket",
      material: "iron",
      element: undefined,
    } as const;
    pet[TAMEABLE].owner = world.getEntityId(hero);
    pet[TAMEABLE].attributes = { thirst: true, hunger: true };
    pet[TAMEABLE].thirsty = true;
    pet[STATS].hp = 1;
    face(world, "down");
    const [bucket] = giveItems(world, hero, [
      { ...empty, element: "water", amount: 1 },
    ]);
    act(world, "inspect");
    press(world, "left");
    press(world, "close");
    advanceUntil(
      world,
      () =>
        getSequence(world, pet, "collect")?.args.itemId ===
        world.getEntityId(bucket),
      10000
    );
    advanceUntil(world, () => !pet[TAMEABLE].thirsty, 10000);

    expect(pet[STATS].hp).toBe(5);
    const bag = world.assertComponents(pet, [INVENTORY]);
    expect(countItems(world, bag, empty)).toBe(1);
    expect(countItems(world, hero, { consume: "bucket" })).toBe(0);

    const emptied = bag[INVENTORY].items
      .map((id) => world.assertByIdAndComponents(id, [ITEM]))
      .find((item) => item[ITEM].consume === "bucket")!;
    const drop = () =>
      world.getEntityByIdAndComponents(emptied[ITEM].carrier, [
        LOOTABLE,
        POSITION,
        INVENTORY,
      ]);
    advanceUntil(
      world,
      () => drop()?.[LOOTABLE].droppedBy === world.getEntityId(pet),
      12000
    );
    expect(drop()![POSITION]).toEqual({
      x: hero[POSITION].x,
      y: hero[POSITION].y + 1,
    });
    expect(distanceBetween(world, drop()![POSITION], pet[POSITION])).toBe(1);
    advanceUntil(world, () => countItems(world, drop()!, empty) === 1, 2000);
    expect(countItems(world, bag, empty)).toBe(0);
    expect(countItems(world, hero, { consume: "bucket" })).toBe(0);
  });

  it("runs from a hit while wild, then recovers to full health after a delay", () => {
    const { world, hero } = createCreatureWorld("| ♀p           |", {
      p: "pet",
    });
    const pet = getCreature(world, "pet");
    giveSword(world, hero);
    giveItems(world, hero, [
      { ...pet[TAMEABLE]!.favourites[0].item, amount: 1 },
    ]);
    holdMove(world, ["right"]);
    advanceUntil(world, () => pet[STATS].hp < pet[STATS].maxHp);
    holdMove(world, []);
    const hurt = pet[STATS].hp;
    advanceTicks(world, 8);
    expect(
      distanceBetween(world, hero[POSITION], pet[POSITION])
    ).toBeGreaterThan(1);
    expect(pet[STATS].hp).toBe(hurt);
    advanceUntil(world, () => pet[STATS].hp === pet[STATS].maxHp, 15000);
  });

  it("dies and decays after a lethal hit while wild", () => {
    const { world, hero, pet } = setup();
    const id = world.getEntityId(pet);
    giveSword(world, hero);
    hero[STATS].power = 100;
    holdMove(world, ["right"]);
    advanceUntil(world, () => !!getSequence(world, pet, "decay"));
    holdMove(world, []);
    expect(pet[TAMEABLE].ghost).toBeUndefined();
    const [food] = giveItems(world, hero, [
      { ...pet[TAMEABLE].favourites[0].item, amount: 1 },
    ]);
    expect(
      feedPet(world, pet, hero, world.assertComponents(food, [ITEM]))
    ).toBe(false);
    advanceUntil(world, () => !world.getEntityById(id), 5000);
  });

  it("revives in its original colours at full HP only after receiving a favourite", () => {
    const { world, hero, pet } = setup();
    pet[TAMEABLE].owner = world.getEntityId(hero);
    const original = pet[SPRITE];
    pet[TAMEABLE].favourites.push({ item: { stackable: "cod" }, xp: 2 });
    pet[STATS].hp = 0;
    advanceTicks(world, 5);
    expect(pet[TAMEABLE].ghost).toEqual(original);
    expect(resolveSprite(pet[SPRITE]).name).toBe("Pet");
    expect(resolveSprite(pet[SPRITE]).layers.at(-1)).toMatchObject({
      char: "°",
    });
    expect(pet[MOVABLE].flying).toBe(true);
    advanceUntil(world, () => pet[TOOLTIP].dialogs[0]?.length === 4);
    const options = pet[TOOLTIP].dialogs[0].slice(1, -1);
    expect(options.map(sprite => sprite.name?.toLowerCase())).toEqual(
      pet[TAMEABLE].favourites.map(({ item }) => item.stackable)
    );
    const favourite = pet[TAMEABLE].favourites[0].item;
    giveItems(world, hero, [
      { stackable: "apple", amount: 1 },
      { ...favourite, amount: 1 },
    ]);
    act(world, "inspect");
    act(world, "left");
    act(world, "close");
    advanceTicks(world, 6);
    expect(pet[TAMEABLE].ghost).toEqual(original);
    act(world, "inspect");
    act(world, "left");
    act(world, "close");
    advanceUntil(world, () => !pet[TAMEABLE].ghost, 10000);
    expect(pet[STATS].hp).toBe(pet[STATS].maxHp);
    expect(pet[MOVABLE].flying).toBe(false);
    expect(pet[SPRITE]).toEqual(original);
  });
});
