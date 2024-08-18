import { normalize } from "./std";

export type Matrix<T> = T[][];

export const iterateMatrix = <T>(
  matrix: Matrix<T>,
  callback: (x: number, y: number, value: T) => void
) => {
  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    for (
      let columnIndex = 0;
      columnIndex < matrix[rowIndex].length;
      columnIndex += 1
    ) {
      callback(columnIndex, rowIndex, matrix[columnIndex][rowIndex]);
    }
  }
};

export const matrixFactory = <T>(
  width: number,
  height: number,
  generator: (x: number, y: number) => T
): Matrix<T> =>
  Array.from({ length: width }).map((_, xIndex) =>
    Array.from({ length: height }).map((_, yIndex) => generator(xIndex, yIndex))
  );

export const getOverlappingCell = <T>(
  matrix: Matrix<T>,
  x: number,
  y: number
) => {
  const width = matrix[0].length;
  const height = matrix.length;
  const normalizedX = normalize(x, width);
  const normalizedY = normalize(y, height);
  return matrix[normalizedX][normalizedY];
};
