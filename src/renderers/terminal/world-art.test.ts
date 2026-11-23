import { createCell } from "../../bindings/creation";
import { advance, assertHero, createAreaWorld } from "../../testing/harness";
import { colors } from "../../game/assets/colors";
import {
  path,
  grain,
  shroom,
  flower,
  flowerDrop,
  pearl,
  treeBurnt1,
  treeBurnt2,
  oakBurnt,
  palmBurnt1,
  palmBurnt2,
  desertPalmBurnt1,
  desertPalmBurnt2,
} from "../../game/assets/sprites";
import { getItemSprite } from "../../game/assets/utils";
import { addBackground } from "../../game/assets/ui";
import { getSceneFrame } from "../interface/frame";
import { collectTerminalSprites, createTerminalFrame } from "./frame";
import { projectSprite } from "./sprites";

it("keeps the shared Path reference transparent in sign text", () => {
  expect(projectSprite(path)).toEqual({ char: "░", foreground: colors.silver });
  expect(projectSprite(addBackground([path], colors.black)[0])).toEqual({
    char: "░",
    foreground: colors.silver,
    background: colors.black,
  });
});

it("uses the larger small dot for small item sprites", () => {
  for (const sprite of [grain, shroom, pearl])
    expect(projectSprite(sprite).char).toBe("∙");
});

it.each(["campfire", "fireplace"] as const)(
  "gives %s a brown background only while burning",
  (cell) => {
    const world = createAreaWorld("| ♀   |", { size: 48 });
    const hero = assertHero(world);
    const entity = createCell(
      world,
      { x: hero.POSITION.x + 1, y: hero.POSITION.y },
      cell,
      "visible"
    ).cell;
    advance(world, 700);
    const scene = getSceneFrame(world, 15, 11, undefined, { instant: true });
    const body = scene.find(
      (entry) => entry.entity === entity && /body\d+$/.test(entry.key)
    )!;
    const frame = createTerminalFrame(collectTerminalSprites(scene), 15, 11);
    const pixel = frame[Math.ceil(body.y)][Math.ceil(body.x)];
    expect(pixel.background).toBe(
      cell === "campfire" ? colors.maroon : colors.black
    );
  }
);

it("grows Flower stacks through tiny, small and large middle dots", () => {
  for (const sprite of [flower, flowerDrop]) {
    expect(projectSprite(sprite).char).toBe("·");
    expect(
      [1, 2, 3].map((amount) => projectSprite(sprite, undefined, amount).char)
    ).toEqual(["·", "∙", "•"]);
  }
  for (const variant of [undefined, "resource"] as const)
    for (const [amount, char] of [
      [1, "·"],
      [2, "∙"],
      [3, "•"],
    ] as const)
      expect(
        projectSprite(getItemSprite({ stackable: "flower", amount }, variant))
      ).toMatchObject({ char, foreground: colors.teal });
  expect(
    projectSprite(getItemSprite({ stackable: "flower", amount: 3 }, "display"))
  ).toMatchObject({ char: "·", foreground: colors.teal });
});

it("uses commas for every burnt tree and palm stump", () => {
  for (const sprite of [
    treeBurnt1,
    treeBurnt2,
    oakBurnt,
    palmBurnt1,
    palmBurnt2,
    desertPalmBurnt1,
    desertPalmBurnt2,
  ])
    expect(projectSprite(sprite)).toEqual({
      char: ",",
      foreground: colors.maroon,
    });
});

it.each([
  "stump",
  "glacier_stump",
  "husk",
  "desert_husk",
  "post",
  "root",
  "footing",
  "rubble",
  "fence_hinge",
  "palisade_hinge",
] as const)("renders harvested %s as a comma", (cell) => {
  const world = createAreaWorld("| ♀   |", { size: 48 });
  const hero = assertHero(world);
  const entity = createCell(
    world,
    { x: hero.POSITION.x + 1, y: hero.POSITION.y },
    cell,
    "visible"
  ).cell;
  advance(world, 500);
  const scene = getSceneFrame(world, 15, 11, undefined, { instant: true });
  const body = scene.find(
    (entry) => entry.entity === entity && /body\d+$/.test(entry.key)
  )!;
  const frame = createTerminalFrame(collectTerminalSprites(scene), 15, 11);
  expect(frame[Math.ceil(body.y)][Math.ceil(body.x)]).toMatchObject({
    char: ",",
    foreground:
      cell === "glacier_stump"
        ? colors.silver
        : cell === "rubble"
        ? colors.grey
        : colors.maroon,
  });
});
