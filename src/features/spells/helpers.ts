import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { CASTABLE } from "../../engine/components/castable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { INVENTORY } from "../../engine/components/inventory";
import { Element, ITEM, Material, Spell } from "../../engine/components/item";
import { NPC } from "../../engine/components/npc";
import { Orientation } from "../../engine/components/orientable";
import { Position, POSITION } from "../../engine/components/position";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import { getSequence } from "../../engine/systems/sequence";
import { castSpell } from "../../engine/systems/trigger";
import {
  advanceUntil,
  assertHero,
  createAreaWorld,
  face,
  findEntityAt,
  findInArea,
  giveItems,
  step,
  trigger,
} from "../../testing/harness";

export type SpellItem = {
  spell: Spell;
  material?: Material;
  element?: Element;
};

export type SpellWorldOptions = {
  mp?: number;
  legend?: Record<string, string>;
  size?: number;
};

/**
 * World with "D" as training dummy and a hero carrying an equipped spell and
 * enough mana to cast it.
 */
export const createSpellWorld = (
  area: string,
  item: SpellItem | undefined,
  { mp = 5, legend = {}, size }: SpellWorldOptions = {}
) => {
  const world = createAreaWorld(area, {
    legend: { D: "dummy", ...legend },
    size,
  });
  const hero = world.assertComponents(assertHero(world), [
    ACTIONABLE,
    EQUIPPABLE,
    INVENTORY,
    POSITION,
    STATS,
  ]);
  if (item) giveItems(world, hero, [{ ...item, amount: 1 }]);

  // let equipment and stats settle before setting mana
  step(world, 1);
  hero[STATS].maxMp = Math.max(mp, 1);
  hero[STATS].mp = mp;

  return { world, hero };
};

/** Air area with characters placed at the given positions. */
export const createArea = (
  width: number,
  height: number,
  marks: Record<string, Position>
) => {
  const rows = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => " ")
  );
  Object.entries(marks).forEach(([char, { x, y }]) => {
    rows[y][x] = char;
  });
  return rows.map((row) => `|${row.join("")}|`).join("\n");
};

/** Cast the hero's equipped spell into a direction and wait until handled. */
export const cast = (world: World, orientation: Orientation) => {
  const hero = world.assertComponents(assertHero(world), [ACTIONABLE]);
  face(world, orientation);
  trigger(world, "spell");
  advanceUntil(world, () => !hero[ACTIONABLE].spellTriggered, 1000);
};

/** Let a unit cast a spell like the AI does, e.g. bolts and blasts. */
export const castAs = (
  world: World,
  caster: TypedEntity<"POSITION">,
  item: SpellItem,
  orientation: Orientation
) =>
  castSpell(
    world,
    caster,
    {
      [ITEM]: { carrier: -1, bound: false, amount: 1, ...item },
    } as TypedEntity<"ITEM">,
    orientation
  );

/** Whether any spell or aura of the caster is still active. */
export const isCasting = (world: World, caster: TypedEntity) => {
  const casterId = world.getEntityId(caster);
  return world
    .getEntities([CASTABLE, SEQUENCABLE])
    .some(
      (castable) =>
        castable[CASTABLE].caster === casterId &&
        Object.keys(castable[SEQUENCABLE].states).length > 0
    );
};

/** Wait until all spells of the caster have ended. */
export const waitForSpell = (world: World, caster: TypedEntity) =>
  advanceUntil(world, () => !isCasting(world, caster), 20000);

/** Unit with stats placed at a character of the area. */
export const getUnit = (world: World, area: string, char: string) => {
  const unit = findEntityAt(world, findInArea(area, char), [
    NPC,
    POSITION,
    STATS,
  ]);
  if (!unit) throw new Error(`No unit at "${char}"`);
  return unit;
};

/** Step frames and collect every loss of hp per unit. */
export const recordHits = (
  world: World,
  units: TypedEntity<"STATS">[],
  frames: number
) => {
  const hits = units.map((): number[] => []);
  const previous = units.map((unit) => unit[STATS].hp);

  for (let frame = 0; frame < frames; frame += 1) {
    step(world);
    units.forEach((unit, index) => {
      if (unit[STATS].hp < previous[index]) {
        hits[index].push(previous[index] - unit[STATS].hp);
      }
      previous[index] = unit[STATS].hp;
    });
  }

  return hits;
};

/** Text of the latest message shown above an entity. */
export const getLastMessage = (world: World, entity: TypedEntity) => {
  const messages = getSequence(world, entity, "message")?.args.messages || [];
  const message = messages[messages.length - 1];
  return message?.line
    .map((sprite) => sprite.layers[sprite.layers.length - 1]?.char || " ")
    .join("");
};
