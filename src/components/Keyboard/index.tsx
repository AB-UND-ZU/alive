import React, { useCallback, useEffect, useState } from "react";
import { useWorld } from "../../bindings/hooks";
import {
  keyLeft,
  keyGap,
  keyRight,
  modifierLeft,
  upperKey,
  modifierGapLeft,
  deleteGapRight,
  deleteKey,
  deleteRight,
  modifierGapRight,
  numbersKey,
  modifierRight,
  keySocketLeft,
  keySocketGap,
  keySocket,
  keySocketRight,
  deleteSocketGapRight,
  deleteSocket,
  deleteSocketRight,
  modifierSocketLeft,
  modifierSocket,
  modifierSocketGapLeft,
  modifierSocketGapRight,
  modifierSocketRight,
  specialKey,
  lowerKey,
  lettersKey,
  keyboardBorder,
  keyPressed,
  keySocketPressed,
  modifierPressed,
  modifierSocketPressed,
  deletePressed,
  deleteSocketPressed,
} from "../../game/assets/sprites";
import Row from "../Row";
import { colors } from "../../game/assets/colors";
import "./index.css";
import { MOVABLE } from "../../engine/components/movable";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { typeChat } from "../../engine/systems/popup";
import { useDimensions } from "../Dimensions";
import { repeat } from "../../game/math/std";
import { getPressedKeyEdge, parseSprite } from "../../game/assets/ui";

export const keyboardColumns = 10;
export const keyboardRows = 3;
export const keyboardSize = keyboardColumns * keyboardRows;
export const keyboardWidth = keyboardColumns * 2 + 1;
export const keyboardPages = ["lower", "upper", "numbers", "special"] as const;
export const keyboardKeys: Record<(typeof keyboardPages)[number], string[][]> =
  {
    lower: [
      [..."qwertyuiop"],
      [..."asdfghjkl"],
      [..."zxcvbnm", "M\x0f0▀\x00±\x0f■"],
    ],
    upper: [
      [..."QWERTYUIOP"],
      [..."ASDFGHJKL"],
      [..."ZXCVBNM", "M\x0f0▀\x00±\x0f■"],
    ],
    numbers: [
      [..."1234567890"],
      [...'-/:;()&@"'],
      [...".,?!\u0102\u0103", "*\x0f─\x00·", "'"],
    ],
    special: [
      [..."[]{}#%^*+="],
      [..."_\\|~<>$", "\u0106\x0f∙", "■"],
      [..."≈░\u010b\u0100¢ƒΣ₧"],
    ],
  };
const spaceRow = 2;
const spaceColumn = 7;

export const getKeyFromIndex = (index: number) => {
  const pageIndex = Math.floor(index / keyboardSize);
  const page = keyboardPages[pageIndex];
  const keyIndex = index % keyboardSize;
  const rowIndex = Math.floor(keyIndex / keyboardColumns);
  const columnIndex = keyIndex % keyboardColumns;

  if (
    (page === "upper" || page === "lower") &&
    rowIndex === spaceRow &&
    columnIndex === spaceColumn
  ) {
    return " ";
  }

  return keyboardKeys[page][rowIndex][columnIndex] || " ";
};

export const getIndexFromKey = (key: string) => {
  if (key === " ") {
    return { tab: 0, offset: spaceRow, content: spaceColumn };
  }

  for (let pageIndex = 0; pageIndex < keyboardPages.length; pageIndex += 1) {
    const page = keyboardKeys[keyboardPages[pageIndex]];
    for (let rowIndex = 0; rowIndex < page.length; rowIndex += 1) {
      const row = page[rowIndex];
      for (let cellIndex = 0; cellIndex < row.length; cellIndex += 1) {
        const cell = row[cellIndex];
        if (cell === key) {
          return { tab: pageIndex, offset: rowIndex, content: cellIndex };
        }
      }
    }
  }
};

export default function Keyboard() {
  const { ecs, paused } = useWorld();
  const dimensions = useDimensions();
  const [shift, setShift] = useState(false);
  const [modifier, setModifier] = useState(false);
  const [pressedKey, setPressedKey] = useState<number>();
  const releaseKey = useCallback(() => setPressedKey(undefined), []);
  useEffect(() => {
    window.addEventListener("blur", releaseKey);
    return () => window.removeEventListener("blur", releaseKey);
  }, [releaseKey]);
  const pageIndex = Number(shift) + Number(modifier) * 2;
  const currentPage = keyboardPages[pageIndex];

  const handleType = useCallback(
    (
      event: TouchEvent | React.MouseEvent<HTMLElement, MouseEvent>,
      pressOnly = false
    ) => {
      if (!pressOnly) event.preventDefault();
      const div = event.currentTarget as HTMLElement | undefined;
      const hero = ecs?.getEntity([PLAYER, POSITION]);

      if (
        !div ||
        ("touches" in event && event.touches.length > 1) ||
        !hero ||
        !ecs ||
        paused ||
        !hero[MOVABLE]
      )
        return;

      const rect = div.getBoundingClientRect();

      let offsetX = 0;
      let offsetY = 0;

      if ("clientX" in event && typeof event.clientX === "number") {
        offsetX = event.clientX - rect.left;
      } else if ("touches" in event && event.touches.length > 0) {
        offsetX = event.touches[0].clientX - rect.left;
      }

      if ("clientY" in event && typeof event.clientY === "number") {
        offsetY = event.clientY - rect.top;
      } else if ("touches" in event && event.touches.length > 0) {
        offsetY = event.touches[0].clientY - rect.top;
      }

      const totalHeight = div.offsetHeight;
      const rowHeight = totalHeight / keyboardRows;
      const rowCellHeight = rowHeight / 4;
      const rowCellIndex = Math.floor(offsetY / rowCellHeight);
      const rowIndex =
        rowCellIndex % 4 === 3 ? -1 : Math.floor(rowCellIndex / 4);

      const totalWidth = div.offsetWidth;
      const columnWidth = (totalWidth / keyboardWidth) * 2;
      const columnCellIndex = Math.floor(
        (offsetX - columnWidth / 4) / columnWidth
      );
      const columnIndex = columnCellIndex + (rowIndex === 2 ? -1 : 0);

      if (
        columnCellIndex < 0 ||
        columnCellIndex >= keyboardColumns ||
        rowIndex < 0 ||
        rowIndex >= keyboardRows
      )
        return;

      if (pressOnly) {
        setPressedKey(rowIndex * keyboardColumns + columnCellIndex);
        return;
      }

      if (rowIndex === 2 && columnCellIndex === 0) {
        setShift((prevShift) => !prevShift);
        return;
      } else if (rowIndex === 2 && columnCellIndex === keyboardColumns - 1) {
        setShift(false);
        setModifier((prevModifier) => !prevModifier);
        return;
      }

      typeChat(
        ecs,
        hero,
        rowIndex === 1 && columnIndex === keyboardColumns - 1
          ? undefined
          : pageIndex * keyboardSize + rowIndex * keyboardColumns + columnIndex
      );
    },
    [ecs, paused, setShift, setModifier, pageIndex]
  );

  const keyboardSprites = [
    [
      keyLeft,
      ...keyboardKeys[currentPage][0]
        .map((key) => [parseSprite(`\x0f█\x00${key}`), keyGap])
        .flat()
        .slice(0, -1),
      keyRight,
    ],
    [
      keySocketLeft,
      ...keyboardKeys[currentPage][0]
        .map(() => [keySocket, keySocketGap])
        .flat()
        .slice(0, -1),
      keySocketRight,
    ],
    [
      keyLeft,
      ...keyboardKeys[currentPage][1]
        .map((key) => [parseSprite(`\x0f█\x00${key}`), keyGap])
        .flat()
        .slice(0, -1),
      deleteGapRight,
      deleteKey,
      deleteRight,
    ],
    [
      keySocketLeft,
      ...keyboardKeys[currentPage][1]
        .map(() => [keySocket, keySocketGap])
        .flat()
        .slice(0, -1),
      deleteSocketGapRight,
      deleteSocket,
      deleteSocketRight,
    ],
    [
      modifierLeft,
      modifier
        ? shift
          ? numbersKey
          : specialKey
        : shift
        ? lowerKey
        : upperKey,
      modifierGapLeft,
      ...keyboardKeys[currentPage][2]
        .map((key) => [parseSprite(`\x0f█\x00${key}`), keyGap])
        .flat()
        .slice(0, -1),
      modifierGapRight,
      modifier ? lettersKey : numbersKey,
      modifierRight,
    ],
    [
      modifierSocketLeft,
      modifierSocket,
      modifierSocketGapLeft,
      ...keyboardKeys[currentPage][2]
        .map(() => [keySocket, keySocketGap])
        .flat()
        .slice(0, -1),
      modifierSocketGapRight,
      modifierSocket,
      modifierSocketRight,
    ],
  ];

  const pressedRow =
    pressedKey === undefined || paused
      ? undefined
      : Math.floor(pressedKey / keyboardColumns) * 2;
  const pressedColumn = ((pressedKey || 0) % keyboardColumns) * 2 + 1;
  if (pressedRow !== undefined) {
    const color = keyboardSprites[pressedRow][pressedColumn].layers[0].color;
    keyboardSprites[pressedRow][pressedColumn] =
      color === colors.lime
        ? modifierPressed
        : color === colors.red
        ? deletePressed
        : keyPressed;
    keyboardSprites[pressedRow + 1][pressedColumn] =
      color === colors.lime
        ? modifierSocketPressed
        : color === colors.red
        ? deleteSocketPressed
        : keySocketPressed;
    for (const [column, side] of [
      [pressedColumn - 1, "right"],
      [pressedColumn + 1, "left"],
    ] as const) {
      keyboardSprites[pressedRow][column] = getPressedKeyEdge(
        keyboardSprites[pressedRow][column],
        color,
        side
      );
      keyboardSprites[pressedRow + 1][column] = getPressedKeyEdge(
        keyboardSprites[pressedRow + 1][column],
        color,
        side,
        true
      );
    }
  }

  const overlayWidth = dimensions.renderedColumns;

  return (
    <aside
      className="KeyboardOverlay"
      style={{ "--overlay-width": overlayWidth } as React.CSSProperties}
    >
      <div className="KeyboardBorder">
        <Row cells={repeat(keyboardBorder, overlayWidth + 1)} />
      </div>
      {keyboardSprites.map((row, index) => (
        <Row key={index} cells={row} />
      ))}
      <div
        id="keyboard"
        onClick={handleType}
        onPointerDown={(event) => {
          if (event.button === 0) handleType(event, true);
        }}
        onPointerUp={releaseKey}
        onPointerCancel={releaseKey}
        onPointerLeave={releaseKey}
        className="Keyboard"
        style={{ "--keyboard-width": keyboardWidth } as React.CSSProperties}
      />
    </aside>
  );
}
