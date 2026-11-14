import {
  createAreaWorld,
  assertHero,
  advance,
  giveItems,
} from "../../testing/harness";
import { createSnapshot } from "../snapshot";
import { selectNetworkView } from "./interest";
import { encodeState } from "./codec";
import { initializeArea } from "../systems/initialize";
import { createReplica } from "./replica";
import { createHero } from "../systems/fate";
import { moveEntity, registerEntity } from "../systems/map";
import { openPopup } from "../systems/popup";
import { ensurePlayerInterface } from "../../bindings/interface";

it("streams nearby terrain and inventory while keeping distant initialized cells on the server", () => {
  const world = createAreaWorld("|      |\n| ♀    |\n|      |", { size: 128 });
  advance(world, 2500);
  initializeArea(world, { x: 55, y: 55 }, { x: 80, y: 80 });
  const hero = assertHero(world),
    id = world.getEntityId(hero);
  giveItems(world, world.assertComponents(hero, ["INVENTORY", "POSITION"]), [
    { weapon: "sword", material: "iron", amount: 1 },
  ]);
  const full = createSnapshot(world, true);
  const scoped = createSnapshot(
    world,
    true,
    selectNetworkView(world, id)?.entities
  );
  expect(JSON.stringify(encodeState(scoped)).length).toBeLessThan(
    JSON.stringify(encodeState(full)).length * 0.6
  );
  const replica = createReplica();
  replica.world.metadata.localPlayerId = id;
  replica.receive({
    sequence: 1,
    serverTime: world.metadata.elapsed,
    snapshot: scoped,
  });
  const actor = replica.world.assertByIdAndComponents(id, [
    "INVENTORY",
    "EQUIPPABLE",
  ]);
  expect(actor.INVENTORY.items.length).toBeGreaterThan(0);
  expect(replica.world.getEntityById(actor.EQUIPPABLE.weapon)).toBeDefined();
  expect(replica.world.metadata.gameEntity.LEVEL.initialized[60][60]).toBe(
    false
  );
  expect(world.metadata.gameEntity.LEVEL.initialized[60][60]).toBe(true);
});

it("selects independent views for distant players and includes their camera and wrapped edges", () => {
  const world = createAreaWorld("|      |\n| ♀    |\n|      |", { size: 128 });
  const first = assertHero(world),
    second = createHero(world, first);
  registerEntity(world, second);
  moveEntity(world, second, { x: 64, y: 64 });
  initializeArea(world, { x: 60, y: 60 }, { x: 68, y: 68 });
  const edge = world.createEntity();
  world.addComponentToEntity(edge, "POSITION", { x: 127, y: 1 });
  world.addComponentToEntity(edge, "LEVEL_TUTORIAL", {});
  world.cleanup();
  const a = selectNetworkView(world, world.getEntityId(first))!.entities!;
  const b = selectNetworkView(world, world.getEntityId(second))!.entities!;
  const distant = world
    .getEntities(["POSITION"])
    .find((e) => e.POSITION.x === 64 && e.POSITION.y === 63)!;
  expect(a.has(world.getEntityId(distant))).toBe(false);
  expect(b.has(world.getEntityId(distant))).toBe(true);
  expect(a.has(world.getEntityId(edge))).toBe(true);
});

it("provides the complete explored map while its native dialog is open", () => {
  const world = createAreaWorld("|      |\n| ♀    |\n|      |", { size: 128 });
  const hero = assertHero(world);
  const ui = ensurePlayerInterface(world, hero);
  const popup = world.assertByIdAndComponents(ui.use, ["POPUP"]);
  popup.POPUP.horizontalIndex = popup.POPUP.tabs.indexOf("map");
  openPopup(world, hero, popup, true);
  expect(
    selectNetworkView(world, world.getEntityId(hero))?.entities
  ).toBeUndefined();
});
