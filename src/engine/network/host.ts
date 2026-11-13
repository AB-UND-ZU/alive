import { ensurePlayerInterface } from "../../bindings/interface";
import { createWorld } from "..";
import { createLevel, createSystems, preloadLevel } from "../ecs";
import { createSnapshot, restoreSnapshot, WorldSnapshot } from "../snapshot";
import { PLAYER } from "../components/player";
import { SPAWNABLE } from "../components/spawnable";
import { POSITION } from "../components/position";
import { createHero } from "../systems/fate";
import { registerEntity } from "../systems/map";
import { levelConfig } from "../../game/levels";
import { createPlayerInput } from "./input";

export type HostedWorld = { snapshot: WorldSnapshot; elapsed: number };

/** Simulation owner. Transport callbacks enqueue intent; only step runs systems. */
export const createHost = (saved?: HostedWorld) => {
  const world = saved ? restoreSnapshot(saved.snapshot) : createWorld();
  if (saved) world.metadata.elapsed = saved.elapsed;
  else createLevel(world, "LEVEL_MENU", levelConfig.LEVEL_MENU.size);
  createSystems(world);
  if (!saved) levelConfig.LEVEL_MENU.generator(world);
  world.metadata.initial = false;
  preloadLevel(world);
  let sequence = 0;
  const inputs = new Map<
    string,
    { id: number; input: ReturnType<typeof createPlayerInput> }
  >();
  const actor = (accountId: string) =>
    world
      .getEntities([PLAYER, POSITION])
      .find((player) => player[PLAYER].accountId === accountId);
  const getInput = (accountId: string) => {
    const player = actor(accountId);
    const previous = inputs.get(accountId);
    if (!player) {
      previous?.input.release();
      return undefined;
    }
    const id = world.getEntityId(player);
    if (previous?.id === id) return previous.input;
    previous?.input.release();
    ensurePlayerInterface(world, player);
    const input = createPlayerInput(world, id);
    inputs.set(accountId, { id, input });
    return input;
  };
  const join = (accountId: string) => {
    let player = actor(accountId);
    if (!player) {
      const candidates = world.getEntities([PLAYER, SPAWNABLE, POSITION]);
      const available = candidates.find(
        (candidate) => !candidate[PLAYER].accountId
      );
      const template = available || candidates[0];
      if (!template) throw new Error("The server world has no player spawn");
      player =
        available ||
        createHero(world, {
          ...template,
          PLAYER: undefined,
          SOUL: undefined,
          SPAWNABLE: {
            ...template[SPAWNABLE],
            position: { ...template[SPAWNABLE].position },
            viewable: { ...template[SPAWNABLE].viewable },
            quest: undefined,
          },
        });
      player[PLAYER].accountId = accountId;
      registerEntity(world, player);
    }
    ensurePlayerInterface(world, player);
    getInput(accountId);
    return world.getEntityId(player);
  };
  const release = (accountId: string) => {
    const input = inputs.get(accountId)?.input;
    input?.release();
    input?.onUpdate();
  };
  const step = () => {
    for (const accountId of inputs.keys()) getInput(accountId)?.onUpdate();
    world.update(1000 / 30);
    sequence += 1;
  };
  return {
    world,
    join,
    forget(accountId: string) {
      release(accountId);
      const player = actor(accountId);
      if (player) player[PLAYER].accountId = undefined;
      inputs.delete(accountId);
    },
    step,
    release,
    actorId: (accountId: string) => {
      const player = actor(accountId);
      return player && world.getEntityId(player);
    },
    receive: (accountId: string, message: unknown) =>
      getInput(accountId)?.receive(message) || false,
    frame: () => ({
      sequence,
      serverTime: world.metadata.elapsed,
      snapshot: createSnapshot(world),
    }),
    save: (): HostedWorld => ({
      snapshot: createSnapshot(world),
      elapsed: world.metadata.elapsed,
    }),
  };
};
