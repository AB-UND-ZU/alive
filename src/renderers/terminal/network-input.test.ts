import { openPopup } from "../../engine/systems/popup";
import { createHost } from "../../engine/network/host";
import { createReplica } from "../../engine/network/replica";
import { createSnapshot } from "../../engine/snapshot";
import { createTerminalInput } from "./input";

it("routes movement and dialog actions to the owned player without changing confirmed entities", () => {
  const host = createHost();
  host.join("first");
  const id = host.join("second");
  const replica = createReplica();
  replica.world.metadata.localPlayerId = id;
  replica.receive(host.frame("second"));
  const move = jest.fn(),
    action = jest.fn();
  replica.world.metadata.network = {
    move,
    action,
    pause: jest.fn(),
    render: jest.fn(),
  };
  const before = createSnapshot(replica.world);
  const input = createTerminalInput(replica.world);
  input.press({ name: "right" });
  input.stop();
  input.press({ name: "return" });
  expect(move.mock.calls).toEqual([[["right"]], [[]]]);
  expect(action).toHaveBeenCalledWith(
    expect.objectContaining({ kind: "chat" })
  );
  expect(createSnapshot(replica.world)).toEqual(before);
});

it("sends a pasted server name as one text batch before confirming the prompt", () => {
  const host = createHost();
  const id = host.join("name");
  host.requestUsername("name");
  for (let frame = 0; frame < 30; frame++) host.step();
  const replica = createReplica();
  replica.world.metadata.localPlayerId = id;
  replica.receive(host.frame("name"));
  const action = jest.fn();
  replica.world.metadata.network = {
    move: jest.fn(),
    action,
    pause: jest.fn(),
    render: jest.fn(),
  };
  const before = createSnapshot(replica.world);
  const input = createTerminalInput(replica.world);
  for (const char of "TerminalPlayerName")
    input.press({ name: char.toLowerCase(), sequence: char });
  input.press({ name: "return" });
  expect(action.mock.calls[0][0]).toMatchObject({
    kind: "text",
    indices: expect.any(Array),
  });
  expect(action.mock.calls[0][0].indices).toHaveLength(18);
  expect(action.mock.calls[1][0]).toMatchObject({ kind: "right" });
  expect(createSnapshot(replica.world)).toEqual(before);
  input.stop();
});

it("leaves the server locally from its connection dialog", () => {
  const host = createHost();
  const id = host.join("player");
  const source = host.world
    .getEntities(["POPUP"])
    .find((entity) => entity.POPUP.tabs.includes("server"))!;
  openPopup(host.world, host.world.getEntityById(id)!, source);
  host.step();
  const replica = createReplica();
  replica.world.metadata.localPlayerId = id;
  replica.receive(host.frame("player"));
  const action = jest.fn();
  const leave = jest.fn();
  replica.world.metadata.leaveServer = leave;
  replica.world.metadata.network = {
    move: jest.fn(),
    action,
    pause: jest.fn(),
    render: jest.fn(),
  };
  const input = createTerminalInput(replica.world);
  input.press({ name: "backspace" });
  expect(leave).toHaveBeenCalledTimes(1);
  expect(action).not.toHaveBeenCalled();
  input.stop();
});
