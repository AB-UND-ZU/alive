import { assertHero, createAreaWorld } from "../../testing/harness";
import { STATS } from "../../engine/components/stats";
import { FOG } from "../../engine/components/fog";
import { colors } from "../../game/assets/colors";
import { getTerminalFrame } from ".";
import { frameToText } from "./frame";

const setup = () => {
  const world = createAreaWorld(`
|       |
|   ♀   |
|       |
`);
  return { world, hero: assertHero(world) };
};

it("shows current and maximum player stats without exposing an infinite XP limit", () => {
  const { world, hero } = setup();
  Object.assign(hero[STATS]!, {
    hp: 12,
    maxHp: 25,
    mp: 3,
    maxMp: 10,
    xp: 5,
    maxXp: Infinity,
  });
  const frame = getTerminalFrame(world, 80, 30);
  const lines = frameToText(frame).split("\n");
  expect(lines[0]).toContain("12/25 ♥HP");
  expect(lines[1]).toContain("3/10 ♦MP");
  expect(lines[2]).toContain("5 xXP");
  expect(frameToText(frame)).not.toContain("Infinity");
  expect(
    frame[0]
      .filter((cell) => cell.char !== " ")
      .every((cell) => cell.foreground === colors.red)
  ).toBe(true);
  expect(frame).toHaveLength(30);
  expect(frame.every((row) => row.length === 80)).toBe(true);
});

it("keeps the player hidden in fog even without lights or shadows", () => {
  const { world, hero } = setup();
  hero[FOG]!.visibility = "visible";
  expect(frameToText(getTerminalFrame(world, 33, 24))).toContain("@");
  hero[FOG]!.visibility = "fog";
  expect(frameToText(getTerminalFrame(world, 33, 24))).not.toContain("@");
});
