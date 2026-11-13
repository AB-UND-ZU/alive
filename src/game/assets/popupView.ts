import type { Entity } from "ecs";
import type { World } from "../../engine";
import type {
  PopupSequence,
  SequenceState,
} from "../../engine/components/sequencable";
import type { Sprite } from "../../engine/components/sprite";
import type { PopupSelection } from "./utils";
import { getIdentifierAndComponents } from "../../engine/utils";
import { getTab } from "../../engine/systems/popup";
import { LEVEL } from "../../engine/components/level";
import { Popup, POPUP } from "../../engine/components/popup";
import { BELONGABLE } from "../../engine/components/belongable";
import { PLAYER } from "../../engine/components/player";
import { RENDERABLE } from "../../engine/components/renderable";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { POSITION } from "../../engine/components/position";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { ACTIONABLE } from "../../engine/components/actionable";
import { STATS } from "../../engine/components/stats";
import { FORGABLE } from "../../engine/components/forgable";
import { BREWABLE } from "../../engine/components/brewable";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { FOG } from "../../engine/components/fog";
import { RESTORABLE } from "../../engine/components/restorable";
import { getSaveSummaries } from "../saves";

export type PopupView = {
  icon?: Sprite;
  content: Sprite[][];
  selection?: PopupSelection;
  details?: Sprite[][];
  overscan?: number;
  rightButton?: Sprite[];
  leftButton?: Sprite[];
  windowHeight?: number;
};

type ViewState = {
  inputs: string;
  view?: PopupView;
  settled: boolean;
  signature?: string;
};

const views = new WeakMap<SequenceState<PopupSequence>, ViewState>();

export const isPopupViewCurrent = (
  state: SequenceState<PopupSequence>,
  inputs: string
) => views.get(state)?.inputs === inputs;

export const getPopupView = (
  state: SequenceState<PopupSequence>,
  inputs: string,
  build: () => PopupView | undefined
) => {
  const previous = views.get(state);
  if (previous?.inputs === inputs) return { cached: previous, changed: false };
  const view = build();
  const signature = JSON.stringify(view);
  const changed = !previous || previous.signature !== signature;
  const cached = {
    inputs,
    view: changed ? view : previous?.view,
    signature,
    settled: previous?.settled || false,
  };
  views.set(state, cached);
  return { cached, changed };
};

// Snapshot mutable data, rather than retaining object identities or animation generations.
export const getPopupInputs = (
  world: World,
  entity: Entity,
  state: SequenceState<PopupSequence>
) => {
  const popup = entity[POPUP] as Popup;
  const tab = getTab(world, entity);
  const hero = getIdentifierAndComponents(world, "hero", [PLAYER, RENDERABLE]);
  const usesHeroItems = ![
    "map",
    "warp",
    "chat",
    "info",
    "talk",
    "credits",
    "load",
    "pack",
    "sprite",
    "layer",
  ].includes(tab);
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  const item = (id: number) => [
    id,
    world.getEntityByIdAndComponents(id, [ITEM])?.[ITEM],
  ];
  const phase = [
    "map",
    "warp",
    "chat",
    "sprite",
    "forge",
    "brew",
    "credits",
  ].includes(tab)
    ? generation
    : 0;
  return JSON.stringify([
    entity[RENDERABLE].generation,
    popup,
    state.args.instant,
    state.args.windowHeight,
    world.metadata.gameEntity[LEVEL].name,
    hero &&
      usesHeroItems && [
        world.getEntityId(hero),
        hero[RENDERABLE].generation,
        hero[STATS],
        hero[BELONGABLE],
        hero[EQUIPPABLE],
        hero[ACTIONABLE]?.toolEquipped,
        hero[SPAWNABLE]?.classKey,
        hero[SPAWNABLE]?.hairColor,
        hero[PLAYER].quickItems,
        hero[PLAYER].defeatedUnits,
        (hero[INVENTORY]?.items || []).map(item),
        Object.values<number>(hero[EQUIPPABLE] || {})
          .filter(Boolean)
          .map(item),
      ],
    entity[FORGABLE],
    entity[BREWABLE],
    (entity[INVENTORY]?.items || []).map(item),
    tab === "quest" &&
      popup.targets.map((target) => {
        const found =
          target.identifier &&
          getIdentifierAndComponents(world, target.identifier, [FOG]);
        return found
          ? [world.getEntityId(found), found[FOG].visibility]
          : undefined;
      }),
    tab === "load" && [getSaveSummaries(), entity[RESTORABLE]?.saveId],
    tab === "chat" &&
      world
        .getEntities([IDENTIFIABLE, POSITION])
        .map((target) => target[IDENTIFIABLE].name),
    tab === "map" && [hero?.[EQUIPPABLE]?.map, hero?.[POSITION]],
    phase,
  ]);
};
