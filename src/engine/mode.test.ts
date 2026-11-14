import { isTestMode } from "./mode";
import { executeCommand } from "../game/assets/commands";
import { createHost } from "./network/host";
import { submitChat } from "./systems/popup";
import { getDialog } from "../features/chat/helpers";

jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  TEST_MODE: true,
}));

it("server authority overrides local test mode for commands and per-player UI", () => {
  const host = createHost();
  const a = host.join("a"),
    b = host.join("b");
  const world = host.world;
  const admin = world.assertByIdAndComponents(a, ["PLAYER", "STATS"]);
  const player = world.assertByIdAndComponents(b, ["PLAYER", "STATS"]);
  host.identify("a", "Alice", true);
  host.identify("b", "Bob", false);
  expect(isTestMode(world, admin)).toBe(true);
  expect(isTestMode(world, player)).toBe(false);
  world.metadata.localPlayerId = b;
  expect(isTestMode(world)).toBe(false);
  const hp = player.STATS.hp;
  expect(
    executeCommand(world, player, { handler: "stat", args: ["hp", "99"] })
  ).toBe("Commands disabled!");
  expect(player.STATS.hp).toBe(hp);
  submitChat(world, player, "/stat hp 99");
  expect(player.STATS.hp).toBe(hp);
  expect(getDialog(player)).toEqual(["Bob: /stat hp 99"]);
  submitChat(world, admin, "/stat hp 12");
  expect(admin.STATS.hp).toBe(12);
});
