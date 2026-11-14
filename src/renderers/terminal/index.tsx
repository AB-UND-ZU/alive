import React from "react";
import { World } from "../../engine";
import { TerminalState } from "./frame";
import { getTerminalFrame, TerminalSession } from "./screen";
import { TerminalScreen } from "./react";

export {
  capabilities,
  getTerminalFrame,
  getTerminalLayout,
  getPauseActions,
} from "./screen";
export type { TerminalSession } from "./screen";
export { createTerminalRoot } from "./react";
export { createTerminalInput } from "./input";
export { projectSprite } from "./sprites";

export const Terminal = ({
  world,
  columns,
  rows,
  state,
  session,
}: {
  world: World;
  columns: number;
  rows: number;
  state?: TerminalState;
  session?: TerminalSession;
}) => (
  <TerminalScreen
    frame={getTerminalFrame(world, columns, rows, state, session)}
  />
);
