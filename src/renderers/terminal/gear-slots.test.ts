import {
  act,
  advance,
  assertHero,
  createAreaWorld,
} from "../../testing/harness";
import { colors } from "../../game/assets/colors";
import {
  weaponSlot,
  offhandSlot,
  bootsSlot,
  spellSlot,
  skillSlot,
  toolSlot,
  ringSlot,
  amuletSlot,
  compassSlot,
  torchSlot,
  mapSlot,
} from "../../game/assets/sprites";
import { projectSprite, projectTerminalLayers } from "./sprites";
import { getSceneFrame } from "../interface/frame";
import { createTerminalFrame, collectTerminalSprites } from "./frame";
import { POPUP } from "../../engine/components/popup";
import { rerenderEntity } from "../../engine/systems/renderer";

it("shows empty gear slots as black symbols on gray", () => {
  for (const [sprite, char] of [
    [weaponSlot, "/"],
    [offhandSlot, "¬"],
    [bootsSlot, '"'],
    [spellSlot, "+"],
    [skillSlot, "»"],
    [toolSlot, "↑"],
    [ringSlot, "ô"],
    [amuletSlot, "♦"],
    [compassSlot, "↕"],
    [torchSlot, "î"],
    [mapSlot, "#"],
  ] as const) {
    expect(projectSprite(sprite)).toEqual({
      char,
      foreground: colors.black,
      background: colors.grey,
    });
  }
});

it("shows only the active empty slot in the real gear dialog", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  act(world, "gear");
  advance(world, 2000);
  const hero = assertHero(world);
  const popup = world.assertByIdAndComponents(hero.PLAYER.popup, [POPUP]);
  const seen = new Set<string>();
  for (let selected = 0; selected < 11; selected++) {
    popup.POPUP.verticalIndezes[popup.POPUP.horizontalIndex] = selected;
    rerenderEntity(world, popup);
    advance(world, 500);
    const icons = getSceneFrame(world, 33, 14, undefined, {
      instant: true,
    }).filter(
      (entry) =>
        entry.particleName?.startsWith("popup-content-") &&
        entry.terminalLayers?.some(
          (layer) => layer.char === "█" && layer.color === colors.grey
        ) &&
        entry.terminalLayers?.some(
          (layer) => layer.color === colors.black && layer.char !== "█"
        )
    );
    expect(icons).toHaveLength(1);
    for (const entry of icons) {
      const cell = projectTerminalLayers(entry.terminalLayers!);
      if (cell.foreground === colors.black && cell.background === colors.grey)
        seen.add(cell.char);
    }
  }
  for (const char of ["/", "¬", '"', "+", "»", "↑", "ô", "♦", "↕", "î", "#"])
    expect(seen).toContain(char);
});

it("keeps damage symbols red or fuchsia on the dialog background", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  act(world, "stats");
  advance(world, 2000);
  const hero = assertHero(world);
  const popup = world.assertByIdAndComponents(hero.PLAYER.popup, [POPUP]);
  const seen = new Set<string>();
  for (let selected = 0; selected < 16; selected++) {
    popup.POPUP.verticalIndezes[popup.POPUP.horizontalIndex] = selected;
    rerenderEntity(world, popup);
    advance(world, 500);
    const scene = getSceneFrame(world, 33, 14, undefined, { instant: true });
    const frame = createTerminalFrame(collectTerminalSprites(scene), 33, 14);
    for (const entry of scene.filter((entry) =>
      entry.particleName?.startsWith("popup-") &&
      ["Melee", "Magic"].includes(entry.sprite.name)
    )) {
      const cell = frame[Math.ceil(entry.y)]?.[Math.ceil(entry.x)];
      expect(cell).toMatchObject({
        char: "x",
        foreground: entry.sprite.name === "Melee" ? colors.red : colors.fuchsia,
        background: colors.black,
      });
      seen.add(entry.sprite.name);
    }
  }
  expect(seen).toEqual(new Set(["Melee", "Magic"]));
});
