import type {
  DiscoverySequence,
  InteractSequence,
} from "../components/sequencable";
import { captureSounds } from "../../game/sound/events";
import type { World } from "../ecs";
import { SEQUENCABLE } from "../components/sequencable";
import {
  isPresentationSequence,
  presentations,
  presentationTabs,
  presentationGenerations,
} from "../presentation";
import { disposeParticles } from "../systems/map";
import { rerenderEntity } from "../systems/renderer";
import { RENDERABLE } from "../components/renderable";
import { PARTICLE } from "../components/particle";
import { LIQUID } from "../components/liquid";
import { BURNABLE } from "../components/burnable";
import { AFFECTABLE } from "../components/affectable";
import { entities } from "..";
import { fire } from "../../game/assets/sprites";
import { particleHeight } from "../../components/Entity/utils";
import * as sequences from "../../game/assets/sequences";

const completed = new WeakSet<object>();

/** Run only audited presentation callbacks; gameplay sequences never execute here. */
export const renderPresentations = (world: World) => {
  let local = presentations.get(world);
  if (!local) presentations.set(world, (local = new Map()));
  let updated = false;
  world.metadata.presentation = true;
  try {
    for (const [id, states] of local) {
      const entity = world.getEntityById(id);
      for (const [type, state] of Object.entries(states)) {
        const playing =
          entity?.[SEQUENCABLE]?.states[
            type as keyof typeof entity.SEQUENCABLE.states
          ];
        if (
          !playing ||
          !entity ||
          !isPresentationSequence(entity, playing) ||
          (playing.name === "displayPopup" && !entity.POPUP?.active) ||
          playing.name !== state.name ||
          playing.started !== state.started ||
          playing.reference !== state.reference
        ) {
          disposeParticles(world, state);
          delete states[type];
          if (entity?.[RENDERABLE]) rerenderEntity(world, entity);
          updated = true;
        }
      }
      if (!Object.keys(states).length) local.delete(id);
    }
    for (const entity of world.getEntities([SEQUENCABLE, RENDERABLE])) {
      const id = world.getEntityId(entity);
      for (const [type, playing] of Object.entries(
        entity[SEQUENCABLE].states
      )) {
        if (!playing || !isPresentationSequence(entity, playing)) continue;
        if (
          playing.name === "displayPopup" &&
          (!entity.POPUP?.active ||
            entity.POPUP.owner !== world.metadata.localPlayerId)
        )
          continue;
        let states = local.get(id);
        if (!states) local.set(id, (states = {}));
        let state = states[type];
        if (!state)
          states[type] = state = {
            ...playing,
            args: {
              ...playing.args,
              ...(playing.name === "weatherStorm" ? { drops: [] } : {}),
            },
            particles: {},
          };
        if (playing.name === "discoveryIdle")
          state.args.force = (playing.args as DiscoverySequence).force;
        if (playing.name === "popupInteract")
          state.args.active = (playing.args as InteractSequence).active;
        state.elapsed = Math.max(
          0,
          world.metadata.renderTime - playing.started!
        );
        if (completed.has(state)) continue;
        let changed = false;
        if (state.name === "bubbleSplash") {
          const amount = Math.min(
            entity[LIQUID]?.type === "drop" ? 2 : 3,
            Math.floor(state.elapsed / 250)
          );
          if (entity[LIQUID] && entity[LIQUID].amount !== amount) {
            entity[LIQUID].amount = amount;
            changed = true;
          }
        } else if (state.name === "fireBurn") {
          if (
            entity[BURNABLE]?.burning ||
            (entity[AFFECTABLE]?.burn || 0) > 0
          ) {
            if (!state.particles.fire) {
              changed = true;
              state.particles.fire = world.getEntityId(
                entities.createParticle(world, {
                  PARTICLE: {
                    offsetX: 0,
                    offsetY: 0,
                    offsetZ: particleHeight,
                    amount: 1,
                  },
                  RENDERABLE: { generation: 0 },
                  SPRITE: fire,
                })
              );
            }
            const particle = world.assertByIdAndComponents(
              state.particles.fire,
              [PARTICLE]
            );
            const amount = [1, 2, 3, 2][Math.floor(state.elapsed / 175) % 4];
            changed ||= particle[PARTICLE].amount !== amount;
            particle[PARTICLE].amount = amount;
          } else if (state.particles.fire) {
            disposeParticles(world, state);
            state.particles = {};
            changed = true;
          }
        } else if (state.name === "displayPopup") {
          const popup = entity.POPUP!;
          const handlers: Record<
            (typeof presentationTabs)[number],
            typeof sequences.displayInfo
          > = {
            info: sequences.displayInfo,
            talk: sequences.displayInfo,
            buy: sequences.displayBuy,
            sell: sequences.displaySell,
            craft: sequences.displayCraft,
            brew: sequences.displayBrew,
            quest: sequences.displayQuest,
            inspect: sequences.displayInspect,
            stats: sequences.displayStats,
            gear: sequences.displayGear,
            equip: sequences.displayEquip,
            use: sequences.displayUse,
            map: sequences.displayMap,
            class: sequences.displayClass,
            style: sequences.displayStyle,
            warp: sequences.displayWarp,
            chat: sequences.displayChat,
            server: sequences.displayChat,
            plant: sequences.displayPlant,
            credits: sequences.displayCredits,
          };
          const render =
            handlers[
              popup.tabs[
                popup.horizontalIndex
              ] as (typeof presentationTabs)[number]
            ];
          if (render)
            changed = captureSounds(
              () => {},
              () => render(world, entity, state as never)
            ).updated;
          for (const id of Object.values(state.particles)) {
            const particle = world.getEntityByIdAndComponents(id, [PARTICLE]);
            if (particle) particle[PARTICLE].owner = popup.owner;
          }
        } else {
          const result = captureSounds(
            () => {},
            () => sequences[state.name](world, entity, state as never)
          );
          if (state.name === "popupInteract")
            for (const id of Object.values(state.particles)) {
              const particle = world.getEntityByIdAndComponents(id, [PARTICLE]);
              if (particle) particle[PARTICLE].owner = state.args.owner;
            }
          changed = result.updated;
          if (result.finished) {
            completed.add(state);
            disposeParticles(world, state);
            state.particles = {};
            changed = true;
          }
        }
        if (changed) {
          rerenderEntity(world, entity);
          updated = true;
        }
      }
    }
    world.cleanup();
  } finally {
    world.metadata.presentation = false;
  }
  if (updated) {
    const render = world.metadata.renderEntity;
    presentationGenerations.set(
      render,
      (presentationGenerations.get(render) || 0) + 1
    );
    for (const listener of Object.values(world.metadata.listeners)) listener();
  }
};
