import {
  act,
  advance,
  assertHero,
  createAreaWorld,
  giveItems,
} from "../../testing/harness";
import { createPopup, openPopup } from "../../engine/systems/popup";
import { colors } from "../../game/assets/colors";
import {
  delay,
  forgeHammer,
  forgeHandle,
  popupActive,
  heartUp,
  manaUp,
  letter,
  letterRead,
  schema,
  mapDiscovery,
  portal,
  time,
  times,
} from "../../game/assets/sprites";
import {
  createSpriteButton,
  createText,
  shaded,
  underline,
} from "../../game/assets/ui";
import { getItemSprite } from "../../game/assets/utils";
import { frameToText } from "./frame";
import { getTerminalFrame, getTerminalLayout } from "./screen";
import { getSceneFrame } from "../interface/frame";
import {
  getShopper,
  openStation,
  selectRow,
} from "../../features/workstations/helpers";
import { getForgeOptions } from "../../game/balancing/forging";
import { projectSprite, projectLayers } from "./sprites";
import { createPreviewWorld } from "../../wiki/scenes";
import { moveEntity } from "../../engine/systems/map";
import { POPUP } from "../../engine/components/popup";
import { WARPABLE } from "../../engine/components/warpable";
import { POSITION } from "../../engine/components/position";
import { SPRITE } from "../../engine/components/sprite";

it("keeps popup selections inverted but uses a plain caret in Pause", () => {
  expect(projectSprite(popupActive)).toMatchObject({
    char: ">",
    foreground: colors.black,
    background: colors.lime,
  });
  const world = createAreaWorld("| ♀ |", { size: 64 });
  const hero = world.assertComponents(assertHero(world), [
    "INVENTORY",
    "POSITION",
    "PLAYER",
  ]);
  giveItems(world, hero, [{ stackable: "worm", amount: 1 }]);
  createPopup(world, hero, { tabs: ["sell"] });
  openPopup(world, hero, hero);
  advance(world, 2100);
  expect(getTerminalFrame(world, 80, 30).flat()).toContainEqual({
    char: ">",
    foreground: colors.black,
    background: colors.lime,
  });
  expect(
    getTerminalFrame(world, 80, 30, undefined, { paused: true }).flat()
  ).toContainEqual({
    char: ">",
    foreground: colors.white,
    background: colors.black,
  });
});

it("keeps the times sign when selected and shows a clock corner for brewing", () => {
  for (const sprite of [times, shaded([times], colors.green, "▄")[0]])
    expect(projectSprite(sprite).char).toBe("*");
  expect(projectSprite(time)).toMatchObject({
    char: "└",
    foreground: colors.fuchsia,
  });
});

it("uses only a full forge head and two connected handle cells", () => {
  expect(
    [forgeHammer, forgeHandle, forgeHandle]
      .map((sprite) => projectSprite(sprite).char)
      .join("")
  ).toBe("█══");
  expect(projectSprite(forgeHammer)).toMatchObject({
    foreground: colors.grey,
    background: colors.grey,
  });
});

it("selects the coin amount variant from item data without changing the web layers", () => {
  const normal = getItemSprite({ stackable: "coin", amount: 1 }).layers;
  for (const [amount, char] of [
    [1, "°"],
    [2, "○"],
    [3, "o"],
  ] as const) {
    const sprite = getItemSprite({ stackable: "coin", amount });
    expect(projectSprite(sprite).char).toBe(char);
    expect(sprite.layers).toEqual(normal);
  }
});

it("renders real sell prices with their coin variants and selected multiplication signs", () => {
  const world = createAreaWorld("| ♀ |", { size: 64 });
  const hero = world.assertComponents(assertHero(world), [
    "INVENTORY",
    "POSITION",
    "PLAYER",
  ]);
  giveItems(world, hero, [
    { stackable: "worm", amount: 1 },
    { stackable: "apple", amount: 2 },
    { stackable: "coconut", amount: 3 },
  ]);
  createPopup(world, hero, { tabs: ["sell"] });
  openPopup(world, hero, hero);
  advance(world, 2100);
  const text = frameToText(getTerminalFrame(world, 80, 30));
  expect(text).toContain("1°");
  expect(text).toContain("2°");
  expect(text).toContain("4°");
  expect(text).toContain("1*");
  expect(text).toContain("2*");
  expect(text).toContain("3*");
});

it("renders the brewing recipe's real duration as a watch corner", () => {
  expect(projectSprite(delay)).toMatchObject({
    char: "└",
    foreground: colors.yellow,
  });
  const world = createPreviewWorld("brewing");
  const hero = assertHero(world);
  const kettle = world
    .getEntities(["POPUP"])
    .find((entity) => entity.POPUP.tabs.includes("brew"))!;
  const index = kettle.POPUP.tabs.indexOf("brew");
  kettle.POPUP.horizontalIndex = index;
  kettle.POPUP.selections[index] = [0];
  openPopup(world, hero, world.assertComponents(kettle, ["POSITION", "POPUP"]));
  advance(world, 2100);
  expect(getTerminalFrame(world, 80, 30).flat()).toContainEqual(
    expect.objectContaining({ char: "└", foreground: colors.yellow })
  );
});

it("keeps the moving forge head opaque over the step item throughout its swing", () => {
  const world = createAreaWorld("|       |\n|  ♀A   |\n|       |", {
    legend: { A: "anvil" },
    size: 64,
  });
  const layout = getTerminalLayout(80, 30);
  Object.assign(world.metadata.dimensions, {
    renderedColumns: layout.width,
    visibleColumns: layout.width,
    columns: layout.width,
    renderedRows: layout.height,
  });
  const hero = getShopper(world);
  hero.STATS.hp = 10;
  hero.STATS.maxHp = 10;
  const sword = { weapon: "sword", material: "iron", amount: 1 } as const;
  const upgrade = getForgeOptions({ ...sword, bound: false, carrier: -1 }).find(
    (option) => !option.add.element
  )!;
  giveItems(world, hero, [sword, upgrade.add]);
  const anvil = openStation(world);
  selectRow(world, anvil, 0);
  act(world, "right");
  selectRow(world, anvil, 1);
  act(world, "right");
  act(world, "right");
  for (let sample = 0; sample < 8; sample++) {
    advance(world, 100);
    const head = getSceneFrame(world, layout.width, layout.height, undefined, {
      instant: true,
    }).find((entry) => entry.sprite === forgeHammer)!;
    expect(head).toBeDefined();
    const frame = getTerminalFrame(world, 80, 30);
    expect(
      frame[layout.top + Math.ceil(head.y)][layout.left + Math.ceil(head.x)]
    ).toEqual({ char: "█", foreground: colors.grey, background: colors.grey });
  }
});

it("reduces minimap terrain to an upper background and lower pixel", () => {
  const projected = projectLayers(
    [
      { char: "█", color: colors.navy },
      { char: "▐", color: colors.green },
      { char: "▄", color: colors.yellow },
    ],
    "map_pixel"
  );
  expect(projected).toEqual({
    char: "▄",
    foreground: colors.yellow,
    background: colors.green,
  });
});

it("uses a hash for letters, schematics and maps without changing their web layers", () => {
  const map = getItemSprite({ accessory: "map", material: "gold" });
  for (const sprite of [letter, letterRead, schema, map, mapDiscovery]) {
    expect(projectSprite(sprite).char).toBe("#");
    expect(sprite.layers.some((layer) => layer.char === "#")).toBe(false);
  }
  expect(projectSprite(letter).foreground).toBe(colors.grey);
  expect(projectSprite(letterRead).foreground).toBe(colors.grey);
  expect(projectSprite(schema).foreground).toBe(colors.white);
  expect(projectSprite(map).foreground).toBe(colors.yellow);
  expect(projectSprite(mapDiscovery).foreground).toBe(colors.lime);
  expect(portal.layers).toEqual([{ char: "∩", color: colors.silver }]);
  const world = createAreaWorld("| ♀S |", {
    size: 64,
    legend: { S: "menu_sign" },
  });
  const sign = world
    .getEntities([POPUP])
    .find((entity) => entity[POPUP].tabs.every((tab) => tab === "info"))!;
  const warpReferences = sign[POPUP].lines
    .flat(2)
    .filter((sprite) => ["Map", "Portal"].includes(sprite.name));
  expect(warpReferences).toHaveLength(2);
  expect(warpReferences.map((sprite) => projectSprite(sprite).char)).toEqual([
    "#",
    "∩",
  ]);
});

it("keeps the same warp glyph before and after approaching its interaction", () => {
  const world = createAreaWorld("| ♀    p |", {
    size: 64,
    legend: { p: "portal" },
  });
  const hero = world.assertComponents(assertHero(world), [POSITION]);
  const warp = world.getEntities([WARPABLE, POSITION, SPRITE])[0];
  const layout = getTerminalLayout(80, 30);
  for (const distance of [4, 1]) {
    moveEntity(world, hero, {
      x: warp[POSITION].x - distance,
      y: warp[POSITION].y,
    });
    advance(world, 600);
    const body = getSceneFrame(world, layout.width, layout.height, undefined, {
      instant: true,
    }).find((entry) => entry.entity === warp && entry.sprite === warp[SPRITE])!;
    expect(body).toBeDefined();
    for (let tick = 0; tick < 6; tick++) {
      const frame = getTerminalFrame(world, 80, 30);
      const cell =
        frame[layout.top + Math.ceil(body.y)][layout.left + Math.ceil(body.x)];
      expect(cell.char).toBe("∩");
      expect([colors.red, colors.lime, colors.yellow]).not.toContain(
        cell.background
      );
      advance(world, 150);
    }
  }
});

it("renders Slash as an at sign using the item's material color", () => {
  for (const [item, color] of [
    [{ skill: "slash", material: "wood" }, colors.maroon],
    [{ skill: "slash", material: "iron" }, colors.grey],
    [{ skill: "slash", material: "gold" }, colors.yellow],
    [{ skill: "slash", material: "diamond" }, colors.aqua],
    [{ skill: "slash", material: "ruby" }, colors.fuchsia],
  ] as const) {
    const sprite = getItemSprite(item);
    expect(projectSprite(sprite)).toMatchObject({
      char: "@",
      foreground: color,
    });
    expect(sprite.layers.some((layer) => layer.char === "@")).toBe(false);
  }
});

it("dims only an underlined black button shortcut while preserving its background", () => {
  for (const palette of ["white", "yellow", "lime"] as const) {
    const text = [
      ...createText("US", colors.black),
      ...underline(createText("E", colors.black), colors.black),
    ];
    const button = createSpriteButton(text, 5, false, false, false, palette);
    const plain = projectSprite(button[1]);
    const hotkey = projectSprite(button[3]);
    expect(plain).toMatchObject({ char: "U", foreground: colors.black });
    expect(hotkey).toMatchObject({ char: "E", foreground: colors.grey });
    expect(hotkey.background).toBe(plain.background);
    expect(button[3].layers.at(-1)).toEqual({ char: "E", color: colors.black });
  }
  const literal = createSpriteButton(createText("_", colors.black), 3)[1];
  expect(projectSprite(literal)).toMatchObject({
    char: "_",
    foreground: colors.black,
  });
  const reference = createSpriteButton(
    underline(createText("E", colors.white)),
    3
  )[1];
  expect(projectSprite(reference).foreground).toBe(colors.white);
});

it("uses a letter O for Block and lime maximum health and mana icons", () => {
  expect(
    projectSprite(getItemSprite({ skill: "block", material: "iron" }))
  ).toMatchObject({
    char: "O",
    foreground: colors.grey,
  });
  expect(projectSprite(heartUp)).toMatchObject({
    char: "♥",
    foreground: colors.lime,
  });
  expect(projectSprite(manaUp)).toMatchObject({
    char: "♦",
    foreground: colors.lime,
  });
});
