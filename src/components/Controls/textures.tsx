import { Orientation, Center, center } from "../../engine/utils";

export const padOrientation: Record<Orientation | Center, [string | string[], string | string[]]> = {
  [center]: [
    [' ▄▄ ', ' \u0117\u0117 '],
    [' ▀▀ ', ' \u0118\u0118 '],
  ],
  up: [
    [' ██ ', ' \u0117\u0117 '],
    ['    ', ' \u0118\u0118 '],
  ],
  right: [
    ['  ▄▄', ' \u0117\u0117 '],
    ['  ▀▀', ' \u0118\u0118 '],
  ],
  down: [
    ['    ', ' \u0117\u0117 '],
    [' ██ ', ' \u0118\u0118 '],
  ],
  left: [
    ['▄▄  ', ' \u0117\u0117 '],
    ['▀▀  ', ' \u0118\u0118 '],
  ],
};