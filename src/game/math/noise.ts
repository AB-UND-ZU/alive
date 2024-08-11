import { getOverlappingCell, matrixFactory } from "./matrix";
import { sum } from "./std";

export const whiteNoiseMatrix = (
  width: number,
  height: number,
  minimum: number = 0,
  maximum: number = 1,
  rng: () => number = Math.random
) => matrixFactory(width, height, () => rng() * (maximum - minimum) + minimum);

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
