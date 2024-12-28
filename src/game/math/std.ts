import { aspectRatio } from "../../components/Dimensions/sizing";

export type Point = { x: number; y: number };

export const copy = (position: Point) => ({ x: position.x, y: position.y });

export const add = (first: Point, second: Point) => ({
  x: first.x + second.x,
  y: first.y + second.y,
});

export const sum = (numbers: number[]) =>
  numbers.reduce((total, number) => total + number);

export const normalize = (number: number, modulo: number) =>
  ((number % modulo) + modulo) % modulo;

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

export const shuffle = <T>(unshuffled: T[]) =>
  unshuffled
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

export const repeat = <T>(obj: T, count: number) =>
  Array.from({ length: count }).map(() => obj);

export const padCenter = (text: string, length: number) =>
  text
    .padStart(Math.floor((text.length + length) / 2), " ")
    .padEnd(length, " ");

export const lerp = (start: number, end: number, ratio: number) =>
  start + (end - start) * ratio;

export const sigmoid = (
  value: number,
  midpoint: number,
  steepness: number = 1
) => 1 / (1 + Math.exp(-steepness * (value - midpoint)));
