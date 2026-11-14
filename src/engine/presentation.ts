import type { TypedEntity } from "./entities";
import type { World } from "./ecs";
import type { SequenceState } from "./components/sequencable";

export const presentationNames = new Set([
  "weatherStorm",
  "smokeWind",
  "vortexDots",
  "focusCircle",
  "bubbleSplash",
  "fireBurn",
  "displayPopup",
]);

export const presentationGenerations = new WeakMap<object, number>();

export const presentations = new WeakMap<
  World,
  Map<number, Record<string, SequenceState<any>>>
>();

export const presentationTabs = [
  "info",
  "talk",
  "buy",
  "sell",
  "craft",
  "brew",
  "quest",
  "inspect",
  "stats",
  "gear",
  "equip",
  "use",
  "map",
  "class",
  "style",
  "warp",
  "chat",
  "server",
  "plant",
  "credits",
] as const;
const popupTabs = new Set<string>(presentationTabs);

export const isPresentationSequence = (
  entity: TypedEntity,
  state: SequenceState<any>
) =>
  presentationNames.has(state.name) &&
  (state.name !== "displayPopup" ||
    (!!entity.POPUP &&
      !entity.POPUP.sprite &&
      popupTabs.has(entity.POPUP.tabs[entity.POPUP.horizontalIndex])));
