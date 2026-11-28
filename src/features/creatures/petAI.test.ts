import { castAs } from "../spells/helpers";
import { petKnockout } from "../../engine/systems/petCare";
import { getRefillElement } from "../../engine/systems/harvest";
import { getBurning } from "../../engine/systems/burn";
import { lockDoor, openDoor } from "../../engine/systems/trigger";
import { assignBuilding } from "../../bindings/creation";
import { isImmersible } from "../../engine/systems/immersion";
import { LOCKABLE } from "../../engine/components/lockable";
import { LAYER } from "../../engine/components/layer";
import { BELONGABLE } from "../../engine/components/belongable";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { MOVABLE } from "../../engine/components/movable";
import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { REFERENCE } from "../../engine/components/reference";
import { STATS } from "../../engine/components/stats";
import { TAMEABLE } from "../../engine/components/tameable";
import { TOOLTIP } from "../../engine/components/tooltip";
import { moveEntity } from "../../engine/systems/map";
import { LEVEL } from "../../engine/components/level";
import { signedDistance } from "../../game/math/std";
import { sleep1, sleep2 } from "../../game/assets/ui";
import { advance, advanceUntil, findEntityAt, walk } from "../../testing/harness";
import { advanceTicks, createCreatureWorld, distanceBetween, getCreatures } from "./helpers";

const room =
  "|                   |\n|  P       ♀        |\n|                   |";

function setup(area = room) {
  const { world, hero } = createCreatureWorld(area, {
    P: "pet",
    E: "eye",
    F: "fairy",
    C: "chick",
    D: "wood_door",
  });
  const [pet] = world.getEntities([
    TAMEABLE,
    POSITION,
    MOVABLE,
    STATS,
    TOOLTIP,
    BELONGABLE,
  ]);
  Object.assign(pet[TAMEABLE], {
    owner: world.getEntityId(hero),
    attributes: {},
    skills: [],
  });
  pet[BELONGABLE].faction = "settler";
  hero[ORIENTABLE]!.facing = "right";
  return { world, hero, pet };
}

it.each([
  [{}, 3],
  [{ distance: true }, 2],
  [{ distance: false }, 4],
] as const)(
  "follows behind the owner at its preferred distance",
  (attributes, distance) => {
    const { world, hero, pet } = setup();
    pet[TAMEABLE].attributes = attributes;
    advanceTicks(world, 10);
    expect(pet[POSITION]).toEqual({
      x: hero[POSITION].x - distance,
      y: hero[POSITION].y,
    });
    const restingSpot = { ...pet[POSITION] };
    walk(world, "left");
    hero[ORIENTABLE]!.facing = "up";
    advanceTicks(world, 4);
    expect(pet[POSITION]).toEqual(restingSpot);
  }
);

it.each([
  [{ distance: true }, 2],
  [{}, 3],
  [{ distance: false }, 4],
] as const)("counts both axes when following across the map edge (%j)", (attributes, steps) => {
  const { world, hero, pet } = setup();
  const size = world.metadata.gameEntity[LEVEL].size;
  pet[TAMEABLE].attributes = attributes;
  moveEntity(world, hero, { x: 0, y: 1 });
  moveEntity(world, pet, { x: size - steps, y: 2 });
  advanceTicks(world, 8);
  const dx = signedDistance(hero[POSITION].x, pet[POSITION].x, size);
  const dy = pet[POSITION].y - hero[POSITION].y;
  expect(Math.abs(dx) + Math.abs(dy)).toBe(steps);
});

it("follows on its own movement clock even when the world ticks more slowly", () => {
  const { world, pet } = setup();
  const frame = world.assertByIdAndComponents(pet[MOVABLE].reference, [
    REFERENCE,
  ]);
  frame[REFERENCE].tick = 200;
  world.metadata.gameEntity[REFERENCE].tick = 1200;
  const start = pet[POSITION].x;
  advanceUntil(world, () => pet[POSITION].x >= start + 3, 850);
});

it("regenerates two HP per three world ticks asleep and wakes on nearby movement", () => {
  const { world, hero, pet } = setup();
  const clock = world.assertByIdAndComponents(pet[MOVABLE].reference, [
    REFERENCE,
  ]);
  clock[REFERENCE].tick = world.metadata.gameEntity[REFERENCE].tick * 1.1;
  pet[TAMEABLE].attributes.movement = false;
  pet[STATS].hp = 2;
  const sleeping = () => [sleep1, sleep2].includes(pet[TOOLTIP].idle!);
  advanceUntil(world, sleeping, 15000);
  expect(pet[STATS].hp).toBe(2);
  advanceTicks(world, 2);
  expect(pet[STATS].hp).toBe(2);
  advanceTicks(world, 1);
  expect(pet[STATS].hp).toBe(4);
  moveEntity(world, hero, { x: pet[POSITION].x, y: pet[POSITION].y + 1 });
  advanceUntil(world, () => !sleeping());
});

it("walks while wild and always asks for the remaining favourite fish when approached", () => {
  const { world, hero } = createCreatureWorld(room, { P: "pet" });
  const [pet] = world.getEntities([TAMEABLE, POSITION, "SEQUENCABLE"]);
  const places = new Set<number>();
  for (let i = 0; i < 35; i++) {
    advanceTicks(world, 1);
    places.add(pet[POSITION].x);
    expect(pet.SEQUENCABLE.states.dialog?.args.isDialog).toBeFalsy();
  }
  expect(places.size).toBeGreaterThan(2);
  // XP arrives a fraction at a time as the four dots reach the pet.
  pet[STATS]!.xp = 0.5;
  for (let visit = 0; visit < 3; visit++) {
    moveEntity(world, hero, { x: pet[POSITION].x + 1, y: pet[POSITION].y });
    advanceUntil(world, () => !!pet.SEQUENCABLE.states.dialog?.args.isDialog);
    const request = pet[TOOLTIP]!.dialogs[0];
    expect(request).toHaveLength(4);
    expect(request[1].layers.at(-1)?.char).toBe("3");
    expect(request[2].name?.toLowerCase()).toBe(pet[TAMEABLE].favourites[0].item.stackable);
    moveEntity(world, hero, { x: 15, y: 1 });
    advanceUntil(world, () => !pet.SEQUENCABLE.states.dialog?.args.isDialog);
  }
});

it("makes an untamed pet retreat from a nearby enemy", () => {
  const { world, pet } = setup(
    "|                   |\n|  P E     ♀        |\n|                   |"
  );
  delete pet[TAMEABLE].owner;
  pet[BELONGABLE].faction = "animal";
  const eye = getCreatures(world, "eye")[0];
  eye[BEHAVIOUR].patterns = [];
  const start = pet[POSITION].x;
  advanceUntil(world, () => pet[POSITION].x < start);
});

it("waits beside the door outside while the owner is in a building", () => {
  const area = `
|              |
| ╒╦╦╕         |
| ╠╬╬╣    P    |
| ╞╪╪╡         |
| └D┴┘         |
|  ♀           |
|              |
`;
  const { world, hero, pet } = setup(area);
  const { building, door } = assignBuilding(world, { x: 3, y: 2 });
  openDoor(world, door!);
  walk(world, "up", 2);
  advanceUntil(
    world,
    () => hero[LAYER]?.structure === world.getEntityId(building)
  );
  advanceTicks(world, 16);
  expect(pet[POSITION].y).toBe(5);
  expect([1, 3]).toContain(pet[POSITION].x);
  expect(pet[LAYER]?.structure).toBeUndefined();
});

it("takes a dry detour around shallow water when it dislikes water", () => {
  const { world, hero, pet } = setup(
    "|                   |\n|  P~~~    ♀        |\n|                   |"
  );
  pet[TAMEABLE].attributes.water = false;
  const route = [];
  for (let i = 0; i < 12; i++) {
    advanceTicks(world, 1);
    route.push(isImmersible(world, pet[POSITION]));
  }
  const dx = Math.abs(hero[POSITION].x - pet[POSITION].x);
  const dy = Math.abs(hero[POSITION].y - pet[POSITION].y);
  expect(dx + dy).toBe(3);
  expect(route).not.toContain(true);
});

it("wakes in shallow water when the owner walks beside it", () => {
  const { world, hero, pet } = setup("|           |\n| ~P~~  ♀   |\n|           |");
  moveEntity(world, pet, { x: 3, y: 1 });
  pet[TAMEABLE].attributes = { movement: false, water: true, distance: false };
  const sleeping = () => [sleep1, sleep2].includes(pet[TOOLTIP].idle!);
  advanceUntil(world, sleeping, 15000);
  expect(isImmersible(world, pet[POSITION])).toBe(true);
  walk(world, "left", hero[POSITION].x - pet[POSITION].x - 1);
  advanceUntil(world, () => !sleeping(), 1000);
});


it.each([false, true])("walks into the owner's vacated cell on the pet's own tick (owner keeps moving: %s)", continues => {
  const { world, hero, pet } = setup("|           |\n|   P♀      |\n|           |");
  const from = { ...hero[POSITION] };
  const start = { ...pet[POSITION] };
  const clock = world.assertByIdAndComponents(pet[MOVABLE].reference, [REFERENCE])[REFERENCE];
  clock.tick = 1500;
  walk(world, "left");
  expect(hero[POSITION]).toEqual(start);
  if (continues) walk(world, "left");
  else hero[ORIENTABLE]!.facing = "up";
  advance(world, clock.tick - clock.delta - 80);
  expect(pet[POSITION]).toEqual(start);
  advanceUntil(world, () => pet[POSITION].x !== start.x, 150);
  expect(pet[POSITION]).toEqual(from);
});

it("leaves a pet's movement alone when it has already stepped out of the owner's path", () => {
  const { world, hero, pet } = setup("|           |\n|   P♀      |\n|   ~       |");
  pet[TAMEABLE].attributes = { distance: true, water: true };
  const path = { ...pet[POSITION] };
  advanceUntil(world, () => isImmersible(world, pet[POSITION]));
  const water = { ...pet[POSITION] };
  walk(world, "left");
  expect(hero[POSITION]).toEqual(path);
  advanceTicks(world, 3);
  expect(pet[POSITION]).toEqual(water);
});

it("steps sideways when a door closes in the cell vacated by the owner", () => {
  const { world, hero, pet } = setup("|           |\n|   PD♀     |\n|           |");
  const start = { ...pet[POSITION] };
  const door = findEntityAt(world, { x: start.x + 1, y: start.y }, [LOCKABLE])!;
  openDoor(world, door);
  walk(world, "left", 2);
  expect(hero[POSITION]).toEqual(start);
  lockDoor(world, door);
  advanceUntil(world, () => pet[POSITION].y !== start.y);
  expect(pet[POSITION].x).toBe(start.x);
  expect(Math.abs(pet[POSITION].y - start.y)).toBe(1);
});

it("leaves an injured pet's attack lane and regroups with the owner", () => {
  const { world, hero, pet } = setup(
    "|                |\n|                |\n|    E P         |\n|                |\n|              ♀ |"
  );
  const eye = getCreatures(world, "eye")[0];
  eye[BEHAVIOUR].patterns = [];
  pet[TAMEABLE].attributes = { aggression: true };
  pet[TAMEABLE].skills = ["attack"];
  pet[STATS].hp = 2;
  const start = { ...pet[POSITION] };
  advanceUntil(world, () => pet[POSITION].y !== start.y);
  expect(pet[POSITION].x).toBe(start.x);
  expect(pet[POSITION].y).toBe(start.y + 1);
  advanceUntil(world, () => Math.abs(hero[POSITION].x - pet[POSITION].x) <= 3);
  expect(pet[STATS].hp).toBe(2);
});

it("steps back when the passage walls block both sideways steps", () => {
  const { world, hero, pet } = setup("|███████████|\n|█  P♀    ██|\n|███████████|");
  const start = { ...pet[POSITION] };
  walk(world, "left");
  expect(hero[POSITION]).toEqual(start);
  advanceUntil(world, () => pet[POSITION].x !== start.x);
  expect(pet[POSITION]).toEqual({ x: start.x + 1, y: start.y });
});

it.each([false, true])("goes around an opaque wall even when close to its owner (halo %s)", ghost => {
  const { world, hero, pet } = setup(`
|           |
|    █      |
|    █      |
|   P█ ♀    |
|    █      |
|    █      |
|           |`);
  if (ghost) { pet[STATS].hp = 0; petKnockout(world, pet); }
  advanceUntil(world, () => pet[POSITION].x >= hero[POSITION].x - 1, 18000);
  advanceTicks(world, 3);
  expect(Math.abs(pet[POSITION].x - hero[POSITION].x) +
    Math.abs(pet[POSITION].y - hero[POSITION].y)).toBe(ghost ? 4 : 3);
});

it("walks around a campfire to follow its owner", () => {
  const { world, hero, pet } = setup("|                 |\n| P *       ♀     |\n|                 |");
  for (let i = 0; i < 16; i++) {
    advanceTicks(world, 1);
    expect(getBurning(world, pet[POSITION])).toBeUndefined();
  }
  expect(distanceBetween(world, pet[POSITION], hero[POSITION])).toBeLessThanOrEqual(3);
  expect(pet[STATS].hp).toBe(pet[STATS].maxHp);
});

it("chases and bites a fairy without learning attack, even when normally peaceful", () => {
  const { world, pet } = setup("|             |\n|  P F   ♀    |\n|             |");
  const fairy = getCreatures(world, "fairy")[0];
  fairy[BEHAVIOUR].patterns = [];
  pet[TAMEABLE].attributes.aggression = false;
  const start = { ...pet[POSITION] };
  const hp = fairy[STATS].hp;
  advanceUntil(world, () => fairy[STATS].hp < hp, 12000);
  expect(pet[POSITION].x).toBeGreaterThan(start.x);
  expect(pet[TAMEABLE].skills).not.toContain("attack");
});

it.each(["wave", "beam"] as const)("steps out of an incoming hostile %s", spell => {
  const { world, pet } = setup("|                |\n| E    P  ♀      |\n|                |");
  const caster = getCreatures(world, "eye")[0];
  caster[BEHAVIOUR].patterns = [];
  const from = { ...pet[POSITION] };
  const clock = world.assertByIdAndComponents(pet[MOVABLE].reference, [REFERENCE])[REFERENCE];
  clock.tick = 95;
  castAs(world, caster, { spell, material: "wood" }, "right");
  advanceUntil(world, () => distanceBetween(world, from, pet[POSITION]) > 0, 500);
  const escaped = spell === "beam"
    ? pet[POSITION].y !== from.y
    : distanceBetween(world, caster[POSITION], pet[POSITION]) > distanceBetween(world, caster[POSITION], from);
  expect(escaped).toBe(true);
  expect(pet[STATS].hp).toBe(pet[STATS].maxHp);
});

it("walks to the fountain and heals beside the owner", () => {
  const { world, hero, pet } = setup("|               |\n| P   ⌠♀        |\n|               |");
  hero[STATS].maxHp = 20;
  hero[STATS].hp = 15;
  pet[STATS].hp = 2;
  const fountain = world.getEntities([POSITION, "SEQUENCABLE"]).find(unit => unit.SEQUENCABLE.states.fountain)!;
  advanceUntil(world, () => distanceBetween(world, pet[POSITION], fountain[POSITION]) <= 1, 9000);
  advance(world, 17000);
  expect([pet[STATS].hp, hero[STATS].hp]).toEqual([pet[STATS].maxHp, hero[STATS].maxHp]);
});

it("immediately gets out of a burning cell", () => {
  const { world, pet } = setup("|             |\n| P *  ♀      |\n|             |");
  const fire = world.getEntities(["BURNABLE", POSITION]).find(unit => unit.BURNABLE.burning)!;
  moveEntity(world, pet, fire[POSITION]);
  advanceUntil(world, () => !getBurning(world, pet[POSITION]), 1200);
});

it("backs away after being hurt even when ready to attack", () => {
  const { world, pet } = setup("|              |\n| E P  ♀       |\n|              |");
  const caster = getCreatures(world, "eye")[0];
  caster[BEHAVIOUR].patterns = [];
  pet[TAMEABLE].skills = ["attack"];
  pet[TAMEABLE].attributes.aggression = true;
  const clock = world.assertByIdAndComponents(pet[MOVABLE].reference, [REFERENCE])[REFERENCE];
  clock.tick = 600;
  castAs(world, caster, { spell: "beam", material: "gold" }, "right");
  advanceUntil(world, () => pet[STATS].hp < pet[STATS].maxHp, 2000);
  const hit = { ...pet[POSITION] };
  advanceUntil(world, () => distanceBetween(world, hit, pet[POSITION]) > 0, 1000);
  expect(Math.hypot(pet[POSITION].x - caster[POSITION].x, pet[POSITION].y - caster[POSITION].y))
    .toBeGreaterThan(Math.hypot(hit.x - caster[POSITION].x, hit.y - caster[POSITION].y));
});

it("steps once after taking environmental damage without an attacker", () => {
  const { world, pet } = setup("|              |\n|   P  ♀       |\n|              |");
  advanceTicks(world, 2);
  const from = { ...pet[POSITION] };
  const hp = pet[STATS].hp;
  pet.AFFECTABLE!.dot++;
  advanceUntil(world, () => pet[STATS].hp < hp);
  advanceUntil(world, () => distanceBetween(world, from, pet[POSITION]) > 0, 1600);
});

it("treats the fountain basin as water when choosing where to stand", () => {
  const { world, pet } = setup("|              |\n|    ⌠ P ♀     |\n|              |");
  pet[TAMEABLE].attributes.water = true;
  expect(getRefillElement(world, pet[POSITION])).toBeUndefined();
  advanceUntil(world, () => getRefillElement(world, pet[POSITION]) === "water");
});

it.each([false, true])("only occasionally scratches an adjacent chick (tamed %s)", tamed => {
  const { world, pet } = setup("| ♀PC |");
  const chick = getCreatures(world, "chick")[0];
  chick[BEHAVIOUR].patterns = [];
  if (!tamed) {
    delete pet[TAMEABLE].owner;
    pet[BELONGABLE].faction = "animal";
  }
  const hp = chick[STATS].hp;
  const roll = jest.spyOn(Math, "random").mockReturnValue(0.5);
  try {
    advanceTicks(world, 5);
    expect(chick[STATS].hp).toBe(hp);
    roll.mockReturnValue(0);
    advanceUntil(world, () => chick[STATS].hp < hp, 2000);
    expect(pet[TAMEABLE].skills).toEqual([]);
  } finally {
    roll.mockRestore();
  }
});

it("repeats a water request while thirsty even at full health", () => {
  const { world, pet } = setup("| ♀P  |");
  pet[TAMEABLE].attributes.thirst = true;
  const requestsWater = () => pet[TOOLTIP].dialogs[0]?.some(sprite => sprite.name === "Water");
  const roll = jest.spyOn(Math, "random").mockReturnValue(0);
  try {
    advanceUntil(world, () => !!requestsWater(), 20000);
    const first = pet[TOOLTIP].dialogs[0];
    roll.mockReturnValue(0.9);
    advanceUntil(world, () => !!requestsWater() && pet[TOOLTIP].dialogs[0] !== first, 10000);
    expect(pet[TAMEABLE].thirsty).toBe(true);
  } finally {
    roll.mockRestore();
  }
});

it("wakes and follows when its owner travels out of range", () => {
  const { world, hero, pet } = setup("|   P  ♀             |");
  pet[TAMEABLE].attributes.movement = false;
  const sleeping = () => [sleep1, sleep2].includes(pet[TOOLTIP].idle!);
  advanceUntil(world, sleeping, 15000);
  moveEntity(world, hero, { x: hero[POSITION].x + 8, y: hero[POSITION].y });
  advanceUntil(world, () => distanceBetween(world, pet[POSITION], hero[POSITION]) <= 3);
  expect(sleeping()).toBe(false);
});

it("asks to play visibly and may briefly refuse to follow after waiting for a stick", () => {
  const { world, pet, hero } = setup("|              |\n|   P  ♀       |\n|              |");
  pet[TAMEABLE].attributes = { vocal: false, movement: true };
  const speaking = (name: string) => pet[TOOLTIP].override === "visible" &&
    pet[TOOLTIP].dialogs[0]?.some(sprite => sprite.name === name);
  const roll = jest.spyOn(Math, "random").mockReturnValue(0);
  try {
    advanceUntil(world, () => !!speaking("Stick"), 30000);
    advanceUntil(world, () => !!speaking("Blocked"), 120000);
    const waiting = { ...pet[POSITION] };
    moveEntity(world, hero, { x: hero[POSITION].x + 7, y: hero[POSITION].y });
    advanceTicks(world, 2);
    expect(pet[POSITION]).toEqual(waiting);
    advanceUntil(world, () => distanceBetween(world, pet[POSITION], hero[POSITION]) <= 3);
  } finally {
    roll.mockRestore();
  }
});
