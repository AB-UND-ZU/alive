import { advance, assertHero, createAreaWorld } from "../../testing/harness";
import { createSnapshot } from "../snapshot";
import { encodeState } from "./codec";
import { connectServer } from "./client";
import { createPlayerInput } from "./input";
import { getRenderedPosition, getMotion, sampleMotion } from "../motion";
import { Orientation } from "../components/orientable";

it.each([0, 50, 150, 240, 400])(
  "reconciles direction spam with %i ms RTT and a short delivery stall",
  (rtt) => {
    jest.useFakeTimers();
    const server = createAreaWorld("|          |\n|    ♀     |\n|          |", {
      size: 32,
    });
    advance(server, 2500);
    const hero = assertHero(server),
      actorId = server.getEntityId(hero);
    const input = createPlayerInput(server, actorId);
    let sequence = 0,
      time = 0,
      spike = false;
    let invalidMotion = false;
    let acknowledgments = 0,
      mismatches = 0;
    const predictions = new Map<number, { x: number; y: number }>();
    let connection: ReturnType<typeof connectServer>;
    const socket: any = {
      readyState: 1,
      bufferedAmount: 0,
      close: () => {},
      send(data: string) {
        const message = JSON.parse(data);
        if (message.type !== "input") return;
        setTimeout(() => {
          if (message.input.step)
            predictions.set(message.input.sequence, {
              ...getRenderedPosition(assertHero(connection.world)),
            });
          input.receive(message.input);
        }, rtt / 2);
      },
    };
    connection = connectServer("localhost:3001", {
      storage: { getItem: () => null, setItem: () => {} },
      socket: () => socket,
    });
    const deliver = () => {
      const movementSequence = input.movementSequence;
      const position = { ...hero.POSITION };
      const frame = {
        sequence: ++sequence,
        serverTime: server.metadata.elapsed,
        movementSequence,
        snapshot: createSnapshot(server),
        cells: server.metadata.gameEntity.LEVEL.initialized.flatMap(
          (column, x) =>
            column.flatMap((known, y) => (known ? [x * 32 + y] : []))
        ),
      };
      setTimeout(() => {
        if (predictions.has(movementSequence)) {
          acknowledgments++;
          if (
            JSON.stringify(predictions.get(movementSequence)) !==
            JSON.stringify(position)
          )
            mismatches++;
          predictions.delete(movementSequence);
        }
        socket.onmessage({
          data: JSON.stringify({
            type: "state",
            actorId,
            state: encodeState(frame),
          }),
        });
      }, rtt / 2 + (spike ? 450 : 0));
    };
    try {
      socket.onopen();
      socket.onmessage({
        data: JSON.stringify({
          type: "welcome",
          id: "player",
          token: "secret",
        }),
      });
      deliver();
      jest.advanceTimersByTime(rtt / 2);
      const directions: Orientation[] = ["right", "down", "left", "up"];
      for (let i = 0; i < 240; i++) {
        time += 1000 / 30;
        spike = time > 2800 && time < 3200;
        // Change direction every frame, including just before the actor's tick.
        connection.move([directions[Math.floor(i / 3) % 4]]);
        jest.advanceTimersByTime(1000 / 30);
        input.onUpdate();
        server.update(1000 / 30);
        deliver();
        connection.render(1000 / 30);
        const actor = assertHero(connection.world),
          motion = getMotion(actor);
        if (motion) {
          const point = sampleMotion(
            motion,
            connection.world.metadata.renderTime
          );
          invalidMotion ||=
            !Number.isFinite(point.x) || !Number.isFinite(point.y);
        }
      }
      connection.move([]);
      spike = false;
      for (let i = 0; i < 60; i++) {
        jest.advanceTimersByTime(1000 / 30);
        input.onUpdate();
        server.update(1000 / 30);
        deliver();
        connection.render(1000 / 30);
      }
      expect(invalidMotion).toBe(false);
      expect(acknowledgments).toBeGreaterThan(5);
      expect(mismatches).toBe(0);
      expect(getRenderedPosition(assertHero(connection.world))).toEqual(
        hero.POSITION
      );
    } finally {
      connection.close();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  }
);
