export const sum = (numbers: number[]) =>
  numbers.reduce((total, number) => total + number, 0);

export const normalize = (number: number, modulo: number) =>
  ((number % modulo) + modulo) % modulo;
