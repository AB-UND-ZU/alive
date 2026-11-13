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
