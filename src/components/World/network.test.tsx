import { act, render } from "@testing-library/react";
import World from ".";
import { useWorld, WorldContext } from "../../bindings/hooks";
import { connectServer } from "../../engine/network/client";
import { createAreaWorld } from "../../testing/harness";
import { createReplica } from "../../engine/network/replica";
import { createSnapshot } from "../../engine/snapshot";
import { storeGame, loadSaveSummaries } from "../../game/saves/storage";

jest.mock("../../engine/network/client", () => ({
  ...jest.requireActual("../../engine/network/client"),
  connectServer: jest.fn(),
}));
jest.mock("../../game/saves/storage", () => ({
  ...jest.requireActual("../../game/saves/storage"),
  storeGame: jest.fn(),
  loadSaveSummaries: jest.fn().mockResolvedValue([]),
}));

it("pauses only its own server connection, avoids local game saves and returns to the local menu", () => {
  jest.mocked(loadSaveSummaries).mockResolvedValue(undefined);
  const local = createAreaWorld("|     |\n| ♀   |\n|     |");
  const replica = createReplica();
  replica.receive({
    sequence: 1,
    serverTime: 0,
    snapshot: createSnapshot(local),
  });
  const connection = {
    world: replica.world,
    move: jest.fn(),
    action: jest.fn(),
    render: jest.fn(),
    pause: jest.fn(),
    close: jest.fn(),
  };
  replica.world.metadata.network = connection;
  jest.mocked(connectServer).mockReturnValue(connection);
  let context: WorldContext;
  function Probe() {
    context = useWorld();
    return null;
  }
  const storage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };
  const view = render(
    <World createInitialWorld={() => local} persistent serverStorage={storage}>
      <Probe />
    </World>
  );
  act(() => context.joinServer!("host:3001"));
  const options = jest.mocked(connectServer).mock.calls[0][1]!;
  expect(options.storage).toBe(storage);
  act(() => {
    options.onStatus!("connected");
    options.onReady!(replica.world);
  });
  expect(context!.ecs).toBe(replica.world);
  expect(context!.paused).toBe(false);
  act(() => context.setPaused(true));
  expect(connection.pause).toHaveBeenLastCalledWith(true);
  act(() => context.saveGame());
  expect(storeGame).not.toHaveBeenCalled();
  act(() => options.onStatus!("reconnecting"));
  expect(context!.paused).toBe(true);
  act(() => options.onStatus!("connected"));
  expect(context!.paused).toBe(true);
  act(() => context.setPaused(false));
  expect(connection.pause).toHaveBeenLastCalledWith(false);
  act(() => context.openMenu());
  expect(connection.close).toHaveBeenCalledTimes(1);
  const menu = context!.ecs;
  expect(menu).not.toBe(replica.world);
  act(() => options.onReady!(replica.world));
  expect(context!.ecs).toBe(menu);
  view.unmount();
});
