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
  time,
  times,
} from "../../game/assets/sprites";
import { shaded } from "../../game/assets/ui";
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

it("reduces minimap terrain to an upper pixel and a background pixel", () => {
  const projected = projectLayers(
    [
      { char: "█", color: colors.navy },
      { char: "▐", color: colors.green },
      { char: "▄", color: colors.yellow },
    ],
    "map_pixel"
  );
  expect(projected).toEqual({
    char: "▀",
    foreground: colors.green,
    background: colors.yellow,
  });
});
