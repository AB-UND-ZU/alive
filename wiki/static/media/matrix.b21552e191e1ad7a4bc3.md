# Matrices

Matrices are column-first: `matrix[x][y]`. Level matrices are square and their access helpers wrap coordinates at the edges.

| Function                | Contract                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------- |
| iterateMatrix           | Visit columns then rows                                                             |
| iterateMatrixFromCenter | Search outward on a square matrix; a truthy callback stops and returns its position |
| matrixFactory           | Allocate values by x/y callback                                                     |
| createMatrix            | Fill with the supplied value                                                        |
| mapMatrix               | Transform values; existing callers use square matrices                              |
| circularKernel          | Value contributed by a circular region                                              |
| circularMatrix          | Sample the circular kernel into a matrix                                            |
| rectangleKernel         | Value contributed by a rotated rectangle                                            |
| rectangleMatrix         | Sample the rectangle kernel                                                         |
| gradientKernel          | Value along a directed gradient                                                     |
| gradientMatrix          | Sample the gradient kernel                                                          |
| transpose               | Swap rows and columns                                                               |
| addMatrices             | Add corresponding values                                                            |
| multiplyMatrices        | Multiply corresponding values                                                       |
| maxMatrices             | Greatest corresponding value                                                        |
| minMatrices             | Smallest corresponding value                                                        |
| getOverlappingCell      | Read with wrapping on both axes                                                     |
| setMatrix               | Write with wrapping on both axes                                                    |
| setPath                 | Write the matching copies in a doubled path matrix                                  |

`createMatrix` reuses its value rather than cloning it. Use `matrixFactory` for independent objects in each cell. Use square matrices with `mapMatrix`; its current output allocation swaps the input dimensions.

```ts src/game/math/matrix.ts
const cells = createMatrix(4, 4, 0);
setMatrix(cells, -1, 0, 7);
getOverlappingCell(cells, 3, 0); // 7
```

[Map](../../engine/systems/map.md) keeps duplicated walkability entries in sync with `setPath`.
<!-- source-types -->

## Matrix

```ts src/game/math/matrix.ts
export type Matrix<T> = T[][];
```
