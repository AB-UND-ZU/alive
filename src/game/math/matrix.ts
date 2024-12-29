import { normalize } from "./std";

export type Matrix<T> = T[][];

export const iterateMatrix = <T>(
  matrix: Matrix<T>,
  callback: (x: number, y: number, value: T) => void
) => {
  for (let columnIndex = 0; columnIndex < matrix.length; columnIndex += 1) {
    for (
      let rowIndex = 0;
      rowIndex < matrix[columnIndex].length;
      rowIndex += 1
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

export const transpose = <T>(matrix: Matrix<T>) =>
  matrixFactory(matrix[0].length, matrix.length, (x, y) => matrix[y][x]);

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

export const setMatrix = <T>(
  matrix: Matrix<T>,
  x: number,
  y: number,
  value: T
) => {
  const width = matrix.length;
  const height = matrix[0].length;
  const normalizedX = normalize(x + width, width);
  const normalizedY = normalize(y + height, height);
  matrix[normalizedX][normalizedY] = value;
};
