import { Orientation, Center, center } from "../../engine/utils";

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