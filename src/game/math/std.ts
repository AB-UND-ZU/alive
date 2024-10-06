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
  const distance = (end - start) % size;
  const overlap =
    Math.abs(distance) > size / 2 ? Math.sign(distance) * size : 0;
  return distance - overlap;
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

export const repeat = <T>(obj: T, count: number) =>
  Array.from({ length: count }).map(() => obj);

export const padCenter = (text: string, length: number) =>
  text
    .padStart(Math.floor((text.length + length) / 2), " ")
    .padEnd(length, " ");
