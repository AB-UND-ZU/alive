import { Direction } from "./entities";

export const padDirections: Record<Direction | 'none', [string, string]> = {
  none: [
    ' ▄▄ ',
    ' ▀▀ '
  ],
  up: [
    ' ██ ',
    ' └┘ '
  ],
  right: [
    ' ┌▄▄',
    ' └▀▀'
  ],
  down: [
    ' ┌┐ ',
    ' ██ '
  ],
  left: [
    '▄▄┐ ',
    '▀▀┘ '
  ],
};