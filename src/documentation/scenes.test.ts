import { createPreviewWorld } from "./scenes";
import { assertHero, trigger, advanceUntil } from "../testing/harness";
import { EQUIPPABLE } from "../engine/components/equippable";
import { ITEM } from "../engine/components/item";
import { PLAYER } from "../engine/components/player";
import { POPUP } from "../engine/components/popup";

describe("documentation game worlds", () => {
  it("equips the selected spell in the real equipment slot", () => {
    const world = createPreviewWorld("abilities", "beam");
    const hero = world.assertComponents(assertHero(world), [EQUIPPABLE]);
    const spell = world.assertByIdAndComponents(hero[EQUIPPABLE].spell!, [
      ITEM,
    ]);
    expect(spell[ITEM].spell).toBe("beam");
  });
  it("opens the real crafting dialog with the normal interaction trigger", () => {
    const world = createPreviewWorld("crafting");
    const hero = assertHero(world);
    trigger(world, "interact");
    advanceUntil(world, () => !!hero[PLAYER].popup);
    const popup = world.assertByIdAndComponents(hero[PLAYER].popup!, [POPUP]);
    expect(popup[POPUP].tabs).toContain("craft");
  });
  it("opens the real buy and sell dialog at the preview merchant", () => {
    const world = createPreviewWorld("trading"),
      hero = assertHero(world);
    trigger(world, "interact");
    advanceUntil(world, () => !!hero[PLAYER].popup);
    const popup = world.assertByIdAndComponents(hero[PLAYER].popup!, [POPUP]);
    expect(popup[POPUP].tabs).toEqual(["buy", "sell"]);
    expect(popup[POPUP].deals.length).toBeGreaterThan(0);
  });
  it("equips the interface preview with real weapon, spell and skill slots", () => {
    const world = createPreviewWorld("interface");
    const hero = world.assertComponents(assertHero(world), [EQUIPPABLE]);
    expect(hero[EQUIPPABLE].weapon).toBeDefined();
    expect(hero[EQUIPPABLE].spell).toBeDefined();
    expect(hero[EQUIPPABLE].skill).toBeDefined();
  });
});

test("feature scenes keep their viewpoint fixed when the hero moves", () => {
  const world = createPreviewWorld("movement");
  const camera = world
    .getEntities(["VIEWABLE", "POSITION"])
    .find((entity) => entity.VIEWABLE.priority === 80)!;
  const position = { ...camera.POSITION };
  assertHero(world).POSITION.x += 1;
  expect(camera.POSITION).toEqual(position);
  expect(camera.VIEWABLE.active).toBe(true);
});

test("dialogs take camera priority over the stationary scene viewpoint", () => {
  const world = createPreviewWorld("crafting");
  trigger(world, "interact");
  advanceUntil(world, () => !!assertHero(world)[PLAYER].popup);
  const active = world
    .getEntities(["VIEWABLE", "POSITION"])
    .filter((entity) => entity.VIEWABLE.active)
    .sort((left, right) => right.VIEWABLE.priority - left.VIEWABLE.priority)[0];
  expect(active.VIEWABLE.priority).toBe(90);
  expect(active.POSITION).not.toEqual({ x: 6, y: 4 });
});
