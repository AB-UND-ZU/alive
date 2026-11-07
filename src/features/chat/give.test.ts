import { createAreaWorld } from "../../testing/harness";
import { POSITION } from "../../engine/components/position";
import { TRACKABLE } from "../../engine/components/trackable";
import { ITEM } from "../../engine/components/item";
import { getDialog, getDrops, say, setupHero } from "./helpers";

jest.mock("../../engine/utils", () => ({
  ...jest.requireActual("../../engine/utils"),
  TEST_MODE: true,
}));

const area = `
|     |
| ♀   |
|     |
`;

const setup = () => {
  const world = createAreaWorld(area);
  return { world, hero: setupHero(world) };
};

describe("give command", () => {
  it("drops a wooden sword next to the hero", () => {
    const { world, hero } = setup();

    say(world, "/give sword");

    const drops = getDrops(world);
    expect(drops).toHaveLength(1);
    expect(drops[0].item).toMatchObject({
      weapon: "sword",
      material: "wood",
      amount: 1,
      bound: false,
    });
    expect(Math.abs(drops[0].position.x - hero[POSITION].x)).toBeLessThan(2);
    expect(Math.abs(drops[0].position.y - hero[POSITION].y)).toBeLessThan(2);
    expect(getDialog(hero)).toEqual([]);
  });

  it("drops a stack with the short command and an amount", () => {
    const { world } = setup();

    say(world, "/g arrow 5");

    expect(getDrops(world).map(({ item }) => item)).toEqual([
      expect.objectContaining({ stackable: "arrow", amount: 5 }),
    ]);
  });

  it("uses a given material and element", () => {
    const { world } = setup();

    say(world, "/give shield 1 gold fire");

    expect(getDrops(world)[0].item).toMatchObject({
      offhand: "shield",
      material: "gold",
      element: "fire",
    });
  });

  it("removes the material with default", () => {
    const { world } = setup();

    say(world, "/give wand 1 default");

    const { item } = getDrops(world)[0];
    expect(item).toMatchObject({ weapon: "wand", skill: "wand" });
    expect(item.material).toBeUndefined();
  });

  it.each([
    ["iron", { stackable: "resource", material: "iron" }],
    ["earth", { stackable: "resource", element: "earth" }],
    ["hp", { stat: "hp" }],
    ["key", { consume: "key", material: "iron" }],
    ["axe", { tool: "axe", material: "wood" }],
    ["beam", { spell: "beam", material: "wood" }],
    ["slash", { skill: "slash", material: "wood" }],
    ["ring", { accessory: "ring", material: "wood" }],
  ])("drops %s items", (name, expected) => {
    const { world } = setup();

    say(world, `/give ${name} 2`);

    expect(getDrops(world)[0].item).toMatchObject({ ...expected, amount: 2 });
  });

  it("drops a working compass", () => {
    const { world } = setup();

    say(world, "/give compass");

    const [compass] = world
      .getEntities([ITEM, TRACKABLE])
      .filter((entity) => entity[ITEM].accessory === "compass");
    expect(compass[ITEM]).toMatchObject({ material: "iron", amount: 1 });
  });

  it("drops a potion of the chosen stat", () => {
    const { world } = setup();

    say(world, "/give potion 3 iron mp");

    expect(getDrops(world)[0].item).toMatchObject({
      consume: "potion",
      material: "iron",
      stat: "mp",
      amount: 3,
    });
  });

  it.each([
    ["/give nothing", 'No item "nothing"!'],
    ["/give arrow lots", 'No number "lots"!'],
    ["/give sword 1 paper", 'No material "paper"!'],
    ["/give sword 1 iron ice", 'No element "ice"!'],
    ["/give potion 1 wood", 'No "potion" stat!'],
    ["/give potion 1 wood luck", 'No stat "luck"!'],
    ["/give", "/give <item> [num] [mat] [ele]"],
    ["/give sword 1 iron fire more", "/give <item> [num] [mat] [ele]"],
  ])("rejects %s", (command, error) => {
    const { world, hero } = setup();

    say(world, command);

    expect(getDialog(hero)).toEqual([error]);
    expect(getDrops(world)).toEqual([]);
  });
});
