import { castSpell } from "../../engine/systems/trigger";
import { createHero } from "../../engine/systems/fate";
import { moveEntity, registerEntity } from "../../engine/systems/map";
import { PLAYER } from "../../engine/components/player";
import { STATS } from "../../engine/components/stats";
import { advanceUntil, giveItems } from "../../testing/harness";
import { createCreatureWorld, getCreature, toughen } from "./helpers";

it.each(["tutorialBoss", "banditArcher"] as const)(
  "%s attacks the nearer teammate and retargets when that teammate disconnects",
  (type) => {
    const { world, hero } = createCreatureWorld(
      "|                     |\n|                     |\n|          B          |\n|                     |\n|                     |\n|                     |\n|          ♀          |\n|                     |",
      { B: type }
    );
    world.metadata.warpPlayer = () => {};
    if (type === "banditArcher")
      giveItems(world, getCreature(world, type), [
        { stackable: "arrow", amount: 20 },
      ]);
    toughen(hero);
    const teammate = createHero(world, hero);
    toughen(teammate);
    registerEntity(world, teammate);
    moveEntity(world, hero, { x: 30, y: 30 });
    advanceUntil(
      world,
      () => teammate[STATS].hp < teammate[STATS].maxHp,
      30000
    );
    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
    teammate[PLAYER].connected = false;
    const hp = teammate[STATS].hp;
    moveEntity(world, hero, { x: 12, y: 5 });
    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp, 30000);
    expect(teammate[STATS].hp).toBe(hp);
  }
);

it("hits a connected player inside a spell while leaving an overlapping disconnected teammate unharmed", () => {
  const { world, hero } = createCreatureWorld(
    "|            |\n|            |\n|            |\n|            |\n|     B      |\n|     ♀      |\n|            |",
    { B: "tutorialBoss" }
  );
  world.metadata.warpPlayer = () => {};
  toughen(hero);
  const teammate = createHero(world, hero);
  toughen(teammate);
  registerEntity(world, teammate);
  moveEntity(world, teammate, { x: 5, y: 5 });
  teammate[PLAYER].connected = false;
  const caster = getCreature(world, "tutorialBoss");
  caster.BEHAVIOUR.patterns = [];
  const [spell] = giveItems(world, caster, [
    { spell: "beam", material: "wood", amount: 1 },
  ]);
  castSpell(world, caster, spell, "down");
  advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp, 5000);
  expect(teammate[STATS].hp).toBe(teammate[STATS].maxHp);
});
