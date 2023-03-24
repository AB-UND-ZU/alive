import { Orientation, Center, center } from "./utils";

export const padOrientation: Record<Orientation | Center, [string, string]> = {
  [center]: [
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