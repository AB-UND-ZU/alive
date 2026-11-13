import type { WorldContext } from "../renderers/interface/hooks";
import type { World } from "../engine";

export const createWorldContext = (
  ecs: World,
  overrides: Partial<WorldContext> = {}
): WorldContext => ({
  ecs,
  initial: false,
  setInitial: () => {},
  suspended: false,
  setSuspended: () => {},
  paused: false,
  setPaused: () => {},
  flipped: false,
  setFlipped: () => {},
  saveGame: () => {},
  openMenu: () => {},
  ...overrides,
});
