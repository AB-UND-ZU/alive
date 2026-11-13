import { createAreaWorld, getHero } from "../../testing/harness";
import { FOG } from "../../engine/components/fog";
import { SPRITE } from "../../engine/components/sprite";
import { getCameraMotion, releaseCameraMotion } from "../../engine/motion";
import { getSceneFrame } from "./frame";

const area = `
|█████████|
|█       █|
|█   ♀   █|
|█       █|
|█████████|
`;

describe("Scene frame", () => {
  it("keeps the visible player and hides the player in unexplored fog", () => {
    const world = createAreaWorld(area, { size: 48 });
    const hero = getHero(world)!;
    hero[FOG]!.visibility = "visible";
    const scene = getSceneFrame(world, 15, 11);
    const player = scene.filter((entry) => entry.entity === hero);
    expect(player.length).toBeGreaterThan(0);
    expect(player.some((entry) => entry.sprite === hero[SPRITE])).toBe(true);
    hero[FOG]!.visibility = "fog";
    expect(
      getSceneFrame(world, 15, 11).filter(
        (entry) => entry.entity === hero && entry.layers.length
      )
    ).toEqual([]);
  });

  it("uses the active dialog camera without advancing game time", () => {
    const world = createAreaWorld(area, { size: 48 });
    releaseCameraMotion(world);
    expect(getCameraMotion(world)).toBeUndefined();
    const hero = getHero(world)!;
    hero[FOG]!.visibility = "visible";
    const elapsed = world.metadata.elapsed;
    const sprite = getSceneFrame(world, 15, 11).find(
      (entry) => entry.sprite === hero[SPRITE]
    );
    expect(sprite?.x).toBe(7);
    expect(sprite?.y).toBe(5);
    expect(world.metadata.elapsed).toBe(elapsed);
  });
});
