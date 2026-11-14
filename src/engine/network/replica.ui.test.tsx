/* eslint-disable testing-library/no-node-access, testing-library/no-container -- native controls use invisible sprite hit areas */
import { act, screen } from "@testing-library/react";
import Controls from "../../components/Controls";
import { createPopup, openPopup } from "../systems/popup";
import { getSequence } from "../systems/sequence";
import { createText } from "../../game/assets/ui";
import { useHero } from "../../bindings/hooks";
import { renderHud } from "../../components/Controls/testing";
import {
  createAreaWorld,
  assertHero,
  advance,
  walk,
} from "../../testing/harness";
import { createSnapshot } from "../snapshot";
import { createReplica } from "./replica";

it("updates the selected actor view from ordinary confirmed frames without resetting the world", () => {
  const server = createAreaWorld("|        |\n| ♀      |\n|        |");
  advance(server, 2500);
  const replica = createReplica();
  replica.world.metadata.localPlayerId = server.getEntityId(assertHero(server));
  const receive = (sequence: number) =>
    replica.receive({
      sequence,
      serverTime: server.metadata.elapsed,
      snapshot: createSnapshot(server),
    });
  receive(0);
  function Position() {
    const hero = useHero();
    return (
      <output aria-label="Position">
        {hero?.POSITION.x},{hero?.POSITION.y}
      </output>
    );
  }
  renderHud(replica.world, <Position />);
  expect(screen.getByLabelText("Position")).toHaveTextContent("1,1");
  walk(server, "right", 1);
  act(() => {
    receive(1);
  });
  expect(screen.getByLabelText("Position")).toHaveTextContent("2,1");
});

it("uses the locally rendered dialog layout for content, scrollbar and button hit areas", () => {
  const server = createAreaWorld("|  ♀  ¾  |");
  advance(server, 2500);
  const player = assertHero(server);
  const sign = server
    .getEntities(["POPUP"])
    .find((entity) => entity.POPUP.tabs.includes("credits"))!;
  createPopup(server, sign, {
    tabs: ["info"],
    lines: [Array.from({ length: 40 }, (_, i) => createText(`Row ${i}`))],
  });
  openPopup(server, player, sign, true);
  const replica = createReplica();
  replica.world.metadata.localPlayerId = server.getEntityId(player);
  replica.receive({
    sequence: 1,
    serverTime: server.metadata.elapsed,
    snapshot: createSnapshot(server, true),
  });
  const view = renderHud(replica.world, <Controls />);
  // eslint-disable-next-line testing-library/no-unnecessary-act -- advances ECS presentation and notifies React subscribers
  act(() => replica.render(33));
  const popup = replica.world.assertById(player.PLAYER!.popup!);
  expect(getSequence(replica.world, popup, "popup")!.args.windowHeight).toBe(
    11
  );
  expect(
    getSequence(replica.world, popup, "popup")!.args.scrollMax
  ).toBeGreaterThan(0);
  expect(
    view.container.querySelector(".Controls")!.getAttribute("style")
  ).toContain("--popup-height: 11");
  expect(view.container.querySelector("#scroll")).toBeInTheDocument();
  expect(view.container.querySelector("#content")).toHaveAttribute(
    "data-rows",
    "9"
  );
  expect(popup.SEQUENCABLE!.states.popup!.args.windowHeight).toBe(0);
});
