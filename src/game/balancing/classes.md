# classes.ts
<!-- source-types -->

## ClassKey

```ts src/game/balancing/classes.ts
export type ClassKey = (typeof classes)[number];
```

## ClassDefinition

```ts src/game/balancing/classes.ts
export type ClassDefinition = {
  sprite: Sprite;
  backdrop?: Sprite;
  swimming?: Sprite;
  swimmingBackdrop?: Sprite;
  items: ({ slot: Equipment } | { stackable: Stackable })[];

  stats: Omit<UnitStats, "hp" | "mp" | "xp">;
};
```
