export const sum = (numbers: number[]) =>
  numbers.reduce((total, number) => total + number, 0);

export const normalize = (number: number, modulo: number) =>
  ((number % modulo) + modulo) % modulo;

export function* reversed<T>(array: T[]) {
  for (let i = array.length - 1; i >= 0; i--) {
    yield array[i];
  }
}
