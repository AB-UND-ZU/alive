import { sum } from "./utils";

export const createMatrix = <T,>(
  width: number,
  height: number,
  generator: (x: number, y: number) => T
): T[][] => {
  return Array.from({ length: height }).map(
    (_, yIndex) => Array.from({ length: width }).map(
      (_, xIndex) => generator(xIndex, yIndex)
    )
  );
};

export const generateWhiteNoise = (
  width: number,
  height: number,
  minimum: number = 0,
  maximum: number = 1,
  rng: () => number = Math.random
) => createMatrix(width, height, () => rng() * (maximum - minimum) + minimum);

export const getOverlappingCell = <T,>(matrix: T[][], x: number, y: number) => {
  const width = matrix[0].length;
  const height = matrix.length;
  const normalizedX = (x + width) % width;
  const normalizedY = (y + height) % height;
  return matrix[normalizedY][normalizedX];
}

// set each cell to the average of cells in a distance of the interpolation value
export const valueNoise = (matrix: number[][], iterations: number = 1, interpolation: number = 1): number[][] => {
  if (iterations <= 0) return matrix;

  const interpolationRadius = interpolation * 2 + 1;

  const iterationMatrix = createMatrix(matrix.length, matrix[0].length, (iterationX, iterationY) => {
    const neighbours = createMatrix(
      interpolationRadius,
      interpolationRadius,
      (interpolationX, interpolationY) => getOverlappingCell(
        matrix,
        iterationX + interpolationX - interpolation,
        iterationY + interpolationY - interpolation,
      )
    ).flat();

    return sum(neighbours) / (interpolationRadius ** 2);
  });
  return valueNoise(iterationMatrix, iterations - 1, interpolation);
};