import { feedPet } from "../../engine/systems/petCare";
import { entities } from "../../engine";
import { WeatherSequence } from "../../engine/components/sequencable";
import { none } from "../../game/assets/sprites";
import { mountVessel, unmountVessel } from "../../engine/systems/vessel";
import { createCell, assignBuilding } from "../../bindings/creation";
import { openDoor } from "../../engine/systems/trigger";
import { createSequence } from "../../engine/systems/sequence";
import { setIdentifier } from "../../engine/utils";
import { moveEntity, registerEntity } from "../../engine/systems/map";
import { POSITION } from "../../engine/components/position";
import { TAMEABLE } from "../../engine/components/tameable";
import { getSceneFrame } from "../../renderers/interface/frame";
import { colors } from "../../game/assets/colors";
import { advanceUntil, assertHero, countItems, giveItems, holdMove, step, walk } from "../../testing/harness";
import { receiveGeneratedWorld, saveAndLoad } from "../../testing/saves";
import { advanceTicks, countDrops, createCreatureWorld, distanceBetween } from "./helpers";

const room = "|███████|\n|█ ♀P P█|\n|███████|";

it("shows a full silver health bar on a wild pet", () => {
  const { world } = createCreatureWorld(room, { P: "pet" });
  step(world, 30);
  const pet = world.getEntities([TAMEABLE])[0];
  const bar = getSceneFrame(world, 15, 11).find(entry => entry.entity === pet && !entry.hidden && entry.hp)?.hp;
  expect(bar).toMatchObject({ color: colors.silver, value: pet.STATS!.maxHp, maximum: pet.STATS!.maxHp });
});

it("lets the hero enter their pet’s cell without forcing a swap", () => {
  const { world, hero } = createCreatureWorld(room, { P: "pet" });
  const pet = world.getEntities([TAMEABLE, POSITION])[0];
  pet[TAMEABLE].owner = world.getEntityId(hero);
  const next = { ...pet[POSITION] };
  walk(world, "right", 1);
  expect(hero[POSITION]).toEqual(next);
  expect(pet[POSITION]).toEqual(next);
  walk(world, "right", 1);
  expect(hero[POSITION]).toEqual({ x: next.x + 1, y: next.y });
});

it("takes the same time to walk past a pet as along an empty passage", () => {
  const cross = (withPet: boolean) => {
    const { world, hero } = createCreatureWorld(
      withPet ? room : room.replace("P", " "), { P: "pet" }
    );
    const pet = world.getEntities([TAMEABLE, POSITION])[0];
    if (withPet) {
      pet[TAMEABLE].owner = world.getEntityId(hero);
      pet[TAMEABLE].attributes = {};
    }
    const destination = hero[POSITION].x + 2;
    holdMove(world, ["right"]);
    return advanceUntil(world, () => hero[POSITION].x === destination);
  };
  expect(cross(true)).toBe(cross(false));
});

it("keeps owned pets and their inventory through a save and level change", () => {
  const start = createCreatureWorld(room, { P: "pet" }, { level: "LEVEL_MENU" });
  let world = start.world;
  const hero = start.hero;
  const [pet] = world.getEntities([TAMEABLE, "INVENTORY", POSITION, "SPRITE"]);
  pet[TAMEABLE].owner = world.getEntityId(hero);
  pet[TAMEABLE].attributes.hunger = false;
  giveItems(world, pet, [{ stackable: "salmon", amount: 1 }]);
  world = saveAndLoad(world);
  const arrival = receiveGeneratedWorld(world);
  world.metadata.generateLevel!({ level: "LEVEL_TUTORIAL" });
  world = arrival();
  const pets = world.getEntities([TAMEABLE, "INVENTORY", POSITION, "SPRITE"]);
  expect(pets).toHaveLength(1);
  const [companion] = pets;
  expect(companion[TAMEABLE]).toEqual(pet[TAMEABLE]);
  expect(companion.SPRITE).toEqual(pet.SPRITE);
  expect(countItems(world, companion, { stackable: "salmon" })).toBe(1);
  expect(distanceBetween(world, companion[POSITION], assertHero(world)[POSITION])).toBe(1);
  step(world, 40);
});

it("collects all feeding XP before boarding its owner’s boat", () => {
  const { world, hero } = createCreatureWorld("| ♀P≈≈ |", { P: "pet" });
  const pet = world.getEntities([TAMEABLE, POSITION, "STATS", "INVENTORY"])[0];
  pet[TAMEABLE].owner = world.getEntityId(hero);
  pet[TAMEABLE].favourites.push({ item: { stackable: "tuna" }, xp: 2 });
  const [fish] = giveItems(world, pet, [{ stackable: "tuna", amount: 1 }]);
  expect(feedPet(world, pet, hero, world.assertComponents(fish, ["ITEM"]))).toBe(true);
  const boat = createCell(world, { x: pet.POSITION.x + 1, y: pet.POSITION.y }, "boat", "visible").cell!;
  mountVessel(world, hero, boat);
  advanceUntil(world, () => !pet.POSITION);
  expect(pet.STATS.xp).toBe(2);
  expect(hero.STATS.xp).toBe(0);
});

it("catches a departing boat, travels aboard through a save and walks ashore", () => {
  const start = createCreatureWorld("|         ≈≈≈≈≈≈≈≈ |\n|  P      ♀≈≈≈≈≈≈≈ |\n|         ≈≈≈≈≈≈≈≈ |\n|                  |", { P: "pet" });
  let world = start.world;
  const pet = world.getEntities([TAMEABLE, POSITION])[0];
  const id = world.getEntityId(pet);
  pet[TAMEABLE].owner = world.getEntityId(start.hero);
  const boat = createCell(world, { x: start.hero.POSITION.x + 1, y: 1 }, "boat", "visible").cell!;
  const boatId = world.getEntityId(boat);
  mountVessel(world, start.hero, boat);
  const from = pet.POSITION.x;
  advanceUntil(world, () => pet.POSITION.x > from);
  moveEntity(world, boat, { x: 14, y: 1 });
  moveEntity(world, start.hero, boat.POSITION!);
  advanceUntil(world, () => !pet.POSITION);
  expect(getSceneFrame(world, 21, 9).some(entry => entry.entity === pet)).toBe(false);
  world = saveAndLoad(world);
  const passenger = world.assertByIdAndComponents(id, [TAMEABLE]);
  const vessel = world.assertByIdAndComponents(boatId, [POSITION]);
  const hero = assertHero(world);
  moveEntity(world, vessel, { x: 14, y: 2 });
  moveEntity(world, hero, vessel.POSITION);
  unmountVessel(world, hero, vessel);
  expect(passenger.POSITION).toEqual(vessel.POSITION);
  walk(world, "down");
  advanceUntil(world, () => passenger.POSITION!.y !== vessel.POSITION.y);
  expect(distanceBetween(world, passenger.POSITION!, hero.POSITION)).toBeLessThanOrEqual(3);
});

it("shelters in the owner's building during local rain and waits outside again when it clears", () => {
  const { world, hero } = createCreatureWorld(
    "|              |\n| ╒╦╦╕         |\n| ╠╬╬╣    P    |\n| ╞╪╪╡         |\n| └D┴┘         |\n|  ♀           |\n|              |", { P: "pet", D: "wood_door" }
  );
  const [pet] = world.getEntities([TAMEABLE, POSITION, "LAYER"]);
  pet[TAMEABLE].owner = world.getEntityId(hero);
  const { building, door } = assignBuilding(world, { x: 3, y: 2 });
  openDoor(world, door!);
  walk(world, "up", 3);
  const storm = entities.createAnchor(world, { POSITION: { ...hero.POSITION }, SEQUENCABLE: { states: {} }, SPRITE: none, RENDERABLE: { generation: 0 } });
  registerEntity(world, storm);
  setIdentifier(world, storm, "storm");
  createSequence<"weather", WeatherSequence>(world, storm, "weather", "weatherStorm", {
    position: { ...hero.POSITION }, intensity: 0, drops: [], generation: 0, type: "rain", start: -500, end: Infinity,
  });
  advanceUntil(world, () => pet.LAYER.structure === world.getEntityId(building));
  storm.SEQUENCABLE.states.weather!.args.end = world.metadata.gameEntity.RENDERABLE.generation;
  advanceUntil(world, () => !pet.LAYER.structure && pet.POSITION.y > hero.POSITION.y);
});

it("drops one Air element when a wild pet dies", () => {
  const { world } = createCreatureWorld("| ♀ P |", { P: "pet" });
  const [pet] = world.getEntities([TAMEABLE, "STATS"]);
  expect(pet.STATS.resist).toBe(2);
  expect(pet.STATS.haste).toBeGreaterThanOrEqual(1);
  pet.STATS.hp = 0;
  advanceUntil(world, () => countDrops(world, { stackable: "resource", element: "air" }) > 0);
  advanceTicks(world, 2);
  expect(countDrops(world, { stackable: "resource", element: "air" })).toBe(1);
});

it("swaps on the owner's step when both movement clocks are ready", () => {
  const { world, hero } = createCreatureWorld("|    ♀P    |", { P: "pet" });
  const [pet] = world.getEntities([TAMEABLE, POSITION, "MOVABLE"]);
  Object.assign(pet[TAMEABLE], { owner: world.getEntityId(hero), attributes: {} });
  advanceTicks(world, 2);
  const start = { ...hero.POSITION };
  const next = { ...pet.POSITION };
  holdMove(world, ["right"]);
  for (const unit of [pet, hero]) {
    const clock = world.assertByIdAndComponents(unit.MOVABLE.reference, ["REFERENCE"]).REFERENCE;
    clock.delta = clock.tick;
  }
  advanceUntil(world, () => hero.POSITION.x === next.x);
  expect(pet.POSITION).toEqual(start);
});

it("revives from damage over time without a zero hit and takes the next damage tick normally", () => {
  const { world, hero } = createCreatureWorld("| ♀ P |", { P: "pet" });
  const [pet] = world.getEntities([TAMEABLE, POSITION, "STATS", "AFFECTABLE", "SEQUENCABLE", "INVENTORY"]);
  pet[TAMEABLE].owner = world.getEntityId(hero);
  pet.STATS.hp = 2;
  pet.AFFECTABLE.dot += 2;
  advanceUntil(world, () => !!pet[TAMEABLE].ghost);
  advanceUntil(world, () => !pet.SEQUENCABLE.states.marker);
  const [food] = giveItems(world, pet, [{ ...pet[TAMEABLE].favourites[0].item, amount: 1 }]);
  expect(feedPet(world, pet, hero, world.assertComponents(food, ["ITEM"]))).toBe(true);
  advanceTicks(world, 1);
  expect(pet.STATS.hp).toBe(pet.STATS.maxHp);
  expect(pet.SEQUENCABLE.states.marker).toBeUndefined();
  pet.AFFECTABLE.dot++;
  advanceUntil(world, () => pet.STATS.hp === pet.STATS.maxHp - 1);
});
