import { World } from "../../engine";
import { TEST_MODE } from "../../engine/utils";
import { TypedEntity } from "../../engine/entities";
import { popupTitles } from "../../engine/systems/popup";
import { POPUP } from "../../engine/components/popup";
import { getSequence } from "../../engine/systems/sequence";
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
  createButton,
  createSpriteButton,
  buttonPalettes,
  createProgress,
  createText,
  addBackground,
} from "../../game/assets/ui";
import { centerSprites } from "../../game/assets/pixels";
import {
  none,
  pauseInvert,
  popupActive,
  pauseInvertPressed,
} from "../../game/assets/sprites";
import { getItemSprite } from "../../game/assets/utils";
import { colors } from "../../game/assets/colors";
import { repeat, padCenter } from "../../game/math/std";
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

export const capabilities: RendererCapabilities = {
  lighting: false,
  shadows: false,
  healthBars: false,
  stackDots: false,
  smoothMovement: false,
};

export type TerminalSession = {
  paused?: boolean;
  suspended?: boolean;
  saveName?: string;
  selection?: number;
  failed?: boolean;
  flipped?: boolean;
};

export const getTerminalLayout = (columns: number, rows: number) => {
  const width = Math.min(columns, 33);
  const height = Math.min(13, Math.max(1, rows - 8));
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
  if (session.suspended) {
    const loading = createText("Loading map...", colors.white);
    return createTerminalFrame(
      loading.map((sprite, index) => ({
        sprite,
        layers: sprite.layers,
        x: Math.floor((columns - loading.length) / 2) + index,
        y: Math.floor(rows / 2),
        z: 0,
      })),
      columns,
      rows
    );
  }
  const hero = world.getEntities([PLAYER])[0];
  let scene = getSceneFrame(world, width, height, state, {
    instant: true,
    fogCells: true,
  });
  const popup = world.getEntityByIdAndComponents(hero?.[PLAYER].popup, [POPUP]);
  const sequence = popup && getSequence(world, popup, "popup");
  if (popup && sequence) {
    const index = popup[POPUP].horizontalIndex;
    const tabs = sequence.args.instant
      ? [popup[POPUP].tabs[index]]
      : popup[POPUP].tabs;
    const selected = sequence.args.instant ? 0 : index;
    const tabCount = tabs.length;
    for (const entry of scene) {
      if (
        entry.particle ===
        world.getEntityById(sequence.particles["popup-close-1"])
      ) {
        const sprite = createText("X", colors.black, colors.red)[0];
        entry.sprite = sprite;
        entry.layers = sprite.layers;
      }
      const tabCell = Array.from(
        { length: tabCount * 6 + 1 },
        (_, i) => i
      ).find(
        (i) =>
          entry.particle ===
          world.getEntityById(sequence.particles[`popup-tab-${i}`])
      );
      if (tabCell === undefined) continue;
      const boundary = tabCell % 6 === 0;
      const tab = Math.min(Math.floor(tabCell / 6), tabCount - 1);
      const active = boundary
        ? tabCell === selected * 6 || tabCell === (selected + 1) * 6
        : tab === selected;
      const char = boundary
        ? tabCell === 0 || tabCell === selected * 6
          ? "["
          : tabCell === tabCount * 6 || tabCell === (selected + 1) * 6
          ? "]"
          : "|"
        : padCenter(popupTitles[tabs[tab]], 5)[(tabCell % 6) - 1];
      const foreground = active
        ? colors.black
        : sequence.args.instant
        ? colors.yellow
        : colors.white;
      const background = active
        ? sequence.args.instant
          ? colors.yellow
          : colors.white
        : sequence.args.instant
        ? colors.olive
        : colors.grey;
      const sprite = createText(char, foreground, background)[0];
      entry.sprite = sprite;
      entry.layers = sprite.layers;
      entry.terminalLayers = sprite.layers;
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
      sprites.push({
        x: x + index,
        y,
        z,
        sprite,
        layers: sprite.layers,
        terminalLayers: sprite.terminal?.layers,
      })
    );
  };
  if (hero) {
    const pauseButton = createSpriteButton(
      [session.paused ? pauseInvertPressed : pauseInvert],
      3,
      false,
      !!session.paused
    );
    if (!TEST_MODE && world.metadata.gameEntity[LEVEL].name === "LEVEL_MENU") {
      line(pauseButton, 2, Math.floor((columns - 21) / 2));
    } else {
      const stats = getEntityStats(world, hero);
      const progressLeft = Math.floor((columns - 21) / 2) + 3;
      line(createProgress(stats, "hp", 13, false), 0, progressLeft);
      line(createProgress(stats, "mp", 13), 1, progressLeft);
      line(
        [
          ...pauseButton,
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
            getItemSprite(
              compass[ITEM],
              "display",
              compass[ORIENTABLE]?.facing
            ),
            ...createText("Compass", colors.grey),
          ]
        : repeat(none, 8);
      line(
        session.flipped
          ? [...equipment, none, ...spell.button, ...skill.button]
          : [...skill.button, ...spell.button, none, ...equipment],
        rows - 3
      );
      line(
        session.flipped
          ? [...repeat(none, 9), ...spell.activation, ...skill.activation]
          : [...skill.activation, ...spell.activation, ...repeat(none, 9)],
        rows - 2
      );
    }
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
  if (session.paused) {
    const background = createTerminalFrame(sprites, columns, rows);
    for (let y = top; y < top + height; y++)
      line(
        background[y]
          .slice(left + 1, left + width - 1)
          .flatMap((cell) =>
            createText(
              "░",
              cell.background && cell.background !== colors.black
                ? cell.background
                : cell.char === " "
                ? colors.black
                : cell.foreground,
              colors.black
            )
          ),
        y,
        left + 1,
        2000
      );
    let overlay: Sprite[][];
    {
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
        overlay.push([
          ...(selected ? [popupActive] : createText(" ")),
          ...(selected && action.palette === "white"
            ? createText("[ SAVE ]", colors.black, colors.white)
            : createSpriteButton(
                createText(
                  action.name,
                  selected && action.palette !== "white"
                    ? colors.white
                    : buttonPalettes[action.palette].text
                ),
                8,
                action.disabled || !selected,
                selected && action.palette !== "white",
                false,
                action.palette
              )),
        ]);
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
        addBackground(row, colors.black),
        offset + y,
        Math.floor((columns - overlayWidth) / 2) +
          Math.floor((overlayWidth - row.length) / 2),
        3000
      )
    );
  }
  const frame = createTerminalFrame(sprites, columns, rows);
  return !session.paused && !session.suspended
    ? shakeTerminalFrame(world, frame, state)
    : frame;
};
