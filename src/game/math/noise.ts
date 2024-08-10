import { sum } from "./utils";

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
  Array.from({ length: height }).map((_, yIndex) =>
    Array.from({ length: width }).map((_, xIndex) => generator(xIndex, yIndex))
  );

export const whiteNoiseMatrix = (
  width: number,
  height: number,
  minimum: number = 0,
  maximum: number = 1,
  rng: () => number = Math.random
) => matrixFactory(width, height, () => rng() * (maximum - minimum) + minimum);

export const getOverlappingCell = <T>(
  matrix: Matrix<T>,
  x: number,
  y: number
) => {
  const width = matrix[0].length;
  const height = matrix.length;
  const normalizedX = (x + width) % width;
  const normalizedY = (y + height) % height;
  return matrix[normalizedX][normalizedY];
};

// set each cell to the average of cells in a distance of the interpolation value
export const lerpMatrix = (
  matrix: number[][],
  iterations: number = 1,
  interpolationRadius: number = 1
): number[][] => {
  if (iterations <= 0) return matrix;

  const interpolationSize = interpolationRadius * 2 + 1;

  const iterationMatrix = matrixFactory(
    matrix.length,
    matrix[0].length,
    (iterationX, iterationY) => {
      const neighbours = matrixFactory(
        interpolationSize,
        interpolationSize,
        (interpolationX, interpolationY) =>
          getOverlappingCell(
            matrix,
            iterationX + interpolationX - interpolationRadius,
            iterationY + interpolationY - interpolationRadius
          )
      ).flat();

      return sum(neighbours) / interpolationSize ** 2;
    }
  );
  return lerpMatrix(iterationMatrix, iterations - 1, interpolationRadius);
};

export const valueNoiseMatrix = (
  width: number,
  height: number,
  iterations: number,
  minimum: number = 0,
  maximum: number = 1
) => {
  const noiseMatrix = whiteNoiseMatrix(width, height, minimum, maximum);
  const valueMatrix = lerpMatrix(noiseMatrix, iterations);

  return valueMatrix;
};
