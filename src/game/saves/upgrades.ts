import addRestorable, { RESTORABLE } from "../../engine/components/restorable";
import { checkUnlocks, loadUnlocks, persistUnlock, Unlock } from "../unlocks";
import { compareVersions, saveVersion } from ".";
import type { SaveGame } from ".";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { CASTABLE } from "../../engine/components/castable";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LIQUID } from "../../engine/components/liquid";
import { NPC } from "../../engine/components/npc";
import { POPUP } from "../../engine/components/popup";
import { REFERENCE } from "../../engine/components/reference";
import { RENDERABLE } from "../../engine/components/renderable";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import type { Sprite, SpriteArtwork, SpriteLayers } from "../../engine/components/sprite";
import { STATS } from "../../engine/components/stats";
import { createSnapshot, restoreSnapshot } from "../../engine/snapshot";
import { disposeFrame } from "../../engine/systems/map";
import { boatHaste, getHasteInterval } from "../../engine/systems/movement";
import { createSequence } from "../../engine/systems/sequence";
import { customSprite, namedSprites } from "../assets/spriteIds";
import * as sprites from "../assets/sprites";
import { unitDefinitions } from "../balancing/units";
import { upgradeEntities } from "./upgradeEntities";
import { upgradeIsland } from "./upgradeIsland";
import { upgradePopups } from "./upgradePopups";

// Older saves inlined generated sprites without an ID. Recover the named
// variant when its saved artwork matches, including equipment and idle icons.
const legacyKey = (sprite: SpriteArtwork) => {
  // Old merges explicitly repeated the base layers for every missing view.
  const views = ({ layers, facing, amounts }: SpriteLayers) => {
    const base = JSON.stringify(layers);
    return [
      base,
      ...[
        facing?.up,
        facing?.right,
        facing?.down,
        facing?.left,
        amounts?.single,
        amounts?.double,
        amounts?.multiple,
      ].map((view) => {
        if (!view) return null;
        const value = JSON.stringify(view);
        return value === base ? null : value;
      }),
    ];
  };
  return JSON.stringify([
    sprite.name || "",
    views(sprite),
    sprite.terminal && views(sprite.terminal),
  ]);
};
let legacySprites: Map<string, Sprite> | undefined;
function readLegacySprite(artwork: SpriteArtwork): Sprite {
  if (!legacySprites) {
    legacySprites = new Map();
    for (const sprite of namedSprites.values()) {
      const key = legacyKey(sprite);
      // Some elemental variants look identical to the unmodified material.
      if (!legacySprites.get(key)?.id.endsWith("_default"))
        legacySprites.set(key, sprite);
    }
  }
  return legacySprites.get(legacyKey(artwork)) || customSprite(artwork);
}

function upgradeWorld(save: SaveGame, earned: Set<Unlock>): SaveGame {
  const world = restoreSnapshot(save.snapshot, (value) => {
    // Pre-ID saves stored exported sprites by their JavaScript export name.
    if ("$sprite" in value) {
      const sprite = sprites[value.$sprite as keyof typeof sprites];
      if (!sprite) throw new Error(`Unknown legacy sprite: ${value.$sprite}`);
      return sprite;
    }
    if ("layers" in value && !("id" in value) && "name" in value)
      return readLegacySprite(value as SpriteArtwork);
  });

  for (const entity of world.metadata.ecs.entities) {
    // Older terrain and tornadoes stored the previous movement modifiers.
    const tempo = entity.TEMPO;
    if (tempo?.amount === 2) tempo.amount = 3;
    else if (tempo?.amount === -1) tempo.amount = -2;
    else if (
      tempo?.amount === -6 ||
      (tempo?.amount === -2 && !entity.HARVESTABLE)
    )
      tempo.amount = -4;

    if (entity.MOUNTABLE?.medium === "water" && entity.MOVABLE) {
      // Boats saved at haste 5 on the new curve keep their own 247 ms clock.
      const clock = world.getEntityByIdAndComponents(entity.MOVABLE.reference, [
        REFERENCE,
      ])?.REFERENCE;
      if (clock?.tick === 247) {
        const tick = getHasteInterval(world, boatHaste);
        clock.delta *= tick / clock.tick;
        clock.tick = tick;
        entity.MOVABLE.spring = { duration: tick };
        const rider = world.getEntityByIdAndComponents(
          entity.MOUNTABLE.passenger,
          ["MOVABLE"]
        );
        if (rider) rider.MOVABLE.spring = { duration: tick };
      }
    }
    if (entity[POPUP]?.tabs.includes("load") && !entity[RESTORABLE]) {
      addRestorable(world, entity, {});
    }
    // Older arena cleanup could remove loot items while their containers survived.
    const inventory = entity[INVENTORY];
    if (!inventory) continue;
    const items = inventory.items.filter((id) =>
      world.getEntityByIdAndComponents(id, [ITEM])
    );
    if (items.length !== inventory.items.length) inventory.items = items;
  }

  // Older traps counted their warning time on a separate reference frame.
  for (const entity of world.getEntities([CASTABLE, SEQUENCABLE])) {
    const aura = entity[SEQUENCABLE].states.aura;
    if (aura?.name !== "trapAura") continue;

    const castable = entity[CASTABLE] as {
      trigger?: { delay: number; frame?: number };
    };
    const timer = castable.trigger;
    if (!timer && aura.args.range && aura.args.delay !== undefined) continue;
    aura.args.range ||= 1;
    aura.args.delay ??= (timer?.delay ?? 500) / 100;
    if (timer?.frame !== undefined) {
      const frame = world.assertByIdAndComponents(timer.frame, [
        REFERENCE,
        RENDERABLE,
      ]);
      aura.elapsed =
        (frame[RENDERABLE].generation - 1) * frame[REFERENCE].tick +
        frame[REFERENCE].delta;
      aura.args.memory = { triggered: true };
      Object.assign(
        world.assertByIdAndComponents(aura.reference, [REFERENCE])[REFERENCE],
        frame[REFERENCE]
      );
      disposeFrame(world, frame);
    }
    delete castable.trigger;
  }

  upgradeIsland(world);
  upgradeEntities(world);
  upgradePopups(world);

  for (const entity of world.getEntities([NPC, BEHAVIOUR])) {
    const npc = entity[NPC];
    const patterns = entity[BEHAVIOUR].patterns;
    if (
      unitDefinitions[npc.type].patternNames.includes("defend") &&
      !patterns.some((pattern) => pattern.name === "defend")
    ) {
      patterns.unshift({ name: "defend", memory: { hp: entity[STATS]?.hp } });
    }
  }

  for (const entity of world.getEntities([LIQUID, SEQUENCABLE, RENDERABLE])) {
    Reflect.deleteProperty(entity[LIQUID], "timestamp");
    if (entity[SEQUENCABLE].states.splash) continue;
    createSequence<"splash", Record<string, never>>(
      world,
      entity,
      "splash",
      "bubbleSplash",
      {}
    );
    entity[SEQUENCABLE].states.splash!.elapsed = entity[LIQUID].amount * 250;
  }

  // Entering the Island clears the Dungeon defeat counter.
  if (save.level === "LEVEL_ISLAND") earned.add("LEVEL_ISLAND");
  checkUnlocks(world, (key) => earned.add(key));
  return { ...save, snapshot: createSnapshot(world) };
}

const versionKey = "alive.lastGameVersion";

export const saveUpgrades = [
  { version: "0.9.0", upgrade: upgradeWorld },
];

export const pendingUpgrades = () => {
  const last = localStorage.getItem(versionKey);
  if (last && compareVersions(last, saveVersion) >= 0) return;
  loadUnlocks();
  return saveUpgrades
    .filter(({ version }) =>
      (!last || compareVersions(version, last) > 0) && compareVersions(version, saveVersion) <= 0
    )
    .sort((a, b) => compareVersions(a.version, b.version));
};

export const upgradeSave = (save: SaveGame, step: (typeof saveUpgrades)[number], earned: Set<Unlock>) => ({
  ...step.upgrade(save, earned),
  version: step.version,
});

export const finishUpgrade = (earned: Set<Unlock>) => {
  earned.forEach(persistUnlock);
  localStorage.setItem(versionKey, saveVersion);
};
