# Orientable

Stores the direction used for attacks and directional sprites.

[Movement](../systems/movement.md) and attacks update facing. [Sprite helpers](../../game/assets/ui.md) use it to select directional layers.
<!-- source-types -->

## Orientation

```ts src/engine/components/orientable.ts
export type Orientation = (typeof orientations)[number];
```

## Orientable

```ts src/engine/components/orientable.ts
export type Orientable = {
  facing?: Orientation;
};
```
