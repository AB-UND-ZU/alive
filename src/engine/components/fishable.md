# Fishable

Stores the population of a fish habitat.

[AI](../systems/ai.md) manages habitat population and creates or removes the visible fish. Individual hook attachment uses [Hookable](hookable.md).
<!-- source-types -->

## Fishable

```ts src/engine/components/fishable.ts
export type Fishable = {
  population: number;
};
```
