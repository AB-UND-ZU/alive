import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { INVENTORY } from "../../engine/components/inventory";
import { PLAYER } from "../../engine/components/player";
import { STATS } from "../../engine/components/stats";
import { BREWABLE } from "../../engine/components/brewable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FORGABLE } from "../../engine/components/forgable";
import { Position, POSITION } from "../../engine/components/position";
import { TypedEntity } from "../../engine/entities";
import { removePopup } from "../../engine/systems/popup";
import { getSequence } from "../../engine/systems/sequence";
import { setIdentifier } from "../../engine/utils";
import { add } from "../../game/math/std";
import {
  assertHero,
  findEntityAt,
  findInArea,
  step,
} from "../../testing/harness";
import { teleport } from "../creatures/helpers";
import { setup } from "../doors/helpers";
import { addNpc, refresh } from "./helpers";

// ♀ hero, H chief, D druid, S smith, K kettle, A anvil, T spare spot
export const townArea = `
|                |
|  ♀H      D K   |
|                |
|          S A   |
|                |
|          T     |
`;

/** Earth town as set up by the island level, with the chief's story running. */
export const setupTown = () => {
  const town = setup(townArea, {
    legend: { K: "kettle_passive", A: "anvil_passive" },
  });
  const { world } = town;
  const hero = world.assertComponents(town.hero, [
    ACTIONABLE,
    EQUIPPABLE,
    INVENTORY,
    PLAYER,
    POSITION,
    STATS,
  ]);
  // workstations only get popups once the story unlocks them
  const kettle = findEntityAt(world, findInArea(townArea, "K"), [
    BREWABLE,
  ]) as TypedEntity<"BREWABLE" | "POPUP">;
  const anvil = findEntityAt(world, findInArea(townArea, "A"), [
    FORGABLE,
  ]) as TypedEntity<"FORGABLE" | "POPUP">;
  setIdentifier(world, kettle, "earth_kettle");
  setIdentifier(world, anvil, "earth_anvil");
  const druid = addNpc(world, "earthDruid", findInArea(townArea, "D"));
  const smith = addNpc(world, "earthSmith", findInArea(townArea, "S"));
  const chief = addNpc(
    world,
    "earthChief",
    findInArea(townArea, "H"),
    "earthChiefNpc"
  );
  step(world, 5);
  return { world, hero, chief, druid, smith, kettle, anvil };
};

/** Continue an npc story at a later step. */
export const skipTo = (world: World, npc: TypedEntity, name: string) => {
  removePopup(world, npc);
  getSequence(world, npc, "npc")!.args.step = name;
  step(world, 5);
};

/** Place the hero to the left of someone and let it notice them. */
export const approach = (world: World, target: TypedEntity<"POSITION">) => {
  teleport(world, assertHero(world), add(target[POSITION], { x: -1, y: 0 }));
  refresh(world);
};

export const spot = (char: string): Position => findInArea(townArea, char);
