# Bumpable

Records a bump direction and the generation that produced it.

[Click](../systems/click.md), [Movement](../systems/movement.md) and combat use the bump generation and direction to distinguish a new attempt from a held input.

| Field        | Meaning                                         |
| ------------ | ----------------------------------------------- |
| `generation` | Changes for a new bump; it is not elapsed time. |
<!-- source-types -->

## Bumpable

```ts src/engine/components/bumpable.ts
export type Bumpable = {
  generation: number;
  orientation?: Orientation;
};
```
