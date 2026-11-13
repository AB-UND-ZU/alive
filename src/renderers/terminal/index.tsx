import React from "react";
import { World } from "../../engine";
import { PLAYER } from "../../engine/components/player";
import { getEntityStats } from "../../engine/systems/damage";
import {
  createText,
  getMaxCounter,
  getStatColor,
  getStatSprite,
} from "../../game/assets/ui";
import { colors } from "../../game/assets/colors";
import { Sprite } from "../../engine/components/sprite";
import { RendererCapabilities } from "../interface/types";
import { getSceneFrame, SceneState } from "../interface/frame";
import {
  createTerminalFrame,
  collectTerminalSprites,
  TerminalSprite,
} from "./frame";
import { TerminalScreen } from "./react";

export const capabilities: RendererCapabilities = {
  lighting: false,
  shadows: false,
  healthBars: false,
  stackDots: false,
  smoothMovement: false,
};

export { createTerminalRoot } from "./react";
export { createTerminalInput } from "./input";
export { projectSprite } from "./sprites";

export const getTerminalFrame = (
  world: World,
  columns: number,
  rows: number,
  state?: SceneState
) => {
  const width = Math.min(columns, 33),
    height = Math.max(1, rows - 6);
  const left = Math.floor((columns - width) / 2);
  const sprites: TerminalSprite[] = collectTerminalSprites(
    getSceneFrame(world, width, height, state)
  )
    .map((sprite) => ({
      ...sprite,
      x: Math.ceil(sprite.x),
      y: Math.ceil(sprite.y),
    }))
    .filter(
      (sprite) =>
        sprite.x >= 0 && sprite.x < width && sprite.y >= 0 && sprite.y < height
    )
    .map((sprite) => ({ ...sprite, x: sprite.x + left, y: sprite.y + 4 }));
  const line = (cells: Sprite[], y: number, x = left) => {
    cells.forEach((sprite, index) =>
      sprites.push({
        x: x + index,
        y,
        z: 1000,
        sprite,
        layers: sprite.layers,
      })
    );
  };
  const hero = world.getEntities([PLAYER])[0];
  if (hero) {
    const stats = getEntityStats(world, hero);
    (["hp", "mp", "xp"] as const).forEach((stat, y) => {
      const color = getStatColor(stat);
      const maximum = stats[getMaxCounter(stat) || stat];
      const value = Number.isFinite(maximum)
        ? `${stats[stat]}/${maximum}`
        : `${stats[stat]}`;
      const cells = [
        ...createText(`${value} `, color),
        getStatSprite(stat, "display"),
        ...createText(getStatSprite(stat).name, color),
      ];
      line(cells, y, Math.floor((columns - cells.length) / 2));
    });
  }
  line(createText("─".repeat(width), colors.silver), 3);
  line(createText("─".repeat(width), colors.silver), rows - 2);
  line(
    [
      ...createText("SPACE Spell ", colors.white),
      ...createText("^S Skill ", colors.white),
      ...createText("ENTER Act", colors.yellow),
    ],
    rows - 1
  );
  return createTerminalFrame(sprites, columns, rows);
};

export const Terminal = ({
  world,
  columns,
  rows,
  state,
}: {
  world: World;
  columns: number;
  rows: number;
  state?: SceneState;
}) => <TerminalScreen frame={getTerminalFrame(world, columns, rows, state)} />;
