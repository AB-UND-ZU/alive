import * as colors from './colors'
import { Sprite } from "../engine/components/sprite";

export const wall: Sprite = {
  layers: [{
    char: "█",
    color: colors.grey
  }]
}

export const player: Sprite = {
  layers: [{
    char: "\u010b",
    color: colors.white
  }]
}