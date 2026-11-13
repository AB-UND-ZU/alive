import { Entity } from "ecs";
import { loadSpritePack, saveSpritePack } from "../spritePack";
import { createDialog } from "../../engine/entities";
import { registerEntity } from "../../engine/systems/map";
import { World } from "../../engine/ecs";
import { POPUP } from "../../engine/components/popup";
import { Sprite } from "../../engine/components/sprite";
import { RENDERABLE } from "../../engine/components/renderable";
import { PLAYER } from "../../engine/components/player";
import { Orientation } from "../../engine/components/orientable";
import { PopupSequence, Sequence } from "../../engine/components/sequencable";
import {
  createPopup,
  getTab,
  getVerticalIndex,
  openPopup,
  setVerticalIndex,
} from "../../engine/systems/popup";
import { getSequence } from "../../engine/systems/sequence";
import { composeCharacterPixels } from "../../components/Row/characters";
import { colors, orderedColors } from "./colors";
import { codePage437 } from "./characters";
import { none } from "./sprites";
import {
  addBackground,
  createButton,
  createText,
  recolorSprite,
  shaded,
} from "./ui";
import {
  getItemSprite,
  displayPopupView,
  scrolledVerticalIndex,
} from "./utils";
import { repeat } from "../math/std";
import { play } from "../sound";

const windowHeight = 11;
const innerHeight = windowHeight - 2;

export const openSpriteBuilder = (world: World, hero: Entity) => {
  const popup = createDialog(world, {
    POSITION: { ...hero.POSITION },
    RENDERABLE: { generation: 0 },
    SEQUENCABLE: { states: {} },
    SPRITE: none,
    FOG: { type: "terrain", visibility: "visible", fixed: true },
  });
  createPopup(world, popup, {
    tabs: ["pack", "sprite", "layer"],
    sprite: {
      sprites: loadSpritePack(
        [
          getItemSprite({ weapon: "sword", material: "wood" }),
          getItemSprite({ stackable: "apple" }),
        ].map((sprite, index) => ({
          name: `Sprite #${index + 1}`,
          layers: sprite.layers.map((layer) => ({ ...layer })),
        }))
      ),
      selected: 0,
      color: orderedColors.indexOf(colors.white),
      colorMode: false,
    },
  });
  registerEntity(world, popup);
  openPopup(world, hero, popup);
};

const layerSprite = (char: string, color: string): Sprite => ({
  name: "sprite_layer",
  layers: [
    ...(color === colors.black ? [{ char: "█", color: colors.white }] : []),
    { char, color },
  ],
});

export const spriteBuilderPreview = (sprite: Sprite): Sprite[][] => {
  const pixels = composeCharacterPixels(sprite.layers);
  return Array.from({ length: innerHeight }, (_, row) => {
    const top = row === 0;
    const bottom = row === innerHeight - 1;
    return [
      {
        name: "sprite_frame_left",
        layers: [
          { char: bottom ? "▀" : "▐", color: colors.white },
          ...(bottom
            ? [
                { char: "─", color: colors.white },
                { char: "▌", color: colors.black },
              ]
            : []),
          { char: "║", color: colors.black },
          { char: "│", color: colors.black },
          ...(top ? [{ char: "▀", color: colors.black }] : []),
        ],
      },
      ...Array.from({ length: 9 }, (_, column) => ({
        name: "sprite_pixel_pair",
        layers: [
          {
            char: "▀",
            color: pixels[(row * 2 - 1) * 9 + column] || colors.black,
          },
          { char: "▄", color: pixels[row * 18 + column] || colors.black },
          ...(top || bottom ? [{ char: "─", color: colors.white }] : []),
        ],
      })),
      {
        name: "sprite_frame_right",
        layers: [
          { char: bottom ? "▀" : "▌", color: colors.white },
          ...(bottom
            ? [
                { char: "─", color: colors.white },
                { char: "▐", color: colors.black },
              ]
            : []),
          { char: "║", color: colors.black },
          ...(top ? [{ char: "▀", color: colors.black }] : []),
        ],
      },
    ];
  });
};

export const updateSpriteBuilder = (
  world: World,
  hero: Entity,
  popup: Entity,
  orientation?: Orientation
) => {
  const editor = popup[POPUP].sprite!;
  const tab = getTab(world, popup);
  const row = getVerticalIndex(world, popup);
  const action = hero[PLAYER].actionTriggered;
  const clickedRow = hero[PLAYER].contentTriggered;
  const column = hero[PLAYER].offsetTriggered;
  hero[PLAYER].actionTriggered = undefined;
  hero[PLAYER].contentTriggered = undefined;
  hero[PLAYER].offsetTriggered = undefined;
  const direction = orientation || action;
  const change = direction === "up" ? -1 : direction === "down" ? 1 : 0;
  const sprite = editor.sprites[editor.selected];
  let changed = false;
  const ensureSprite = () => {
    if (!editor.sprites[editor.selected]) {
      changed = true;
      editor.sprites.push({
        name: `Sprite #${editor.selected + 1}`,
        layers: [],
      });
    }
    return editor.sprites[editor.selected];
  };
  const view = (index = 0) => {
    editor.moving = false;
    popup[POPUP].horizontalIndex = 1;
    setVerticalIndex(world, popup, index);
    editor.layer = undefined;
  };
  const editLayer = (index: number) => {
    editor.moving = false;
    const layer = sprite?.layers[index];
    editor.layer = layer ? index : undefined;
    if (layer) editor.color = orderedColors.indexOf(layer.color);
    editor.colorMode = false;
    popup[POPUP].horizontalIndex = 2;
    setVerticalIndex(
      world,
      popup,
      layer
        ? Math.max(
            0,
            Math.min(
              16 - innerHeight,
              Math.floor(codePage437.indexOf(layer.char) / 16)
            )
          )
        : 0
    );
  };

  if (change) {
    if (tab === "layer" && editor.colorMode) {
      editor.color =
        (editor.color + change + orderedColors.length) % orderedColors.length;
      if (sprite && editor.layer !== undefined) {
        sprite.layers[editor.layer].color = orderedColors[editor.color];
        changed = true;
      }
    } else if (tab === "sprite" && editor.moving && sprite?.layers[row]) {
      const index = Math.max(
        0,
        Math.min(sprite.layers.length - 1, row + change)
      );
      changed = index !== row;
      const [layer] = sprite.layers.splice(row, 1);
      sprite.layers.splice(index, 0, layer);
      setVerticalIndex(world, popup, index);
    } else {
      const last =
        tab === "pack"
          ? editor.sprites.length
          : tab === "sprite"
          ? sprite?.layers.length || 0
          : Math.ceil(codePage437.length / 16) - innerHeight;
      setVerticalIndex(world, popup, Math.max(0, Math.min(last, row + change)));
      if (tab === "pack") editor.selected = getVerticalIndex(world, popup);
    }
    play("select");
  } else if (
    action === "content" &&
    clickedRow !== undefined &&
    column !== undefined
  ) {
    const scroll = getSequence(world, popup, "popup")?.args.scrollIndex || 0;
    const selected = clickedRow + scroll;
    if (tab === "layer") {
      const char = codePage437[selected * 16 + column];
      if (column >= 0 && column < 16 && char !== undefined) {
        const target = ensureSprite();
        const index = editor.layer ?? target.layers.length;
        target.layers[index] = { char, color: orderedColors[editor.color] };
        changed = true;
        view(index);
        play("confirm");
      }
    } else if (tab === "pack" && selected <= editor.sprites.length) {
      if (selected === row) {
        editor.selected = selected;
        ensureSprite();
        editor.moving = false;
        view();
      } else {
        setVerticalIndex(world, popup, selected);
        editor.selected = selected;
      }
    } else if (
      tab === "sprite" &&
      column < 6 &&
      selected <= (sprite?.layers.length || 0)
    ) {
      if (selected === row) {
        if (editor.moving || !sprite?.layers[selected]) editLayer(selected);
        else editor.moving = true;
      } else if (!editor.moving) setVerticalIndex(world, popup, selected);
    }
  } else if (action === "right") {
    if (tab === "pack") {
      ensureSprite();
      editor.moving = false;
      view();
    } else if (tab === "sprite") {
      if (editor.moving || !sprite?.layers[row]) editLayer(row);
      else editor.moving = true;
    } else {
      editor.colorMode = !editor.colorMode;
    }
    play("confirm");
  } else if (action === "left") {
    if (tab === "pack" && sprite) {
      editor.sprites.splice(editor.selected, 1);
      changed = true;
      editor.selected = Math.min(editor.selected, editor.sprites.length);
      setVerticalIndex(world, popup, editor.selected);
    } else if (tab === "sprite" && editor.moving) {
      editor.moving = false;
    } else if (tab === "sprite" && sprite?.layers[row]) {
      sprite.layers.splice(row, 1);
      changed = true;
      setVerticalIndex(
        world,
        popup,
        Math.max(0, Math.min(row, sprite.layers.length - 1))
      );
    } else if (tab === "sprite") {
      popup[POPUP].horizontalIndex = 0;
      setVerticalIndex(world, popup, editor.selected);
    } else if (tab === "layer") {
      view(editor.layer ?? (sprite?.layers.length || 0));
    }
    play("back");
  }
  if (changed) saveSpritePack(editor.sprites);
};

const spriteBuilderView = displayPopupView((world, entity, state) => {
  const editor = entity[POPUP].sprite!;
  const tab = getTab(world, entity);
  const row = getVerticalIndex(world, entity);
  const sprite = editor.sprites[editor.selected];
  const showLayer = world.metadata.gameEntity[RENDERABLE].generation % 2 === 0;

  let content: Sprite[][];
  if (tab === "pack") {
    content = [...editor.sprites, none].map((sprite, index) => {
      const line = createText(
        (index === editor.sprites.length
          ? "(New Sprite)"
          : `Sprite #${index + 1}`
        ).padEnd(15),
        index === row ? colors.white : colors.grey
      );
      const cells = [sprite, ...line];
      return [none, ...(index === row ? shaded(cells, colors.grey) : cells)];
    });
  } else if (tab === "sprite") {
    const layers: Sprite["layers"] = sprite?.layers || [];
    const count = Math.max(layers.length + 1, innerHeight);
    const scroll =
      row -
      scrolledVerticalIndex(
        world,
        entity,
        {
          ...state,
          args: { ...state.args, windowHeight },
        },
        Array.from({ length: count }, () => []),
        "selected"
      );
    const preview = spriteBuilderPreview(
      sprite
        ? {
            ...sprite,
            layers: layers.filter(
              (_, index) => index !== row || editor.moving || showLayer
            ),
          }
        : none
    );
    content = Array.from({ length: count }, (_, index) => {
      const layer = layers[index];
      let line = layer
        ? [
            none,
            ...(index === row && editor.moving && !showLayer
              ? repeat(none, 2)
              : createText(
                  String(index + 1).padStart(2, "0"),
                  index === row ? colors.white : colors.silver
                )),
            ...(index === row && (editor.moving || showLayer)
              ? createText("[", colors.white)
              : [none]),
            ...createText(layer.char, layer.color),
            ...(index === row && (editor.moving || showLayer)
              ? createText("]", colors.white)
              : [none]),
          ]
        : index === layers.length
        ? [
            none,
            ...createText(
              "New".padEnd(5),
              index === row ? colors.white : colors.silver
            ),
          ]
        : repeat(none, 6);
      const black = layer?.color === colors.black;
      if (black)
        line = [
          line[0],
          ...line.slice(1).map((cell) =>
            recolorSprite(cell, {
              [colors.silver]: colors.black,
              [colors.white]: colors.black,
            })
          ),
        ];
      if (index === row)
        line = [
          line[0],
          ...shaded(
            line.slice(1, layer ? 3 : undefined),
            editor.moving ? colors.green : colors.grey,
            editor.moving ? "▄" : "░",
            black ? colors.white : colors.black
          ),
          ...(layer ? line.slice(3) : []),
        ];
      if (black)
        line = [line[0], ...addBackground(line.slice(1), colors.white)];
      return [...line, ...(preview[index - scroll] || repeat(none, 11))];
    });
  } else {
    content = Array.from({ length: 16 }, (_, index) => [
      ...codePage437
        .slice(index * 16, index * 16 + 16)
        .map((char) => layerSprite(char, orderedColors[editor.color])),
    ]);
  }
  return {
    content: content,
    selection:
      tab === "layer"
        ? undefined
        : (tab === "pack" && row < editor.sprites.length) ||
          (tab === "sprite" && editor.moving)
        ? "active"
        : "selected",
    overscan: 0,
    rightButton: createButton(
      tab === "pack"
        ? sprite
          ? "EDIT"
          : "NEW"
        : tab === "sprite"
        ? editor.moving
          ? "LAYER"
          : sprite?.layers[row]
          ? "EDIT"
          : "NEW"
        : editor.colorMode
        ? "CHAR"
        : "COLOR",
      7,
      false,
      false,
      false,
      tab === "layer" ? "yellow" : "lime"
    ),
    leftButton: createButton(
      tab === "pack"
        ? "ERASE"
        : tab === "sprite"
        ? editor.moving
          ? "PLACE"
          : sprite?.layers[row]
          ? "DROP"
          : "\u011aBACK"
        : "\u011aBACK",
      7,
      tab === "pack" && !sprite,
      false,
      false,
      tab === "sprite" && editor.moving ? "yellow" : "red"
    ),
    windowHeight: windowHeight,
  };
});

export const displaySpriteBuilder: Sequence<PopupSequence> = (
  world,
  entity,
  state
) => {
  const result = spriteBuilderView(world, entity, state);
  if (getTab(world, entity) === "sprite" && entity[POPUP].sprite?.moving)
    state.args.backButton = true;
  return result;
};
