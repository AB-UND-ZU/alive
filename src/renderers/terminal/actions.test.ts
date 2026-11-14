import { getTerminalFrame } from "./screen";
import { frameToText } from "./frame";
import { setupTools } from "../../features/tools/helpers";
import { act, advanceUntil, GivenItem } from "../../testing/harness";
import { CONDITIONABLE } from "../../engine/components/conditionable";

it.each([
  [[], "STOW"],
  [[{ weapon: "sword", material: "wood", amount: 1 }], "SWORD"],
] as [GivenItem[], string][])(
  "shows the weapon action while an axe is active",
  (weapon, label) => {
    const { world, hero } = setupTools("| ♀#  |", [
      { tool: "axe", material: "wood", amount: 1 },
      ...weapon,
    ]);
    expect(frameToText(getTerminalFrame(world, 80, 30))).toContain("AXE");
    act(world, "skill");
    advanceUntil(world, () => !!hero[CONDITIONABLE].axe);
    const frame = frameToText(getTerminalFrame(world, 80, 30));
    expect(frame).toContain(label);
    expect(frame).not.toContain("AXE");
  }
);

it.each([
  ["pickaxe", "MINE"],
  ["shovel", "DIG"],
  ["hammer", "BUILD"],
] as const)("labels the %s tool with its action", (tool, label) => {
  const { world } = setupTools("| ♀   |", [
    { tool, material: "wood", amount: 1 },
  ]);
  expect(frameToText(getTerminalFrame(world, 80, 30))).toContain(label);
});
