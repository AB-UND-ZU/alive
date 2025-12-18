import { aspectRatio } from "../../components/Dimensions/sizing";
import {
  getDistance,
  lerp,
  normalize,
  Point,
  product,
  sigmoid,
  signedDistance,
  sum,
} from "./std";
import { pointToDegree } from "./tracing";

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

export const mapMatrix = <T>(
  matrix: Matrix<T>,
  callback: (x: number, y: number, value: T) => T
) =>
  matrixFactory(matrix[0].length, matrix.length, (x, y) =>
    callback(x, y, matrix[x][y])
  );

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
  matrixFactory(width, height, (x, y) => {
    const distance = getDistance({ x, y }, center, width, ratio);
    const value = 1 - sigmoid(distance, radius, steepness);
    return lerp(minimum, maximum, value);
  });

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
  matrixFactory(width, height, (x, y) => {
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
  });

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
  matrixFactory(width, height, (x, y) => {
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
  });

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

export const setPath = <T>(
  matrix: Matrix<T>,
  x: number,
  y: number,
  value: T,
  tiling = true
) => {
  const width = matrix.length / 2;
  const height = matrix[0].length / 2;
  const normalizedX = normalize(x + width, width);
  const normalizedY = normalize(y + height, height);

  setMatrix(matrix, normalizedX, normalizedY, value);
  if (!tiling) return;

  setMatrix(matrix, normalizedX, normalizedY + height, value);
  setMatrix(matrix, normalizedX + width, normalizedY, value);
  setMatrix(matrix, normalizedX + width, normalizedY + height, value);
};
