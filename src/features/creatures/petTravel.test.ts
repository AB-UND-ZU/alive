import { POSITION } from "../../engine/components/position";
import { TAMEABLE } from "../../engine/components/tameable";
import { getSceneFrame } from "../../renderers/interface/frame";
import { colors } from "../../game/assets/colors";
import { advanceUntil, assertHero, countItems, giveItems, holdMove, step, walk } from "../../testing/harness";
import { receiveGeneratedWorld, saveAndLoad } from "../../testing/saves";
import { createCreatureWorld, distanceBetween } from "./helpers";

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
