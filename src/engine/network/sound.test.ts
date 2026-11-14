import { createSoundPlayer } from "./sound";
import { createAreaWorld, assertHero } from "../../testing/harness";
import { createSnapshot } from "../snapshot";
import { StateFrame } from "./replica";
import { createHost } from "./host";
import { captureSounds, withSoundSource } from "../../game/sound/events";

it("plays fresh nearby sounds once, isolates private UI and discards stale or paused history", () => {
  const world = createAreaWorld("|        |\n| ♀      |\n|        |", {
    size: 32,
  });
  const id = world.getEntityId(assertHero(world));
  world.metadata.localPlayerId = id;
  const emit = jest.fn(),
    sounds = createSoundPlayer(emit);
  const frame: StateFrame = {
    sequence: 1,
    serverTime: 1000,
    snapshot: createSnapshot(world),
    sounds: [],
  };
  sounds.receive(world, frame);
  const event = {
    id: 1,
    time: 1000,
    preset: "move" as const,
    options: {},
    source: { position: { x: 2, y: 1 } },
  };
  frame.sounds = [event];
  sounds.receive(world, frame);
  sounds.receive(world, frame);
  expect(emit).toHaveBeenCalledTimes(1);
  expect(emit).toHaveBeenCalledWith(
    "move",
    expect.objectContaining({ proximity: 0.64 })
  );
  frame.sounds = [
    { ...event, id: 2, source: { owner: id + 1 } },
    { ...event, id: 3, time: 0 },
    { ...event, id: 4, source: { position: { x: 17, y: 17 } } },
  ];
  sounds.receive(world, frame);
  expect(emit).toHaveBeenCalledTimes(1);
  frame.sounds = [{ ...event, id: 5 }];
  sounds.receive(world, frame, true);
  sounds.receive(world, frame);
  expect(emit).toHaveBeenCalledTimes(1);
  sounds.reset();
  frame.sounds = [{ ...event, id: 6 }];
  sounds.receive(world, frame);
  expect(emit).toHaveBeenCalledTimes(1);
});

it("captures native sound calls without synthesis and restores scopes after failure", () => {
  const { play } =
    jest.requireActual<typeof import("../../game/sound")>("../../game/sound");
  const events: unknown[] = [];
  expect(() =>
    captureSounds(
      (event) => events.push(event),
      () =>
        withSoundSource({ owner: 42 }, () => {
          play("open");
          throw Error("stop");
        })
    )
  ).toThrow("stop");
  captureSounds(
    (event) => events.push(event),
    () => play("close")
  );
  expect(events).toEqual([
    expect.objectContaining({ preset: "open", source: { owner: 42 } }),
    expect.objectContaining({ preset: "close", source: undefined }),
  ]);
});

it("transmits native movement and private dialog sounds from the authoritative simulation", () => {
  const host = createHost();
  const id = host.join("first");
  host.join("second");
  host.receive("first", { sequence: 0, move: ["right"] });
  for (let frame = 0; frame < 20; frame++) host.step();
  expect(host.frame("first").sounds).toContainEqual(
    expect.objectContaining({
      preset: "move",
      source: expect.objectContaining({ entity: id }),
    })
  );
  host.receive("first", { sequence: 1, action: { kind: "gear" } });
  for (let frame = 0; frame < 20; frame++) host.step();
  expect(host.frame("second").sounds).toContainEqual(
    expect.objectContaining({
      preset: "open",
      source: expect.objectContaining({ owner: id }),
    })
  );
});
