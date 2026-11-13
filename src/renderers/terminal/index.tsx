import React from "react";
import { World } from "../../engine";
import { TypedEntity } from "../../engine/entities";
import { POPUP } from "../../engine/components/popup";
import { getSequence } from "../../engine/systems/sequence";
import { popupTitles } from "../../engine/systems/popup";
import { PLAYER } from "../../engine/components/player";
import { LEVEL } from "../../engine/components/level";
import { INVENTORY } from "../../engine/components/inventory";
import { POSITION } from "../../engine/components/position";
import { ACTIONABLE } from "../../engine/components/actionable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { ITEM } from "../../engine/components/item";
import { ORIENTABLE } from "../../engine/components/orientable";
import { SPRITE, Sprite } from "../../engine/components/sprite";
import { getEntityStats } from "../../engine/systems/damage";
import { castableSpell, castableSkill } from "../../engine/systems/action";
import { canCast } from "../../engine/systems/magic";
import { isInteractable } from "../../engine/systems/freeze";
import { canSave } from "../../game/saves";
import {
  createTab,
  createButton,
  createSpriteButton,
  buttonPalettes,
  createDialog,
  createProgress,
  createText,
  addBackground,
} from "../../game/assets/ui";
import { centerSprites } from "../../game/assets/pixels";
import {
  backdrop,
  none,
  pauseInvert,
  pauseInvertPressed,
} from "../../game/assets/sprites";
import { getItemSprite } from "../../game/assets/utils";
import { colors } from "../../game/assets/colors";
import { repeat } from "../../game/math/std";
import { getActionActivations } from "../interface/actions";
import { RendererCapabilities } from "../interface/types";
import { getSceneFrame } from "../interface/frame";
import {
  createTerminalFrame,
  collectTerminalSprites,
  TerminalSprite,
  TerminalState,
  shakeTerminalFrame,
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

export type TerminalSession = {
  paused?: boolean;
  suspended?: boolean;
  saveName?: string;
  selection?: number;
  failed?: boolean;
};

export const getTerminalLayout = (columns: number, rows: number) => {
  const width = Math.min(columns, 65);
  const height = Math.min(26, Math.max(1, rows - 8));
  return {
    width,
    height,
    left: Math.floor((columns - width) / 2),
    top: 4 + Math.floor((rows - 8 - height) / 2),
  };
};

export const getPauseActions = (world: World) => [
  { name: "RESUME", palette: "lime" as const, disabled: false },
  ...(world.metadata.gameEntity[LEVEL].name === "LEVEL_MENU"
    ? []
    : [
        { name: "MENU", palette: "red" as const, disabled: false },
        { name: "SAVE", palette: "white" as const, disabled: !canSave(world) },
      ]),
];

export const getTerminalFrame = (
  world: World,
  columns: number,
  rows: number,
  state?: TerminalState,
  session: TerminalSession = {}
) => {
  const { width, height, left, top } = getTerminalLayout(columns, rows);
  const hero = world.getEntities([PLAYER])[0];
  let scene = getSceneFrame(world, width, height, state, { instant: true });
  const popup = world.getEntityByIdAndComponents(hero?.[PLAYER].popup, [POPUP]);
  const sequence = popup && getSequence(world, popup, "popup");
  if (popup && sequence) {
    const tabParticle = world.getEntityById(sequence.particles["popup-tab-1"]);
    const anchor =
      tabParticle && scene.find((entry) => entry.particle === tabParticle);
    if (anchor) {
      const tabParticles = new Set(
        Object.entries(sequence.particles)
          .filter(([name]) => name.startsWith("popup-tab-"))
          .map(([, id]) => world.getEntityById(id))
      );
      const closeParticles = new Set(
        Object.entries(sequence.particles)
          .filter(([name]) => name.startsWith("popup-close-"))
          .map(([, id]) => world.getEntityById(id))
      );
      const index = popup[POPUP].horizontalIndex;
      const tabs = sequence.args.instant
        ? [popup[POPUP].tabs[index]]
        : popup[POPUP].tabs;
      const cells = tabs.flatMap((tab, tabIndex) => {
        const title = `[${popupTitles[tab]}]`;
        return [
          ...(tabIndex ? createText(" ", colors.white, colors.black) : []),
          ...createTab(
            title,
            title.length,
            sequence.args.instant || tabIndex === index,
            sequence.args.instant
          ),
        ];
      });
      const start = Math.max(
        1,
        Math.min(anchor.x - 1, width - cells.length - closeParticles.size - 1)
      );
      const close = scene.filter(
        (entry) => entry.particle && closeParticles.has(entry.particle)
      );
      const closeLeft = Math.min(...close.map((entry) => entry.x));
      const shift = Math.max(0, start + cells.length - closeLeft);
      scene = scene.filter(
        (entry) => !entry.particle || !tabParticles.has(entry.particle)
      );
      for (const entry of close) entry.x += shift;
      scene.push(
        ...cells.map((sprite, offset) => ({
          ...anchor,
          key: `${anchor.key}:tab${offset}`,
          particle: undefined,
          x: start + offset,
          sprite,
          layers: sprite.layers,
        }))
      );
    }
  }
  const sprites: TerminalSprite[] = collectTerminalSprites(scene)
    .map((sprite) => ({
      ...sprite,
      x: Math.ceil(sprite.x),
      y: Math.ceil(sprite.y),
    }))
    .filter(
      (sprite) =>
        sprite.x >= 0 && sprite.x < width && sprite.y >= 0 && sprite.y < height
    )
    .map((sprite) => ({ ...sprite, x: sprite.x + left, y: sprite.y + top }));
  const line = (
    cells: Sprite[],
    y: number,
    x = Math.floor((columns - cells.length) / 2),
    z = 1000
  ) => {
    cells.forEach((sprite, index) =>
      sprites.push({ x: x + index, y, z, sprite, layers: sprite.layers })
    );
  };
  if (hero) {
    const stats = getEntityStats(world, hero);
    line(createProgress(stats, "hp", 13, false), 0);
    line(createProgress(stats, "mp", 13), 1);
    line(
      [
        ...createSpriteButton(
          [session.paused ? pauseInvertPressed : pauseInvert],
          3,
          false,
          !!session.paused
        ),
        ...createProgress(stats, "xp", 13),
        ...createButton("USE", 5, !!session.paused, false, false, "yellow"),
      ],
      2
    );
    const action = (slot: "spell" | "skill" | "tool", fallback: string) => {
      const entity = world.getEntityByIdAndComponents(
        hero[ACTIONABLE]?.[slot],
        [ITEM, SPRITE]
      );
      const available =
        !!entity &&
        !!hero[INVENTORY] &&
        !!hero[POSITION] &&
        isInteractable(world, hero) &&
        (slot === "spell"
          ? canCast(world, hero, entity) &&
            castableSpell(world, hero as TypedEntity<"INVENTORY">, entity)
          : castableSkill(
              world,
              hero as TypedEntity<"INVENTORY" | "POSITION">,
              entity
            ));
      return {
        button: createButton(
          entity?.[SPRITE].name.toUpperCase() || fallback,
          7,
          !available || !!session.paused,
          false,
          false,
          entity ? "silver" : "white"
        ),
        activation: centerSprites(
          entity
            ? getActionActivations(
                world,
                hero as TypedEntity,
                entity[ITEM],
                slot !== "spell"
              )
            : [],
          7
        ),
      };
    };
    const skill = action(
      hero[ACTIONABLE]?.toolEquipped || !hero[EQUIPPABLE]?.skill
        ? "tool"
        : "skill",
      "^S"
    );
    const spell = action("spell", "SPACE");
    const compass = world.getEntityByIdAndComponents(
      hero[EQUIPPABLE]?.compass,
      [ITEM]
    );
    const equipment = compass
      ? [
          getItemSprite(compass[ITEM], "display", compass[ORIENTABLE]?.facing),
          ...createText("Compass", colors.grey),
        ]
      : repeat(none, 8);
    line([...skill.button, ...spell.button, none, ...equipment], rows - 3);
    line(
      [...skill.activation, ...spell.activation, ...repeat(none, 9)],
      rows - 2
    );
  }
  line(createText("─".repeat(columns), colors.silver), 3, 0);
  line(createText("─".repeat(columns), colors.silver), rows - 4, 0);
  // The game keeps its own maximum viewport inside the full terminal chrome.
  for (let y = top; y < top + height; y++) {
    line(createText("│", colors.silver), y, left);
    line(createText("│", colors.silver), y, left + width - 1);
  }
  if (top > 4) {
    line(
      createText("┌" + "─".repeat(width - 2) + "┐", colors.silver),
      top - 1,
      left
    );
    line(
      createText("└" + "─".repeat(width - 2) + "┘", colors.silver),
      top + height,
      left
    );
  }
  if (session.paused || session.suspended) {
    for (let y = top; y < top + height; y++)
      line(repeat(backdrop, width - 2), y, left + 1, 2000);
    let overlay: Sprite[][];
    if (session.suspended) overlay = [createDialog("Loading map...")];
    else {
      overlay = [
        createText("█▀▄ █▀▄ █ █ ▄▀▀ ▄▀▀"),
        createText("█▄█ █▄█ █ █ █▄▄ █▄▄"),
        createText("█   █ █ █▄▀ ▄▄▀ █▄▄"),
        [],
      ];
      const actions = getPauseActions(world);
      actions.forEach((action, index) => {
        if (index) overlay.push([]);
        const selected = (session.selection || 0) === index && !action.disabled;
        overlay.push(
          createSpriteButton(
            createText(
              action.name,
              selected ? colors.white : buttonPalettes[action.palette].text
            ),
            8,
            action.disabled,
            selected,
            false,
            action.palette
          )
        );
      });
      if (actions.length > 1)
        overlay.push(
          createText(
            session.failed ? "Failed!" : session.saveName || "",
            session.failed ? colors.red : colors.grey
          )
        );
    }
    const overlayWidth = Math.max(...overlay.map((row) => row.length));
    const offset = top + Math.floor((height - overlay.length) / 2);
    overlay.forEach((row, y) =>
      line(
        addBackground(centerSprites(row, overlayWidth), colors.black),
        offset + y,
        Math.floor((columns - overlayWidth) / 2),
        3000
      )
    );
  }
  const frame = createTerminalFrame(sprites, columns, rows);
  return !session.paused && !session.suspended
    ? shakeTerminalFrame(world, frame, state)
    : frame;
};

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
