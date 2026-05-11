import { aspectRatio } from "../../components/Dimensions/sizing";
import {
  getDistance,
  lerp,
  normalize,
  Point,
  product,
  random,
  rotate,
  sigmoid,
  signedDistance,
  sum,
} from "./std";
import { iterations, pointToDegree } from "./tracing";

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

export const iterateMatrixFromCenter = <T>(
  matrix: Matrix<T>,
  center: Point,
  callback: (x: number, y: number, value: T) => void | boolean,
  maxRadius?: number,
  shuffled = false
) => {
  const size = matrix.length;
  const radius = maxRadius ?? Math.floor(size / 2);
  const turnedIterations = shuffled
    ? rotate(iterations, random(0, 3))
    : iterations;

  // start with center
  if (callback(center.x, center.y, matrix[center.x][center.y])) return center;

  for (let direction = 1; direction <= radius; direction += 1) {
    // outwards from center to corners alternating
    for (let normal = 0; normal <= direction; normal += 1) {
      for (const iteration of turnedIterations) {
        // skip duplicate overlaps on even matrix sizes
        const iterationIndex = turnedIterations.indexOf(iteration);
        if (
          size % 2 === 0 &&
          direction === radius &&
          ((iterationIndex === 1 && normal === direction) || iterationIndex > 1)
        )
          continue;

        // positive or zero normal
        const positiveX = normalize(
          center.x +
            direction * iteration.direction.x +
            normal * iteration.normal.x,
          size
        );
        const positiveY = normalize(
          center.y +
            direction * iteration.direction.y +
            normal * iteration.normal.y,
          size
        );
        if (callback(positiveX, positiveY, matrix[positiveX][positiveY]))
          return { x: positiveX, y: positiveY };

        // skip duplicate centers and corners
        if (normal === 0 || normal === direction) continue;

        // negative normal
        const negativeX = normalize(
          center.x +
            direction * iteration.direction.x -
            normal * iteration.normal.x,
          size
        );
        const negativeY = normalize(
          center.y +
            direction * iteration.direction.y -
            normal * iteration.normal.y,
          size
        );
        if (callback(negativeX, negativeY, matrix[negativeX][negativeY]))
          return { x: negativeX, y: negativeY };
      }
    }
  }
};

export const matrixFactory = <T>(
  width: number,
  height: number,
  generator: (x: number, y: number, matrix: Matrix<T>) => T
): Matrix<T> => {
  const matrix = new Array(width);
  for (let x = 0; x < width; x++) {
    matrix[x] = new Array(height);
    for (let y = 0; y < height; y++) {
      matrix[x][y] = generator(x, y, matrix);
    }
  }
  return matrix;
};

export const createMatrix = <T>(
  width: number,
  height: number,
  value: T
): Matrix<T> => {
  const matrix = new Array(width);
  for (let x = 0; x < width; x++) {
    matrix[x] = new Array(height);
    for (let y = 0; y < height; y++) {
      matrix[x][y] = value;
    }
  }
  return matrix;
};

export const mapMatrix = <T>(
  matrix: Matrix<T>,
  callback: (x: number, y: number, value: T, newMatrix: Matrix<T>) => T
) =>
  matrixFactory<T>(matrix[0].length, matrix.length, (x, y, newMatrix) =>
    callback(x, y, matrix[x][y], newMatrix)
  );

export const circularKernel = (
  width: number,
  height: number,
  x: number,
  y: number,
  center: Point,
  radius: number,
  minimum: number,
  maximum: number,
  steepness: number,
  ratio: number = aspectRatio
) => {
  const distance = getDistance({ x, y }, center, width, ratio);
  const value = 1 - sigmoid(distance, radius, steepness);
  return lerp(minimum, maximum, value);
};

export const circularMatrix = (
  width: number,
  height: number,
  center: Point,
  radius: number,
  minimum: number,
  maximum: number,
  steepness: number,
  ratio: number = aspectRatio
) =>
  matrixFactory(width, height, (x, y) =>
    circularKernel(
      width,
      height,
      x,
      y,
      center,
      radius,
      minimum,
      maximum,
      steepness,
      ratio
    )
  );

export const rectangleKernel = (
  width: number,
  height: number,
  x: number,
  y: number,
  center: Point,
  shapeWidth: number,
  shapeHeight: number,
  degrees: number,
  minimum: number,
  maximum: number,
  steepness: number = 1,
  ratio = aspectRatio
) => {
  const delta = {
    x: signedDistance(center.x, x, width) * ratio,
    y: signedDistance(center.y, y, height),
  };

  const radians = (degrees * Math.PI) / 180;
  const cosValue = Math.cos(radians);
  const sinValue = Math.sin(radians);

  // rotate delta in a toroidal-safe way
  const rotated = {
    x: cosValue * delta.x + sinValue * delta.y,
    y: -sinValue * delta.x + cosValue * delta.y,
  };

  const value =
    (1 - sigmoid(Math.abs(rotated.x), shapeWidth / 2, steepness)) *
    (1 - sigmoid(Math.abs(rotated.y), shapeHeight / 2, steepness));

  return lerp(minimum, maximum, value);
};

export const rectangleMatrix = (
  width: number,
  height: number,
  center: Point,
  shapeWidth: number,
  shapeHeight: number,
  degrees: number,
  minimum: number,
  maximum: number,
  steepness: number = 1,
  ratio = aspectRatio
) =>
  matrixFactory(width, height, (x, y) =>
    rectangleKernel(
      width,
      height,
      x,
      y,
      center,
      shapeWidth,
      shapeHeight,
      degrees,
      minimum,
      maximum,
      steepness,
      ratio
    )
  );

export const gradientKernel = (
  width: number,
  height: number,
  x: number,
  y: number,
  center: Point,
  radius: number,
  degrees: number,
  minimum: number,
  maximum: number,
  steepness: number = 1,
  ratio: number = aspectRatio
) => {
  const delta = {
    x: signedDistance(center.x, x, width) * ratio,
    y: signedDistance(center.y, y, height),
  };
  const hypothenuse = getDistance({ x: 0, y: 0 }, delta, width, ratio);

  if (hypothenuse > radius) return minimum;

  const clockwise = pointToDegree(delta);
  const relativeToRidge = ((clockwise - degrees) * Math.PI) / 180;

  const adjacent = Math.cos(relativeToRidge) * hypothenuse;
  const value = 1 - sigmoid(adjacent, 0, steepness);

  return lerp(minimum, maximum, value);
};

export const gradientMatrix = (
  width: number,
  height: number,
  center: Point,
  radius: number,
  degrees: number,
  minimum: number,
  maximum: number,
  steepness: number = 1,
  ratio: number = aspectRatio
) =>
  matrixFactory(width, height, (x, y) =>
    gradientKernel(
      width,
      height,
      x,
      y,
      center,
      radius,
      degrees,
      minimum,
      maximum,
      steepness,
      ratio
    )
  );

export const transpose = <T>(matrix: Matrix<T>) =>
  matrixFactory(matrix[0].length, matrix.length, (x, y) => matrix[y][x]);

export const addMatrices = (...matrices: number[][][]) =>
  matrixFactory(matrices[0].length, matrices[0][0].length, (x, y) =>
    sum(matrices.map((matrix) => matrix[x][y]))
  );

export const multiplyMatrices = (...matrices: number[][][]) =>
  matrixFactory(matrices[0].length, matrices[0][0].length, (x, y) =>
    product(matrices.map((matrix) => matrix[x][y]))
  );

export const maxMatrices = (...matrices: number[][][]) =>
  matrixFactory(matrices[0].length, matrices[0][0].length, (x, y) =>
    Math.max(...matrices.map((matrix) => matrix[x][y]))
  );

export const minMatrices = (...matrices: number[][][]) =>
  matrixFactory(matrices[0].length, matrices[0][0].length, (x, y) =>
    Math.min(...matrices.map((matrix) => matrix[x][y]))
  );

export const getOverlappingCell = <T>(
  matrix: Matrix<T>,
  x: number,
  y: number
) => {
  const width = matrix.length;
  const height = matrix[0].length;
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
  const normalizedX = normalize(x, width);
  const normalizedY = normalize(y, height);
  matrix[normalizedX][normalizedY] = value;
};

export const setPath = <T>(
  matrix: Matrix<T>,
  x: number,
  y: number,
  value: T,
  tiling = true
) => {
  const width = matrix.length / 2;
  const height = matrix[0].length / 2;
  const normalizedX = normalize(x, width);
  const normalizedY = normalize(y, height);

  setMatrix(matrix, normalizedX, normalizedY, value);
  if (!tiling) return;

  setMatrix(matrix, normalizedX, normalizedY + height, value);
  setMatrix(matrix, normalizedX + width, normalizedY, value);
  setMatrix(matrix, normalizedX + width, normalizedY + height, value);
};
