import React, { useCallback, useState } from "react";
import { useHero, useWorld } from "../../bindings/hooks";
import {
  keyLeft,
  parseSprite,
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
} from "../../game/assets/sprites";
import Row from "../Row";
import "./index.css";
import { MOVABLE } from "../../engine/components/movable";
import { REFERENCE } from "../../engine/components/reference";
import { PLAYER } from "../../engine/components/player";
import { useDimensions } from "../Dimensions";
import { repeat } from "../../game/math/std";

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
  const hero = useHero();
  const dimensions = useDimensions();
  const [shift, setShift] = useState(false);
  const [modifier, setModifier] = useState(false);
  const pageIndex = Number(shift) + Number(modifier) * 2;
  const currentPage = keyboardPages[pageIndex];

  const handleType = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLElement, MouseEvent>) => {
      event.preventDefault();
      const div = event.currentTarget as HTMLElement | undefined;

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

      if (rowIndex === 2 && columnCellIndex === 0) {
        setShift((prevShift) => !prevShift);
        return;
      } else if (rowIndex === 2 && columnCellIndex === keyboardColumns - 1) {
        setShift(false);
        setModifier((prevModifier) => !prevModifier);
        return;
      }

      const reference = ecs.assertByIdAndComponents(hero[MOVABLE].reference, [
        REFERENCE,
      ])[REFERENCE];

      hero[PLAYER].actionTriggered = "type";

      if (rowIndex === 1 && columnIndex === keyboardColumns - 1) {
        hero[PLAYER].tabTriggered = undefined;
        hero[PLAYER].contentTriggered = undefined;
        hero[PLAYER].offsetTriggered = undefined;
      } else {
        hero[PLAYER].tabTriggered = pageIndex;
        hero[PLAYER].contentTriggered = columnIndex;
        hero[PLAYER].offsetTriggered = rowIndex;
      }

      reference.suspensionCounter =
        reference.suspensionCounter === -1
          ? -1
          : reference.suspensionCounter + 1;
      reference.suspended = false;
    },
    [hero, ecs, paused, setShift, setModifier, pageIndex]
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
        className="Keyboard"
        style={{ "--keyboard-width": keyboardWidth } as React.CSSProperties}
      />
    </aside>
  );
}
