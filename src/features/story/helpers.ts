import { World } from "../../engine";
import { FOCUSABLE } from "../../engine/components/focusable";
import { NpcType } from "../../engine/components/npc";
import { POPUP } from "../../engine/components/popup";
import { Position } from "../../engine/components/position";
import { Sprite } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { TypedEntity } from "../../engine/entities";
import { getSequence } from "../../engine/systems/sequence";
import { registerEntity } from "../../engine/systems/map";
import { assertIdentifierAndComponents } from "../../engine/utils";
import { createNpc } from "../../bindings/creation";
import { npcSequence } from "../../game/assets/utils";
import { assertHero, step, trigger, walk } from "../../testing/harness";
import { MOVABLE } from "../../engine/components/movable";
import { REFERENCE } from "../../engine/components/reference";
import { interact } from "../doors/helpers";

export const getText = (line: Sprite[]) =>
  line
    .map((sprite) => sprite.layers[sprite.layers.length - 1]?.char || " ")
    .join("")
    .trim();

/** Villager placed like the level code does, optionally running a story script. */
export const addNpc = (
  world: World,
  type: NpcType,
  position: Position,
  script?: Parameters<typeof npcSequence>[2],
  memory: any = {}
) => {
  const npc = createNpc(world, type, position);
  registerEntity(world, npc);
  if (script) npcSequence(world, npc, script, memory);
  // quest popups and identifiers are attached and removed by the story
  return npc as typeof npc & TypedEntity<"POPUP" | "IDENTIFIABLE">;
};

/** Current step of an entity's npc or quest script. */
export const getStep = (
  world: World,
  entity: TypedEntity,
  type: "npc" | "quest" = "npc"
) => getSequence(world, entity, type)?.args.step;

/** Text lines of the first page of a popup, e.g. a quest description. */
export const getLines = (entity: TypedEntity) =>
  (entity as TypedEntity<"POPUP">)[POPUP]?.lines[0]?.map(getText) || [];

/** Text of the speech bubbles of an entity's tooltip, without borders. */
export const getDialogs = (entity: TypedEntity) =>
  (entity as TypedEntity<"TOOLTIP">)[TOOLTIP].dialogs.map((dialog) =>
    getText(dialog.filter((sprite) => sprite.name === "text_generic"))
  );

/** Entity highlighted by the quest focus and the kind of highlight. */
export const getFocus = (world: World) => {
  const focus = assertIdentifierAndComponents(world, "focus", [FOCUSABLE]);
  return {
    target: focus[FOCUSABLE].pendingTarget as number | undefined,
    highlight: focus[FOCUSABLE].highlight,
  };
};

export const press = (
  world: World,
  action: "right" | "down" | "up" | "close"
) => {
  trigger(world, action);
  step(world, 10);
};

/** Open the adjacent quest, claim the reward and close the completed screen. */
export const claimQuest = (world: World) => {
  interact(world, 30);
  press(world, "right");
  press(world, "close");
  step(world, 5);
};

/** Step off and back, as a viewed popup only prompts again after moving. */
export const revisit = (world: World) => {
  walk(world, "down");
  walk(world, "up");
  step(world, 5);
};

/** Let the idle hero notice changes nearby, e.g. after being placed somewhere. */
export const refresh = (world: World, frames = 30) => {
  const hero = assertHero(world);
  const reference = world.assertByIdAndComponents(hero[MOVABLE].reference, [
    REFERENCE,
  ])[REFERENCE];
  if (reference.suspensionCounter !== -1) reference.suspensionCounter += 1;
  reference.suspended = false;
  step(world, frames);
};
