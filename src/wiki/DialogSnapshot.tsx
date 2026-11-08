import { useState } from "react";
import { Entity } from "ecs";
import { World } from "../engine";
import { Popup } from "../engine/components/popup";
import { slots } from "../engine/components/equippable";
import { getItemConsumption } from "../engine/systems/consume";
import { Sprite } from "../engine/components/sprite";
import { createPopup, openPopup } from "../engine/systems/popup";
import { getSequence } from "../engine/systems/sequence";
import { getFacingLayers } from "../game/assets/ui";
import { displayPopup, transientMessage } from "../game/assets/sequences";
import { none } from "../game/assets/sprites";
import { createCell, createNpc, populateInventory } from "../bindings/creation";
import { assertHero, createAreaWorld } from "../testing/harness";
import { createPreviewWorld, SceneName } from "./scenes";
import { npcSequence } from "../game/assets/utils";
import { earthChiefNpc } from "../game/assets/npcs";
import { Pixels, Text } from "./visuals";
import { worldRows } from "./WorldDiagram";
import { equipItem } from "../engine/systems/collect";
import { PauseSnapshot } from "./PauseSnapshot";
import { muteAudio } from "../game/sound/resumable";
import {
  createSave,
  getSaveSummaries,
  getSummary,
  setSaveSummaries,
} from "../game/saves";
import {
  getIndexFromKey,
  keyboardColumns,
  keyboardSize,
} from "../components/Keyboard";

muteAudio();

const sceneFor: Record<string, SceneName> = {
  buy: "trading",
  sell: "trading",
  craft: "crafting",
  brew: "brewing",
  forge: "forging",
  plant: "farming",
  build: "building",
  spell: "abilities",
  skill: "skills",
  tool: "harvesting",
  food: "food",
};
export function popupParticles(world: World, owner: Entity) {
  const state = getSequence(world, owner, "popup");
  if (!state) throw Error("Popup sequence is missing");
  state.elapsed = 10000;
  displayPopup(world, owner, state);
  const particles = Object.entries(state.particles)
    .filter(([name]) => name.startsWith("popup-"))
    .map(([, id]) => world.assertByIdAndComponents(id, ["PARTICLE", "SPRITE"]));
  return particleRows(particles);
}
function particleRows(
  particles: {
    PARTICLE: {
      offsetX: number;
      offsetY: number;
      offsetZ: number;
      amount?: number;
    };
    SPRITE: Sprite;
    ORIENTABLE?: {
      facing?: import("../engine/components/orientable").Orientation;
    };
  }[]
) {
  const left = Math.min(...particles.map((p) => p.PARTICLE.offsetX));
  const top = Math.min(...particles.map((p) => p.PARTICLE.offsetY));
  const right = Math.max(...particles.map((p) => p.PARTICLE.offsetX));
  const bottom = Math.max(...particles.map((p) => p.PARTICLE.offsetY));
  const rows: Sprite[][] = Array.from(
    { length: Math.round(bottom - top) + 1 },
    () => Array.from({ length: Math.round(right - left) + 1 }, () => none)
  );
  for (const part of particles.sort(
    (a, b) => a.PARTICLE.offsetZ - b.PARTICLE.offsetZ
  )) {
    const y = Math.round(part.PARTICLE.offsetY - top),
      x = Math.round(part.PARTICLE.offsetX - left);
    const layers = getFacingLayers(
      part.SPRITE,
      part.ORIENTABLE?.facing,
      part.PARTICLE.amount
    );
    rows[y][x] = {
      name: part.SPRITE.name,
      layers: [...rows[y][x].layers, ...layers],
    };
  }
  return rows;
}

export function dialogSnapshot(screen: string) {
  const [name, category] = screen.split(":");
  const signCell =
    name === "sign" ? "spawn_sign" : name.endsWith("_sign") ? name : undefined;
  const tab = (signCell ? "info" : name) as Popup["tabs"][number];
  const world =
    screen === "message"
      ? createAreaWorld("|♀|", { size: 32 })
      : ["class", "style", "warp"].includes(tab)
      ? createAreaWorld("|♀∩|", { level: "LEVEL_MENU", size: 32 })
      : createPreviewWorld(sceneFor[category] || sceneFor[tab] || "interface");
  const hero = world.assertComponents(assertHero(world), [
    "INVENTORY",
    "POSITION",
  ]);
  if (screen === "message") {
    populateInventory(world, hero, [
      { weapon: "sword", material: "iron", amount: 1 },
    ]);
    const sword = world.assertByIdAndComponents(
      hero.INVENTORY.items[hero.INVENTORY.items.length - 1],
      ["ITEM"]
    );
    equipItem(world, hero, sword);
    const state = getSequence(world, hero, "message")!;
    state.elapsed = 1;
    transientMessage(world, hero, state);
    return worldRows(world, {
      x: hero.POSITION.x - 10,
      y: hero.POSITION.y - 5,
      width: 21,
      height: 7,
    });
  }
  let owner = signCell
    ? createCell(world, { x: 3, y: 4 }, signCell, "visible").cell
    : world
        .getEntities(["POPUP", "POSITION"])
        .find((entity) => entity.POPUP.tabs.includes(tab));
  if (screen === "quest") {
    owner = createNpc(world, "earthChief", { x: 3, y: 4 });
    npcSequence(world, owner, "earthChiefNpc", {});
    earthChiefNpc(world, owner, getSequence(world, owner, "npc")!);
  }
  if (!owner) {
    owner = hero;
    createPopup(world, owner, { tabs: [tab] });
  }
  const popupOwner = world.assertComponents(owner, ["POPUP", "POSITION"]);
  const index = popupOwner.POPUP.tabs.indexOf(tab);
  popupOwner.POPUP.horizontalIndex = Math.max(0, index);
  const selectedTab = popupOwner.POPUP.horizontalIndex;
  if (tab === "equip" && ["spell", "skill", "tool"].includes(category)) {
    const equipment = hero.INVENTORY.items
      .map((id: number) => world.assertByIdAndComponents(id, ["ITEM"]))
      .filter((entity) => slots.some((slot) => entity.ITEM[slot]));
    const index = equipment.findIndex(
      (entity) => entity.ITEM[category as "spell" | "skill" | "tool"]
    );
    popupOwner.POPUP.verticalIndezes[selectedTab] = Math.max(0, index);
  } else if (tab === "inspect" && category === "food") {
    const bag = hero.INVENTORY.items
      .map((id: number) => world.assertByIdAndComponents(id, ["ITEM"]))
      .filter((entity) => !slots.some((slot) => entity.ITEM[slot]));
    popupOwner.POPUP.verticalIndezes[selectedTab] = Math.max(
      0,
      bag.findIndex((entity) => getItemConsumption(entity))
    );
  } else if (tab === "sell") {
    popupOwner.POPUP.verticalIndezes[selectedTab] = 1;
  } else if (tab === "chat") {
    popupOwner.POPUP.selections[selectedTab] = [..."/stat hp 25"].map(
      (char) => {
        const key = getIndexFromKey(char)!;
        return (
          key.tab * keyboardSize + key.offset * keyboardColumns + key.content
        );
      }
    );
  } else if (tab === "forge" && category === "add") {
    popupOwner.POPUP.selections[selectedTab] = [0];
    popupOwner.POPUP.verticalIndezes[selectedTab] = 1;
  } else if (tab === "forge" && category === "result") {
    popupOwner.POPUP.selections[selectedTab] = [0, 1];
    popupOwner.POPUP.verticalIndezes[selectedTab] = 1;
  } else if (tab === "brew" && category === "recipe") {
    popupOwner.POPUP.selections[selectedTab] = [0];
  } else if (tab === "brew" && category === "ingredients") {
    popupOwner.POPUP.selections[selectedTab] = [0, 0];
  }
  openPopup(world, hero, popupOwner, popupOwner.POPUP.tabs.length > 3);
  if (tab !== "load") return popupParticles(world, popupOwner);
  const saves = getSaveSummaries();
  try {
    setSaveSummaries([
      getSummary(createSave(world, new Date(2026, 9, 11, 15, 13, 23))),
    ]);
    return popupParticles(world, popupOwner);
  } finally {
    setSaveSummaries(saves);
  }
}
const cached = new Map<string, Sprite[][]>();
const stageLabels: Record<string, string> = {
  forge: "Equipment",
  brew: "Empty Kettle",
  "forge:add": "Add Material",
  "forge:result": "Result",
  "brew:recipe": "Recipes",
  "brew:ingredients": "Ingredients",
  message: "Transient Message",
};
export function DialogSnapshot({ screens }: { screens: string }) {
  const [dialogs] = useState(() =>
    screens
      .split(/\s+/)
      .filter(Boolean)
      .map((screen) => {
        if (screen !== "pause" && !cached.has(screen))
          cached.set(screen, dialogSnapshot(screen));
        return { screen, rows: cached.get(screen)! };
      })
  );
  return (
    <div className="DialogGallery">
      {dialogs.map(({ screen, rows }) => (
        <figure key={screen} className="DialogSnapshot">
          {stageLabels[screen] && (
            <figcaption>
              <Text color="#ffffff">{stageLabels[screen]}</Text>
            </figcaption>
          )}
          {screen === "pause" ? (
            <PauseSnapshot />
          ) : (
            <Pixels rows={rows} label={screen + " game dialog"} />
          )}
        </figure>
      ))}
    </div>
  );
}
