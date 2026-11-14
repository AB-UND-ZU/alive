import { createSequence } from "../systems/sequence";
import { createText } from "../../game/assets/ui";
import { createPopup, openPopup, closePopup } from "../systems/popup";
import { createHost } from "./host";
import { createReplica } from "./replica";
import { presentationNames, presentations } from "../presentation";
import { getParticles } from "../systems/sequence";
import { getEntityGeneration } from "../systems/renderer";

it("runs decorative particles locally without advancing authoritative systems or allocating server IDs", () => {
  const host = createHost();
  const id = host.join("a");
  host.identify("a", "Alice", false);
  for (let i = 0; i < 20; i++) host.step();
  const replica = createReplica();
  replica.world.metadata.localPlayerId = id;
  replica.receive(host.frame("a"));
  const world = replica.world;
  const authoritative = host.world.metadata.elapsed;
  const nextId = (world.metadata.ecs as unknown as { nextId: number }).nextId;
  for (let i = 0; i < 15; i++) replica.render(1000 / 30);
  expect(host.world.metadata.elapsed).toBe(authoritative);
  expect((world.metadata.ecs as unknown as { nextId: number }).nextId).toBe(
    nextId
  );
  expect(presentations.get(world)!.size).toBeGreaterThan(0);
  const particles = world
    .getEntities(["PARTICLE"])
    .filter((particle) => world.getEntityId(particle) < 0);
  expect(particles.length).toBeGreaterThan(0);
  for (const entity of world.getEntities(["SEQUENCABLE", "RENDERABLE"])) {
    expect(() => getEntityGeneration(world, entity)).not.toThrow();
  }
  for (const entity of world
    .getEntities(["SEQUENCABLE", "RENDERABLE"])
    .filter((entity) =>
      Object.values(entity.SEQUENCABLE.states).some(
        (state) => state && presentationNames.has(state.name)
      )
    )) {
    expect(
      getParticles(world, entity).every(
        (particle) => world.getEntityId(particle) < 0 || particle.PARTICLE
      )
    ).toBe(true);
  }
  const packetIds = new Set(
    host.frame("a").snapshot.entities.map(([entityId]) => entityId)
  );
  expect([...packetIds].every((entityId) => entityId > 0)).toBe(true);
});

it("removes local dialog particles and invalidates the rendered entity when its owner closes it", () => {
  const host = createHost();
  const actorId = host.join("a");
  host.requestUsername("a");
  for (let i = 0; i < 20; i++) host.step();
  const hero = host.world.assertByIdAndComponents(actorId, ["PLAYER"]);
  const popupId = hero.PLAYER.popup!;
  const replica = createReplica();
  replica.world.metadata.localPlayerId = actorId;
  replica.receive(host.frame("a"));
  replica.render(100);
  const popup = replica.world.assertByIdAndComponents(popupId, ["RENDERABLE"]);
  expect(getParticles(replica.world, popup).length).toBeGreaterThan(0);
  closePopup(host.world, hero, host.world.assertById(popupId));
  host.step();
  replica.receive(host.frame("a"));
  const generation = getEntityGeneration(replica.world, popup);
  replica.render(100);
  expect(getParticles(replica.world, popup)).toEqual([]);
  expect(getEntityGeneration(replica.world, popup)).toBeGreaterThan(generation);
});

it("animates burning without applying local damage, consuming mana or advancing gameplay clocks", () => {
  const host = createHost();
  const id = host.join("a");
  host.identify("a", "Alice", false);
  const hero = host.world.assertByIdAndComponents(id, ["AFFECTABLE", "STATS"]);
  hero.AFFECTABLE.burn = 10;
  createSequence(host.world, hero, "burn", "fireBurn", { generation: 0 });
  const replica = createReplica();
  replica.world.metadata.localPlayerId = id;
  replica.receive(host.frame("a"));
  const actor = replica.world.assertByIdAndComponents(id, [
    "STATS",
    "AFFECTABLE",
  ]);
  const before = {
    stats: { ...actor.STATS },
    effects: { ...actor.AFFECTABLE },
    time: replica.world.metadata.elapsed,
  };
  for (let frame = 0; frame < 100; frame++) replica.render(1000 / 30);
  expect(actor.STATS).toEqual(before.stats);
  expect(actor.AFFECTABLE).toEqual(before.effects);
  expect(replica.world.metadata.elapsed).toBe(before.time);
  expect(getParticles(replica.world, actor).length).toBeGreaterThan(0);
});

it("renders fresh menu weather with complete initial arguments and leaves its source unchanged", () => {
  const host = createHost();
  const id = host.join("weather");
  host.identify("weather", "Alice", false);
  const replica = createReplica();
  replica.world.metadata.localPlayerId = id;
  replica.receive(host.frame("weather"));
  const weather = replica.world
    .getEntities(["SEQUENCABLE"])
    .find((entity) => entity.SEQUENCABLE.states.weather)!;
  const initial = weather.SEQUENCABLE.states.weather!.args;
  for (let i = 0; i < 20; i++) {
    host.step();
    replica.receive(host.frame("weather"));
    replica.render(1000 / 30);
  }
  expect(initial.drops).toEqual([]);
  expect(
    replica.world
      .getEntities(["PARTICLE"])
      .filter((entity) => replica.world.getEntityId(entity) < 0).length
  ).toBeGreaterThan(0);
});

it("reveals complete dialog content without invalidating its own authoritative input generation", () => {
  const host = createHost();
  const id = host.join("dialog");
  host.identify("dialog", "Alice", false);
  const world = host.world;
  const player = world.assertByIdAndComponents(id, ["PLAYER"]);
  const source = world
    .getEntities(["POPUP"])
    .find((entity) => entity.POPUP.tabs.includes("info"))!;
  createPopup(world, source, {
    tabs: ["info"],
    lines: [[createText("VISIBLE CONTENT")]],
  });
  openPopup(world, player, source);
  const popupId = player.PLAYER.popup!;
  const replica = createReplica();
  replica.world.metadata.localPlayerId = id;
  for (let i = 0; i < 180; i++) {
    host.step();
    if (i % 3 === 0) replica.receive(host.frame("dialog"));
    replica.render(1000 / 30);
  }
  const popup = replica.world.assertByIdAndComponents(popupId, ["RENDERABLE"]);
  const state = presentations.get(replica.world)!.get(popupId)!.popup;
  const text = Array.from(
    { length: 15 },
    (_, column) =>
      replica.world
        .assertById(state.particles[`popup-content-0-${column}`])
        .SPRITE!.layers.slice(-1)[0].char
  ).join("");
  expect(text.trim()).toBe("VISIBLE CONTENT");
  const generation = popup.RENDERABLE.generation;
  replica.render(16);
  expect(popup.RENDERABLE.generation).toBe(generation);
  expect(state.args.contentIndex).toBeGreaterThan(20);
});
