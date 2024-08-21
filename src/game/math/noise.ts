import { createNoise4D } from "simplex-noise";
import { getOverlappingCell, matrixFactory } from "./matrix";
import { sum } from "./std";
import { aspectRatio } from "../../components/Dimensions/sizing";

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

export const averageMatrix = (
  matrix: number[][],
  minimum: number,
  maximum: number
) => {
  const average = (minimum + maximum) / 2;
  const actualAverage = sum(matrix.flat()) / (matrix.length * matrix[0].length);

  return matrixFactory(matrix.length, matrix[0].length, (x, y) =>
    Math.max(minimum, Math.min(maximum, matrix[x][y] + average - actualAverage))
  );
};

export const scalarMatrix = (matrix: number[][], scalar: number) => {
  return matrixFactory(
    matrix.length,
    matrix[0].length,
    (x, y) => matrix[x][y] * scalar
  );
};

export const scaleMatrix = (matrix: number[][], scale: number) => {
  return matrixFactory(
    matrix.length * scale,
    matrix[0].length * scale,
    (scaledX, scaledY) => {
      const deltaX = scaledX % scale;
      const deltaY = scaledY % scale;
      const originalX = (scaledX - deltaX) / scale;
      const originalY = (scaledY - deltaY) / scale;
      const scaleX = deltaX / scale;
      const scaleY = deltaY / scale;

      return sum(
        [0, 1]
          .map((offsetX) =>
            [0, 1]
              .map(
                (offsetY) =>
                  getOverlappingCell(
                    matrix,
                    originalX + offsetX,
                    originalY + offsetY
                  ) *
                  (offsetX ? scaleX : 1 - scaleX) *
                  (offsetY ? scaleY : 1 - scaleY)
              )
              .flat()
          )
          .flat()
      );
    }
  );
};

export const valueNoiseMatrix = (
  width: number,
  height: number,
  iterations: number,
  minimum: number = 0,
  maximum: number = 1,
  scale: number = 1
) => {
  const noiseMatrix = whiteNoiseMatrix(width / scale, height / scale);
  const averagedMatrix = averageMatrix(noiseMatrix, 0, 1);
  const valueMatrix = lerpMatrix(averagedMatrix, iterations);
  const multipliedMatrix = matrixFactory(
    width / scale,
    height / scale,
    (x, y) => {
      const distance = valueMatrix[x][y] * 2 - 1;
      return (
        (distance * Math.sqrt(iterations + 1) +
          1) /
          2 *
          (maximum - minimum) +
        minimum
      );
    }
  );
  const scaledMatrix = scaleMatrix(multipliedMatrix, scale);

  return scaledMatrix;
};

// create a 3d sphere in 4d space, mapping x to horizontal and y to vertical coordinates on the sphere
// then use 4th axis inversely the closer x is towards the poles
export const simplexNoiseMatrix = (
  width: number,
  height: number,
  octaves: number,
  minimum: number = 0,
  maximum: number = 1,
  scale: number = 1,
) => {
  const noise = createNoise4D();

  return matrixFactory(width, height, (x, y) => {
    const degreesX = (x / width) * 2 * Math.PI;
    const degreesY = (y / height) * 2 * Math.PI;

    const dx = Math.cos(degreesX) / scale;
    const dy = Math.sin(degreesX) / scale * aspectRatio;
    const dz = Math.cos(degreesY) / scale;
    const dw = Math.sin(degreesY) / scale;

    return ((noise(dx, dy, dz, dw) + 1) / 2) * (maximum - minimum) + minimum;
  });

};
