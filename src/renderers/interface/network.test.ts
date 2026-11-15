import { createHost } from "../../engine/network/host";
import { createReplica } from "../../engine/network/replica";
import { createFrameClock } from "./clock";
import { getSceneFrame } from "./frame";
import { getTerminalFrame } from "../terminal/screen";
import { frameToText } from "../terminal/frame";
import { moveEntity } from "../../engine/systems/map";
import { createPopup, openPopup } from "../../engine/systems/popup";
import { createText } from "../../game/assets/ui";

it("uses the selected character's camera, HUD and private dialog in shared scene frames", () => {
  const host = createHost();
  host.join("first");
  const id = host.join("second");
  host.identify("second", "Second", true);
  const world = host.world;
  const first = world.getEntityById(host.actorId("first"))!;
  const second = world.getEntityById(id)!;
  moveEntity(world, first, { x: 0, y: 0 });
  moveEntity(world, second, { x: 20, y: 20 });
  second.STATS!.hp = second.STATS!.maxHp = 17;
  const replica = createReplica();
  replica.world.metadata.localPlayerId = id;
  replica.receive(host.frame("second"));
  replica.world.metadata.network = {
    move: jest.fn(),
    action: jest.fn(),
    pause: jest.fn(),
    render: replica.render,
  };
  createFrameClock(replica.world).advance(300);
  const actor = replica.world.getEntityById(id)!;
  const scene = getSceneFrame(replica.world, 33, 13, undefined, {
    instant: true,
    fogCells: true,
  });
  expect(
    scene.some(
      (entry) => entry.entity === actor && entry.x >= 0 && entry.x < 33
    )
  ).toBe(true);
  expect(frameToText(getTerminalFrame(replica.world, 80, 30))).toContain(
    "17/17"
  );
  const source = world
    .getEntities(["POPUP"])
    .find((entity) => entity.POPUP.tabs.includes("info"))!;
  createPopup(world, source, {
    tabs: ["info"],
    lines: [[createText("Private second")]],
  });
  openPopup(world, second, source);
  for (let frame = 0; frame < 60; frame++) host.step();
  replica.receive(host.frame("second"));
  replica.render(300);
  expect(frameToText(getTerminalFrame(replica.world, 80, 30))).toContain(
    "Private second"
  );
});
