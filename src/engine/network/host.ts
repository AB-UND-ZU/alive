import { selectNetworkView } from "./interest";
import { entities } from "..";
import { POPUP } from "../components/popup";
import { FOG } from "../components/fog";
import { RENDERABLE } from "../components/renderable";
import { SEQUENCABLE } from "../components/sequencable";
import { SPRITE } from "../components/sprite";
import { none } from "../../game/assets/sprites";
import { createText } from "../../game/assets/ui";
import { chunked } from "../../game/math/std";
import { frameWidth, frameHeight } from "../../game/assets/utils";
import { isTestMode } from "../mode";
import {
  captureSounds,
  withSoundSource,
  soundSource,
  SoundEvent,
} from "../../game/sound/events";
import { getIdentifier } from "../utils";
import { createWorld } from "..";
import { createLevel, createSystems, preloadLevel, World } from "../ecs";
import { createSnapshot, restoreSnapshot, WorldSnapshot } from "../snapshot";
import { emptyReceivedStats, PLAYER } from "../components/player";
import { SPAWNABLE, Spawnable } from "../components/spawnable";
import { POSITION, Position } from "../components/position";
import { BELONGABLE, Belongable } from "../components/belongable";
import { LEVEL, LevelName } from "../components/level";
import { INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { EQUIPPABLE } from "../components/equippable";
import { STATS } from "../components/stats";
import { VIEWABLE } from "../components/viewable";
import { LIGHT } from "../components/light";
import { createHero } from "../systems/fate";
import {
  disposeEntity,
  registerEntity,
  updateWalkable,
  moveEntity,
} from "../systems/map";
import { rerenderEntity } from "../systems/renderer";
import { closePopup, createPopup, openPopup } from "../systems/popup";
import { restorePlayerConsumption } from "../systems/consume";
import { calculateVision } from "../systems/visibility";
import { levelConfig } from "../../game/levels";
import { createPlayerInput } from "./input";
import { ensurePlayerInterface } from "../../bindings/interface";
import { populateItems } from "../../bindings/creation";
import { ClassKey } from "../../game/balancing/classes";
import { TypedEntity } from "../entities";

type Spawn = {
  POSITION: Position;
  SPAWNABLE: Spawnable;
  BELONGABLE: Belongable;
};
type Realm = { world: World; spawn: Spawn };
export type HostedWorld = {
  elapsed: number;
  realms: { snapshot: WorldSnapshot; spawn: Spawn }[];
};
type Transfer = {
  accountId: string;
  level: LevelName;
  classKey: ClassKey;
  hairColor: string;
  resetClass: boolean;
};

/** Simulation owner. Transport callbacks enqueue intent; only step runs systems. */
export const createHost = (saved?: HostedWorld) => {
  let serverCommand: World["metadata"]["serverCommand"];
  let chooseUsername: World["metadata"]["chooseUsername"];
  let roster: NonNullable<
    World["metadata"]["gameEntity"]["LEVEL"]["serverPlayers"]
  > = [];
  let elapsed = saved?.elapsed || 0;
  let sequence = 0;
  const realms = new Map<LevelName, Realm>();
  const transfers = new Map<string, Transfer>();
  let soundId = 0;
  const sounds = new WeakMap<
    World,
    (SoundEvent & { id: number; time: number })[]
  >();
  const capture = <T>(world: World, run: () => T) =>
    captureSounds((event) => {
      let events = sounds.get(world);
      if (!events) {
        events = [];
        sounds.set(world, events);
      }
      events.push({ ...event, id: ++soundId, time: elapsed });
      if (events.length > 512) events.shift();
    }, run);
  const inputs = new Map<
    string,
    { world: World; id: number; input: ReturnType<typeof createPlayerInput> }
  >();
  const actor = (accountId: string) => {
    for (const realm of realms.values()) {
      const player = realm.world
        .getEntities([PLAYER, POSITION])
        .find((player) => player[PLAYER].accountId === accountId);
      if (player) return { ...realm, player };
    }
  };
  const bindRealm = (realm: Realm) => {
    const { world } = realm;
    world.metadata.serverCommand = (...args) => serverCommand?.(...args);
    world.metadata.chooseUsername = (...args) => chooseUsername?.(...args);
    world.metadata.gameEntity[LEVEL].serverPlayers = roster;
    world.metadata.warpPlayer = (
      id,
      level,
      classKey,
      hairColor,
      resetClass
    ) => {
      const player = world.getEntityByIdAndComponents(id, [PLAYER]);
      const accountId = player?.[PLAYER].accountId;
      if (
        accountId &&
        (isTestMode(world, player) ||
          levelConfig[world.metadata.gameEntity[LEVEL].name].warps.includes(
            level
          ))
      )
        transfers.set(accountId, {
          accountId,
          level,
          classKey,
          hairColor,
          resetClass,
        });
    };
    realms.set(world.metadata.gameEntity[LEVEL].name, realm);
  };
  for (const data of saved?.realms || []) {
    const world = restoreSnapshot(data.snapshot);
    for (const view of [...world.getEntities([POPUP])])
      if (view[POPUP].source) disposeEntity(world, view, false, false);
    world.metadata.elapsed = elapsed;
    for (const source of world.getEntities([POPUP]))
      if (source[POPUP].viewers) {
        source[POPUP].viewers = {};
        source[POPUP].active = false;
        source[POPUP].owner = undefined;
      }
    for (const player of world.getEntities([PLAYER]))
      if (player[PLAYER].accountId) {
        player[PLAYER].connected = false;
        player[PLAYER].admin = false;
        const popup = world.getEntityById(player[PLAYER].popup);
        if (popup) closePopup(world, player, popup);
        player[PLAYER].popup = undefined;
      }
    createSystems(world);
    world.metadata.initial = false;
    bindRealm({ world, spawn: data.spawn });
    preloadLevel(world);
  }
  const getRealm = (name: LevelName) => {
    const existing = realms.get(name);
    if (existing) return existing;
    const world = createWorld();
    world.metadata.elapsed = elapsed;
    createLevel(world, name, levelConfig[name].size);
    createSystems(world);
    levelConfig[name].generator(world);
    world.metadata.initial = false;
    const template = world.getEntity([PLAYER, POSITION, SPAWNABLE, BELONGABLE]);
    if (!template) throw new Error("The server world has no player spawn");
    const spawn: Spawn = {
      POSITION: { ...template[POSITION] },
      SPAWNABLE: {
        ...template[SPAWNABLE],
        position: { ...template[SPAWNABLE].position },
        viewable: { ...template[SPAWNABLE].viewable },
        quest: undefined,
      },
      BELONGABLE: { ...template[BELONGABLE] },
    };
    disposeEntity(world, template);
    world.cleanup();
    preloadLevel(world);
    const realm = { world, spawn };
    bindRealm(realm);
    return realm;
  };
  const menu = getRealm("LEVEL_MENU");
  const getInput = (accountId: string) => {
    const current = actor(accountId);
    const previous = inputs.get(accountId);
    if (!current) {
      previous?.input.release();
      return;
    }
    const { world, player } = current;
    const id = world.getEntityId(player);
    if (previous?.id === id && previous.world === world) return previous.input;
    previous?.input.release();
    ensurePlayerInterface(world, player);
    const input = createPlayerInput(world, id);
    inputs.set(accountId, { world, id, input });
    return input;
  };
  const createActor = (
    realm: Realm,
    accountId: string,
    donor?: TypedEntity<"PLAYER" | "POSITION" | "STATS">,
    transfer?: Transfer
  ) => {
    const { world, spawn } = realm;
    const position = {
      ...(getIdentifier(world, "spawn")?.POSITION || spawn[POSITION]),
    };
    const player = createHero(world, {
      ...spawn,
      POSITION: position,
      SPAWNABLE: {
        ...spawn[SPAWNABLE],
        classKey: transfer?.classKey || spawn[SPAWNABLE].classKey,
        hairColor: transfer?.hairColor || spawn[SPAWNABLE].hairColor,
        position: { ...position },
        viewable: { ...spawn[SPAWNABLE].viewable },
      },
    });
    if (donor) {
      const {
        popup,
        mount,
        interface: ui,
        interact,
        actionTriggered,
        tabTriggered,
        contentTriggered,
        offsetTriggered,
        ...persistent
      } = donor[PLAYER];
      player[PLAYER] = {
        ...persistent,
        receivedStats: { ...emptyReceivedStats },
      };
      if (!transfer?.resetClass) player[STATS] = { ...donor[STATS] };
    }
    player[PLAYER].defeatedUnits = {
      ...world.metadata.gameEntity[LEVEL].cooperativeDefeated,
    };
    player[PLAYER].accountId = accountId;
    player[PLAYER].connected = true;
    player[VIEWABLE].active = true;
    player[VIEWABLE].owner = world.getEntityId(player);
    const light = calculateVision(
      levelConfig[world.metadata.gameEntity[LEVEL].name].vision
    );
    player[LIGHT] = { ...light };
    player[SPAWNABLE].light = { ...light };
    registerEntity(world, player);
    ensurePlayerInterface(world, player);
    return player;
  };
  const join = (accountId: string) => {
    let current = actor(accountId);
    if (!current) current = { ...menu, player: createActor(menu, accountId) };
    current.player[PLAYER].connected = true;
    updateWalkable(current.world, current.player[POSITION]);
    rerenderEntity(current.world, current.player);
    release(accountId);
    inputs.delete(accountId);
    getInput(accountId);
    return current.world.getEntityId(current.player);
  };
  const release = (accountId: string) => {
    const input = inputs.get(accountId)?.input;
    input?.release();
    input?.onUpdate();
  };
  const removeActor = (
    world: World,
    player: TypedEntity<"PLAYER" | "POSITION">
  ) => {
    const popup = world.getEntityById(player[PLAYER].popup);
    if (popup) closePopup(world, player, popup);
    for (const view of [...world.getEntities([POPUP])])
      if (view[POPUP].source && view[POPUP].owner === world.getEntityId(player))
        disposeEntity(world, view, false, false);
    const ui = player[PLAYER].interface;
    if (ui)
      for (const id of [
        ui.use,
        ui.inspect,
        ...(ui.server ? [ui.server] : []),
        ...(ui.camera ? [ui.camera] : []),
        ...(ui.focus ? [ui.focus] : []),
        ...Object.values(ui.prompts || {}),
      ]) {
        const entity = world.getEntityById(id);
        if (entity) disposeEntity(world, entity);
      }
    disposeEntity(world, player);
    world.cleanup();
  };
  const transferPlayer = (transfer: Transfer) => {
    const current = actor(transfer.accountId);
    if (
      !current ||
      current.world.metadata.gameEntity[LEVEL].name === transfer.level
    )
      return;
    const donor = current.world.getEntityComponents(current.player, [
      PLAYER,
      POSITION,
      STATS,
      INVENTORY,
      EQUIPPABLE,
    ]);
    if (!donor || donor[PLAYER].ghost || donor[STATS].hp <= 0) return;
    release(transfer.accountId);
    const destination = getRealm(transfer.level);
    const player = createActor(
      destination,
      transfer.accountId,
      donor,
      transfer
    );
    const oldItems = donor[INVENTORY].items;
    const items = oldItems.map(
      (id) => current.world.assertByIdAndComponents(id, [ITEM])[ITEM]
    );
    const created = populateItems(destination.world, player, items, false);
    const remap = new Map(
      oldItems.map((id, index) => [
        id,
        destination.world.getEntityId(created[index]),
      ])
    );
    for (const [slot, id] of Object.entries(current.player[EQUIPPABLE] || {})) {
      const next = remap.get(id as number);
      if (next)
        player[EQUIPPABLE][slot as keyof typeof player.EQUIPPABLE] = next;
    }
    restorePlayerConsumption(destination.world, player);
    removeActor(current.world, current.player);
    inputs.delete(transfer.accountId);
    getInput(transfer.accountId);
  };
  const step = () => {
    for (const accountId of inputs.keys()) {
      const current = actor(accountId);
      if (current)
        capture(current.world, () =>
          withSoundSource(
            soundSource(current.world, current.player, true),
            () => getInput(accountId)?.onUpdate()
          )
        );
    }
    for (const { world } of [...realms.values()])
      capture(world, () => world.update(1000 / 30));
    elapsed += 1000 / 30;
    for (const transfer of transfers.values()) transferPlayer(transfer);
    transfers.clear();
    for (const accountId of inputs.keys()) getInput(accountId);
    sequence += 1;
  };
  return {
    configure(
      command: World["metadata"]["serverCommand"],
      name: World["metadata"]["chooseUsername"]
    ) {
      serverCommand = command;
      chooseUsername = name;
    },
    identify(accountId: string, username: string | undefined, admin: boolean) {
      const current = actor(accountId);
      if (!current) return;
      Object.assign(current.player[PLAYER], { username, admin });
      rerenderEntity(current.world, current.player);
    },
    roster(players: typeof roster) {
      roster = players;
      for (const { world } of realms.values())
        world.metadata.gameEntity[LEVEL].serverPlayers = roster;
    },
    requestUsername(accountId: string, error?: string) {
      const current = actor(accountId);
      if (!current) return;
      const { world, player } = current;
      player[PLAYER].naming = true;
      player[PLAYER].nameError = error;
      const ui = ensurePlayerInterface(world, player);
      const popup = world.assertByIdAndComponents(ui.use, [POPUP]);
      popup[POPUP].horizontalIndex = popup[POPUP].tabs.indexOf("chat");
      moveEntity(world, popup, {
        x: player[POSITION].x,
        y: player[POSITION].y + (frameHeight + 1) / 2,
      });
      moveEntity(
        world,
        world.assertByIdAndComponents(ui.inspect, [POSITION]),
        player[POSITION]
      );
      openPopup(world, player, popup, true);
      rerenderEntity(world, player);
    },
    named(accountId: string) {
      const current = actor(accountId);
      if (!current) return;
      const { world, player } = current;
      player[PLAYER].naming = false;
      player[PLAYER].nameError = undefined;
      const popup = world.getEntityById(player[PLAYER].popup);
      if (popup) closePopup(world, player, popup);
      rerenderEntity(world, player);
    },
    reply(accountId: string, lines: string[]) {
      const current = actor(accountId);
      if (!current) return;
      const { world, player } = current;
      const ui = ensurePlayerInterface(world, player);
      let output =
        ui.server &&
        world.getEntityByIdAndComponents(ui.server, [POPUP, POSITION]);
      if (!output) {
        output = entities.createUse(world, {
          [FOG]: { visibility: "visible", type: "terrain", fixed: true },
          [POSITION]: { ...player[POSITION] },
          [RENDERABLE]: { generation: 0 },
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: none,
          [VIEWABLE]: {
            active: false,
            priority: 90,
            owner: world.getEntityId(player),
          },
          [POPUP]: {
            ...world.assertByIdAndComponents(ui.use, [POPUP])[POPUP],
            viewpoint: world.getEntityId(
              entities.createViewpoint(world, {
                [POSITION]: { ...player[POSITION] },
                [RENDERABLE]: { generation: 0 },
                [VIEWABLE]: {
                  active: false,
                  priority: 90,
                  owner: world.getEntityId(player),
                },
              })
            ),
          },
        });
        ui.server = world.getEntityId(output);
        registerEntity(world, output);
        registerEntity(world, world.assertById(output[POPUP].viewpoint));
      }
      const popup = world.getEntityById(player[PLAYER].popup);
      if (popup) closePopup(world, player, popup);
      moveEntity(world, output, {
        x: player[POSITION].x,
        y: player[POSITION].y + (frameHeight + 1) / 2,
      });
      createPopup(world, output, {
        owner: world.getEntityId(player),
        tabs: ["info"],
        lines: [
          lines.flatMap((line) => chunked(createText(line), frameWidth - 2)),
        ],
      });
      openPopup(world, player, output, true);
    },
    world: menu.world,
    get serverTime() {
      return elapsed;
    },
    join,
    forget(accountId: string) {
      release(accountId);
      const current = actor(accountId);
      if (current) removeActor(current.world, current.player);
      inputs.delete(accountId);
    },
    step,
    release,
    disconnect(accountId: string) {
      release(accountId);
      const current = actor(accountId);
      if (!current) return;
      current.player[PLAYER].connected = false;
      const popup = current.world.getEntityById(current.player[PLAYER].popup);
      if (popup) closePopup(current.world, current.player, popup);
      if (current.player[PLAYER].interact)
        current.player[PLAYER].interact!.active = undefined;
      updateWalkable(current.world, current.player[POSITION]);
      rerenderEntity(current.world, current.player);
    },
    actorId: (accountId: string) => {
      const current = actor(accountId);
      return current && current.world.getEntityId(current.player);
    },
    worldFor: (accountId: string) => actor(accountId)?.world,
    receive: (accountId: string, message: unknown) =>
      getInput(accountId)?.receive(message) || false,
    frame: (accountId?: string, nearby = false) => {
      const current = accountId ? actor(accountId) : undefined;
      const world = current?.world || menu.world;
      const view =
        nearby && current
          ? selectNetworkView(world, world.getEntityId(current.player))
          : undefined;
      const snapshot = createSnapshot(world, true, view?.entities);
      return {
        sequence,
        serverTime: elapsed,
        inputSequence: accountId
          ? inputs.get(accountId)?.input.applied
          : undefined,
        realm: world.metadata.gameEntity[LEVEL].name,
        snapshot,
        cells: view?.cells,
        visibleCells: [...world.metadata.visibleCells],
        sounds: (sounds.get(world) || []).filter(
          (event) => event.time >= elapsed - 1000
        ),
      };
    },
    save: (): HostedWorld => ({
      elapsed,
      realms: [...realms.values()].map(({ world, spawn }) => {
        const snapshot = createSnapshot(world);
        for (const [, components] of snapshot.entities) {
          if (components[PLAYER])
            delete (components[PLAYER] as { admin?: boolean }).admin;
          if (components[LEVEL])
            delete (components[LEVEL] as { serverPlayers?: unknown })
              .serverPlayers;
        }
        return { snapshot, spawn };
      }),
    }),
  };
};
