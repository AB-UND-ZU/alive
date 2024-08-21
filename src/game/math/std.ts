export type Point = { x: number; y: number };

export const add = (first: Point, second: Point) => ({
  x: first.x + second.x,
  y: first.y + second.y,
});

export const sum = (numbers: number[]) =>
  numbers.reduce((total, number) => total + number);

export const normalize = (number: number, modulo: number) =>
  ((number % modulo) + modulo) % modulo;

export function* reversed<T>(array: T[]) {
  for (let i = array.length - 1; i >= 0; i--) {
    yield array[i];
  }
}

export const random = (minimum: number, maximum: number) =>
  Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
