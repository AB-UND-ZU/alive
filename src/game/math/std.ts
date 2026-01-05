import { aspectRatio } from "../../components/Dimensions/sizing";

export type Point = { x: number; y: number };

export const id = <T>(value: T): T => value;

export const copy = (position: Point) => ({ x: position.x, y: position.y });

export const add = (first: Point, second: Point) => ({
  x: first.x + second.x,
  y: first.y + second.y,
});

export const combine = (size: number, ...points: Point[]) => ({
  x: normalize(sum(points.map((point) => point.x)), size),
  y: normalize(sum(points.map((point) => point.y)), size),
});

export const sum = (numbers: number[]) =>
  numbers.reduce((total, number) => total + number, 0);

export const product = (numbers: number[]) =>
  numbers.reduce((total, number) => total * number, 1);

export const normalize = (number: number, modulo: number) =>
  ((number % modulo) + modulo) % modulo;

export const directedDistance = (start: number, end: number, size: number) => {
  const delta = normalize(end, size) - normalize(start, size);
  return delta >= 0 ? delta : delta + size;
};

export const signedDistance = (start: number, end: number, size: number) => {
  const distance = (((end - start) % size) + size) % size;
  const overlap =
    Math.abs(distance) > size / 2 ? Math.sign(distance) * size : 0;
  return distance - overlap;
};

// euclidean distance for positive ratios, otherwise distance in blocks
export const getDistance = (
  origin: Point,
  target: Point,
  size: number,
  ratio: number = aspectRatio,
  euclidean: boolean = true
) => {
  const delta = {
    x: signedDistance(origin.x, target.x, size) * ratio,
    y: signedDistance(origin.y, target.y, size),
  };

  if (!euclidean) {
    return Math.max(Math.abs(delta.x), Math.abs(delta.y));
  }

  return Math.sqrt(delta.x ** 2 + delta.y ** 2);
};

export const within = (
  topLeft: Point,
  bottomRight: Point,
  target: Point,
  size: number
) => {
  const width = directedDistance(topLeft.x, bottomRight.x, size);
  const height = directedDistance(topLeft.y, bottomRight.y, size);
  const horizontal = directedDistance(topLeft.x, target.x, size);
  const vertical = directedDistance(target.y, bottomRight.y, size);

  return (
    0 <= horizontal &&
    horizontal <= width &&
    0 <= vertical &&
    vertical <= height
  );
};

export const angledOffset = (
  size: number,
  origin: Point,
  degrees: number,
  distance: number,
  ratio: number = aspectRatio
): Point => {
  const radians = ((degrees - 90) * Math.PI) / 180;

  const offset: Point = {
    x: (Math.cos(radians) * distance) / ratio,
    y: Math.sin(radians) * distance,
  };
  const result = add(origin, offset);

  return {
    x: normalize(Math.round(result.x), size),
    y: normalize(Math.round(result.y), size),
  };
};

export function* reversed<T>(array: T[]) {
  for (let i = array.length - 1; i >= 0; i--) {
    yield array[i];
  }
}

export const random = (minimum: number, maximumInclusive: number) =>
  Math.min(
    Math.floor(Math.random() * (maximumInclusive - minimum + 1)) + minimum,
    maximumInclusive
  );

export const distribution = (...counts: number[]) => {
  const total = sum(counts);
  const selection = random(1, total);

  let index = 0;
  let accumulated = 0;

  while (index < counts.length - 1) {
    accumulated += counts[index];

    if (selection <= accumulated) break;

    index += 1;
  }

  return index;
};

export const choice = <T>(...choices: T[]) =>
  choices[random(0, choices.length - 1)];

export const shuffle = <T>(unshuffled: T[]) =>
  unshuffled
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

export const range = (start: number, endInclusive: number) =>
  Array.from({ length: endInclusive - start + 1 }).map(
    (_, index) => index + start
  );

export const repeat = <T>(obj: T, count: number) =>
  Array.from({ length: count }, () => obj);

export const padCenter = (text: string, length: number, char = " ") =>
  text
    .padStart(Math.floor((text.length + length) / 2), char)
    .padEnd(length, char);

export const lerp = (start: number, end: number, ratio: number) =>
  start + (end - start) * ratio;

export const sigmoid = (
  value: number,
  midpoint: number,
  steepness: number = 1
) => 1 / (1 + Math.exp(-steepness * (value - midpoint)));

export const lcg = (seed: number) => Math.abs((seed * 9301 + 49297) % 233280);

export const clamp = (input: number, low: number, high: number) =>
  Math.min(Math.max(input, low), high);
