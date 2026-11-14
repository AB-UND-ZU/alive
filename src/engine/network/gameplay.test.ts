import {
  assertHero,
  createAreaWorld,
  giveItems,
  step,
  advance,
  trigger,
  GivenItem,
  countItems,
} from "../../testing/harness";
import { createHero } from "../systems/fate";
import { registerEntity, moveEntity } from "../systems/map";
import { ensurePlayerInterface } from "../../bindings/interface";
import { createPlayerInput } from "./input";
import { createReplica } from "./replica";
import { createSnapshot } from "../snapshot";
import { PLAYER } from "../components/player";
import { POSITION } from "../components/position";
import { STATS } from "../components/stats";
import { NPC } from "../components/npc";
import { ORIENTABLE } from "../components/orientable";

const attacks: GivenItem[] = [
  { spell: "beam", material: "wood", amount: 1 },
  { spell: "wave", material: "wood", amount: 1 },
  { weapon: "wand", skill: "wand", material: "wood", amount: 1 },
  { weapon: "spear", skill: "spear", material: "wood", amount: 1 },
  { skill: "slash", material: "iron", amount: 10 },
  { skill: "bow", material: "iron", amount: 1 },
];

it.each(attacks)(
  "preserves damage and costs for $spell $skill with one to three connected players",
  (item) => {
    const outcomes = [0, 1, 2, 3].map((count) => {
      const world = createAreaWorld(
        "|                |\n| ♀D             |\n|                |",
        {
          size: 40,
          legend: { D: "dummy" },
        }
      );
      if (count) world.metadata.warpPlayer = () => {};
      let hero = world.assertComponents(assertHero(world), [
        PLAYER,
        POSITION,
        STATS,
        ORIENTABLE,
        "INVENTORY",
      ]);
      for (let index = 1; index < count; index++) {
        const teammate = createHero(world, hero);
        registerEntity(world, teammate);
        teammate[PLAYER].interface = undefined;
        ensurePlayerInterface(world, teammate);
        moveEntity(world, hero, { x: 20 + index, y: 20 });
        hero = world.assertComponents(teammate, [
          PLAYER,
          POSITION,
          STATS,
          ORIENTABLE,
          "INVENTORY",
        ]);
        moveEntity(world, hero, { x: 1, y: 1 });
      }
      giveItems(world, hero, [
        ...(item.skill === "slash"
          ? [{ weapon: "sword", material: "iron", amount: 1 } as const]
          : []),
        item,
        { stackable: "arrow", amount: 20 },
        { stackable: "charge", amount: 20 },
      ]);
      advance(world, 1000);
      hero[STATS].maxMp = 20;
      hero[STATS].mp = 20;
      hero[ORIENTABLE].facing = "right";
      const target = world
        .getEntities([NPC, STATS])
        .find((entity) => entity[NPC].type === "dummy")!;
      const hp = target[STATS].hp;
      const kind = item.spell ? "spell" : "skill";
      const input = createPlayerInput(world, world.getEntityId(hero));
      if (count) input.receive({ sequence: 0, action: { kind } });
      else trigger(world, kind);
      const replica = createReplica();
      replica.world.metadata.localPlayerId = world.getEntityId(hero);
      for (let frame = 0; frame < 150; frame++) {
        if (count) input.onUpdate();
        step(world);
        // Uneven delivery and a brief stall must not replay gameplay on clients.
        if (frame % 3 === 0 && (frame < 30 || frame > 45))
          replica.receive({
            sequence: frame,
            serverTime: world.metadata.elapsed,
            snapshot: createSnapshot(world, true),
          });
        replica.render(1000 / 30);
      }
      replica.receive({
        sequence: 151,
        serverTime: world.metadata.elapsed,
        snapshot: createSnapshot(world, true),
      });
      expect(
        replica.world.assertByIdAndComponents(world.getEntityId(target), [
          STATS,
        ])[STATS]
      ).toEqual(target[STATS]);
      expect(
        replica.world.assertByIdAndComponents(world.getEntityId(hero), [
          STATS,
          POSITION,
        ])[STATS]
      ).toEqual(hero[STATS]);
      return {
        damage: hp - target[STATS].hp,
        mana: hero[STATS].mp,
        charges: countItems(world, hero, { stackable: "charge" }),
        arrows: countItems(world, hero, { stackable: "arrow" }),
      };
    });
    expect(outcomes[0].damage).toBeGreaterThan(0);
    expect(outcomes.slice(1)).toEqual([outcomes[0], outcomes[0], outcomes[0]]);
  }
);
