import { createAreaWorld, assertHero } from "../../testing/harness";
import { createCell } from "../../bindings/creation";
import { POPUP } from "../../engine/components/popup";
import { getWarpMap } from "../../game/assets/warp";
import { tree1, tree2, sand, waterDeep, ice } from "../../game/assets/sprites";

it("uses the actual shared sprite definitions for the warp-map background", () => {
  const world = createAreaWorld("| ♀ |", { size: 64 });
  const hero = assertHero(world);
  const portal = createCell(
    world,
    { ...hero.POSITION! },
    "portal",
    "visible"
  ).cell;
  portal[POPUP]!.horizontalIndex = portal[POPUP]!.tabs.indexOf("warp");
  const { background } = getWarpMap(world, portal);
  for (const sprite of [tree1, tree2, sand, waterDeep, ice]) {
    expect(
      portal[POPUP]!.lines[portal[POPUP]!.horizontalIndex].flat()
    ).toContain(sprite);
    expect(background.flat()).toContain(sprite);
  }
});
