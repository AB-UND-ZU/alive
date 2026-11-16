import { getSceneFrame } from "../interface/frame";
import { getSequence } from "../../engine/systems/sequence";
import { createReplica } from "../../engine/network/replica";
import { createSnapshot } from "../../engine/snapshot";
import { advance, assertHero, createAreaWorld } from "../../testing/harness";
import { getTerminalFrame } from "./screen";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createServerStorage } from "./network";

it("keeps server reconnect ownership across terminal sessions and separates host addresses", () => {
  const directory = mkdtempSync(join(tmpdir(), "alive-terminal-network-"));
  try {
    const file = join(directory, "servers.json"),
      first = createServerStorage(file);
    first.setItem(
      "alive.server:ws://host:3001/",
      JSON.stringify({ id: "a", token: "secret" })
    );
    const second = createServerStorage(file);
    expect(second.getItem("alive.server:ws://host:3001/")).toBe(
      first.getItem("alive.server:ws://host:3001/")
    );
    expect(second.getItem("alive.server:ws://other:3001/")).toBeNull();
    second.removeItem("alive.server:ws://host:3001/");
    expect(second.getItem("alive.server:ws://host:3001/")).toBeNull();
    expect(
      createServerStorage(file).getItem("alive.server:ws://host:3001/")
    ).toBeNull();
    writeFileSync(file, "corrupt");
    expect(() => createServerStorage(file)).toThrow();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

it("renders discovery prompts from network snapshots without client-only idle arguments", () => {
  const server = createAreaWorld("| P B K A ♀ |", {
    size: 48,
    legend: { P: "pot", B: "bench", K: "kettle", A: "anvil" },
  });
  advance(server, 2000);
  const replica = createReplica();
  replica.world.metadata.localPlayerId = server.getEntityId(assertHero(server));
  replica.receive({
    sequence: 1,
    serverTime: server.metadata.elapsed,
    snapshot: createSnapshot(server, true),
  });
  replica.render(33);
  for (const entity of replica.world.getEntities(["SEQUENCABLE"])) {
    const discovery = getSequence(replica.world, entity, "discovery");
    if (discovery)
      delete (discovery.args as Partial<typeof discovery.args>).idle;
  }
  const scene = getSceneFrame(replica.world, 21, 13, undefined, {
    instant: true,
  });
  expect(
    scene.some((entry) => entry.particleSequence === "discoveryIdle")
  ).toBe(true);
  expect(() => getTerminalFrame(replica.world, 80, 30)).not.toThrow();
});
