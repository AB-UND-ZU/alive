import { entities } from "../../engine";
import { POPUP } from "../../engine/components/popup";
import { POI } from "../../engine/components/poi";
import { RENDERABLE } from "../../engine/components/renderable";
import { SPRITE } from "../../engine/components/sprite";
import { getSequence } from "../../engine/systems/sequence";
import {
  closePopup,
  openPopup,
  setVerticalIndex,
} from "../../engine/systems/popup";
import { composeCharacterPixels } from "../../components/Row/characters";
import { warpBlink } from "../../game/assets/warp";
import { displayPopup } from "../../game/assets/sequences";
import { createText } from "../../game/assets/ui";
import { none } from "../../game/assets/sprites";
import {
  advance,
  assertHero,
  createAreaWorld,
  giveItems,
} from "../../testing/harness";
import { createShop } from "../workstations/helpers";

const setup = () => {
  const world = createAreaWorld("|          |\n| ♀        |\n|          |", {
    size: 32,
  });
  const hero = world.assertComponents(assertHero(world), [
    "INVENTORY",
    "EQUIPPABLE",
    "POSITION",
  ]);
  const [map] = giveItems(world, hero, [
    { accessory: "map", material: "gold", amount: 1 },
  ]);
  hero.EQUIPPABLE.map = world.getEntityId(map);
  const marker = entities.createGround(world, {
    FOG: { type: "unit", visibility: "visible" },
    POSITION: { x: hero.POSITION.x + 5, y: hero.POSITION.y },
    RENDERABLE: { generation: 0 },
    SPRITE: none,
  });
  world.addComponentToEntity(marker, POI, { sprite: createText("Z")[0] });
  const popup = createShop(world, { x: 3, y: 1 }, { tabs: ["map", "stats"] });
  openPopup(world, hero, popup, true);
  advance(world, 4000);
  const render = () =>
    displayPopup(world, popup, getSequence(world, popup, "popup")!);
  const sprites = () =>
    Object.entries(getSequence(world, popup, "popup")!.particles)
      .filter(([name]) => name.startsWith("popup-content-"))
      .map(([, id]) => world.assertByIdAndComponents(id, [SPRITE])[SPRITE]);
  const has = (char: string) =>
    sprites().some((sprite) =>
      sprite.layers.some((layer) => layer.char === char)
    );
  const pixels = () =>
    sprites().map((sprite) => composeCharacterPixels(sprite.layers));
  const changeMarker = (char: string) => {
    world.assertComponents(marker, [POI])[POI].sprite = createText(char)[0];
  };
  return { world, hero, map, popup, render, has, pixels, changeMarker };
};

it("keeps its terrain snapshot while blinking and refreshes on every zoom change or reopening", () => {
  const { world, hero, popup, render, has, pixels, changeMarker } = setup();
  const game = world.metadata.gameEntity;
  const phases = () =>
    [0, warpBlink].map((phase) => {
      game[RENDERABLE].generation = phase;
      render();
      return pixels();
    });
  expect(has("Z")).toBe(true);
  const original = phases();
  expect(original[0]).not.toEqual(original[1]);
  changeMarker("Q");
  expect(phases()).toEqual(original);
  expect(has("Q")).toBe(false);

  setVerticalIndex(world, popup, 1);
  render();
  expect(has("Q")).toBe(true);
  changeMarker("R");
  setVerticalIndex(world, popup, 0);
  render();
  expect(has("R")).toBe(true);
  expect(has("Z")).toBe(false);

  changeMarker("S");
  closePopup(world, hero, popup);
  openPopup(world, hero, popup, true);
  render();
  expect(has("S")).toBe(true);
  expect(has("R")).toBe(false);

  popup[POPUP].horizontalIndex = 1;
  render();
  changeMarker("T");
  popup[POPUP].horizontalIndex = 0;
  render();
  expect(has("T")).toBe(true);
  expect(has("S")).toBe(false);
});

it("refreshes from the player's available position and map item without world invalidation hooks", () => {
  const { world, hero, map, render, has, pixels, changeMarker } = setup();
  const original = pixels();
  changeMarker("Q");
  hero.POSITION.x += 4;
  render();
  expect(has("Q")).toBe(true);
  expect(pixels()).not.toEqual(original);
  hero.EQUIPPABLE.map = undefined;
  render();
  expect(has("Q")).toBe(false);
  changeMarker("R");
  hero.EQUIPPABLE.map = world.getEntityId(map);
  render();
  expect(has("R")).toBe(true);
});
