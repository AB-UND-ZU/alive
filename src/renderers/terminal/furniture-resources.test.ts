import { assignBuilding } from "../../bindings/creation";
import { getSceneFrame } from "../interface/frame";
import { collectTerminalSprites, createTerminalFrame } from "./frame";
import { colors } from "../../game/assets/colors";
import {
  bedHeadLeft,
  bedHeadRight,
  bedCenter,
  bedEndLeft,
  bedEndRight,
  houseDruid,
  houseMage,
  houseSmith,
  houseTrader,
  houseHunter,
  houseLeft,
  houseRight,
  basementLeftInside,
  basementRightInside,
  window,
  windowInside,
  roof,
  branchRottenLeft,
  branchRottenRight,
  leavesRottenLeft,
  leavesRottenRight,
  stemRottenLeft,
  stemRottenRight,
  plank,
  wood,
} from "../../game/assets/sprites";
import { createAreaWorld, assertHero, advance } from "../../testing/harness";
import { createPopup, openPopup } from "../../engine/systems/popup";
import { craftingIngredients } from "../../game/balancing/crafting";
import { POPUP } from "../../engine/components/popup";
import { getTerminalFrame } from "./screen";
import { projectSprite, projectTerminalLayers } from "./sprites";

it("uses inward leaves, broken stems and mirrored wooden bed heads", () => {
  for (const [sprite, char] of [
    [leavesRottenLeft, "▐"],
    [leavesRottenRight, "▌"],
  ] as const)
    expect(projectSprite(sprite)).toMatchObject({
      char,
      foreground: colors.green,
    });
  for (const [sprite, char] of [
    [stemRottenRight, "╔"],
    [stemRottenLeft, "╗"],
    [bedHeadLeft, "╞"],
    [bedHeadRight, "╡"],
  ] as const)
    expect(projectSprite(sprite)).toMatchObject({
      char,
      foreground: colors.maroon,
    });
  expect(projectSprite(branchRottenLeft).char).toBe("═");
  expect(projectSprite(branchRottenRight).char).toBe("═");
  expect(bedHeadLeft.layers[0].char).toBe("╞");
  expect(bedHeadRight.layers[0].char).toBe("╡");
  expect(projectSprite(plank)).toMatchObject({
    char: "■",
    foreground: colors.maroon,
  });
  expect(plank.layers[0].char).toBe("M");
});

it("keeps the Wood dot visible on the black background of crafting rows", () => {
  expect(
    projectTerminalLayers([
      { char: "█", color: colors.black },
      ...wood.terminal!.layers,
    ])
  ).toMatchObject({
    char: "•",
    foreground: colors.maroon,
    background: colors.black,
  });
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = assertHero(world);
  createPopup(world, hero, {
    tabs: ["craft"],
    ingredients: craftingIngredients,
  });
  openPopup(world, hero, hero);
  hero[POPUP]!.verticalIndezes[0] = 1;
  advance(world, 2000);
  expect(getTerminalFrame(world, 33, 24).flat()).toContainEqual({
    char: "•",
    foreground: colors.maroon,
    background: colors.black,
  });
});

it("keeps composed house wall surfaces silver inside and outside", () => {
  const world = createAreaWorld(
    "|          |\n| ╒╦╦╕     |\n| ╠╬╬╣     |\n| ╞╪╪╡     |\n| └D┴┘     |\n|  ♀       |\n|          |",
    { size: 48, legend: { D: "wood_door" } }
  );
  const { building } = assignBuilding(world, { x: 3, y: 2 });
  advance(world, 2000);
  for (const inside of [false, true]) {
    if (inside)
      assertHero(world).LAYER!.structure = world.getEntityId(building);
    const scene = collectTerminalSprites(
      getSceneFrame(world, 21, 15, undefined, { instant: true, fogCells: true })
    );
    const center = scene.find(
      (entry) => entry.sprite.name === (inside ? "house_left" : "house")
    )!;
    expect(center).toBeDefined();
    const cell = createTerminalFrame(
      scene.filter((entry) => !entry.ui),
      21,
      15
    )[Math.ceil(center.y)][Math.ceil(center.x)];
    expect(cell.background).toBe(colors.silver);
    expect(cell.foreground).not.toBe(colors.white);
  }
});

it("uses mirrored bed feet and black role plates and windows", () => {
  expect(projectSprite(bedCenter)).toEqual({ char: "═", foreground: colors.silver });
  for (const [sprite, char] of [
    [bedEndLeft, "╒"],
    [bedEndRight, "╕"],
  ] as const)
    expect(projectSprite(sprite)).toEqual({ char, foreground: colors.maroon });
  for (const [sprite, char] of [
    [houseDruid, "+"],
    [houseMage, "♦"],
    [houseSmith, "x"],
    [houseTrader, "°"],
    [houseHunter, "»"],
    [window, "■"],
    [windowInside, "■"],
  ] as const)
    expect(projectSprite(sprite)).toEqual({
      char,
      foreground: colors.black,
      background: colors.silver,
    });
});

it("fills outward wall halves and keeps the roof quarter-shaded", () => {
  for (const [sprite, char] of [
    [houseLeft, "▌"],
    [houseRight, "▐"],
    [basementLeftInside, "▌"],
    [basementRightInside, "▐"],
  ] as const)
    expect(projectSprite(sprite)).toEqual({
      char,
      foreground: colors.maroon,
      background: colors.silver,
    });
  expect(projectSprite(roof)).toEqual({
    char: "░",
    foreground: colors.red,
    background: colors.maroon,
  });
});
