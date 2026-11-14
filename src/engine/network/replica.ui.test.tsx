import { act, screen } from "@testing-library/react";
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
