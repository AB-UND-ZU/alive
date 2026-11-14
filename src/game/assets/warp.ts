import { Entity } from "ecs";
import { World } from "../../engine";
import { Sprite } from "../../engine/components/sprite";
import { Popup, POPUP } from "../../engine/components/popup";
import { RENDERABLE } from "../../engine/components/renderable";
import { LEVEL, LevelName } from "../../engine/components/level";
import { canWarp } from "../../engine/systems/trigger";
import { getSelectedLevel, levelConfig } from "../levels";
import { colors } from "./colors";
import { none, blocked, shadow } from "./sprites";
import { createText, mergeSprites } from "./ui";
import { repeat } from "../math/std";
import { pixelFrame, centerSprites, overlay } from "./pixels";
import { frameWidth } from "./utils";

const warpHeight = 5;
const warpWidth = 11;
export const warpBlink = 2;

export const getWarpMap = (world: World, entity: Entity) => {
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  const showPlayer = generation % (warpBlink * 2) < warpBlink;
  const map: Sprite[][] = [
    ...(
      (entity[POPUP] as Popup).lines[entity[POPUP].horizontalIndex] || []
    ).map((line) => [
      ...line.map((sprite) => ({
        ...sprite,
        terminal: { layers: sprite.layers },
      })),
      ...repeat(none, frameWidth - 4 - line.length),
    ]),
  ];
  const selectedLevel = getSelectedLevel(world, entity);
  const level = selectedLevel && levelConfig[selectedLevel];
  const currentLevel = selectedLevel === world.metadata.gameEntity[LEVEL].name;
  const lockedLevel = !currentLevel && !canWarp(world, {}, entity);

  const warpColor = lockedLevel
    ? colors.red
    : currentLevel
    ? colors.white
    : colors.lime;

  const selection = selectedLevel
    ? getWarpSelection(
        selectedLevel,
        warpColor,
        lockedLevel || currentLevel ? "dashed" : "thick",
        lockedLevel
          ? blocked
          : showPlayer
          ? mergeSprites(shadow, createText("\u010b", warpColor)[0])
          : none
      )
    : [];
  const content = level ? overlay(map, selection) : map;

  return {
    content,
    background: map,
    selection,
    level,
    lockedLevel,
    currentLevel,
  };
};

export function getWarpSelection(
  name: LevelName,
  warpColor: string,
  style: "dashed" | "thick" = "thick",
  marker: Sprite = none
) {
  const level = levelConfig[name];
  return overlay(
    ...[
      [
        ...repeat([], level.mapOffsetY),
        ...pixelFrame(
          warpWidth,
          warpHeight,
          warpColor,
          style,
          [],
          createText(level.name, colors.black, warpColor)
        ),
      ],
      [...repeat([], level.mapOffsetY + (warpHeight - 1) / 2), [marker]],
    ].map((layer) =>
      layer.map((line) =>
        centerSprites(
          [
            ...repeat(none, level.mapOffsetX * 2),
            ...line,
            ...repeat(none, level.mapOffsetX * -2),
          ],
          frameWidth - 2
        )
      )
    )
  );
}
