# Class Data

Defines initial appearance, equipment and stats for each class key. Availability in the normal class-selection dialog is separate from having a data definition.

| Export           | Contract                                                                 |
| ---------------- | ------------------------------------------------------------------------ |
| classes          | All class keys accepted by the class data API                            |
| classDefinitions | Shared base definitions for those keys                                   |
| getClassData     | Copy stats and recolor the class sprite/swimming sprite for a hair color |

Do not mutate `classDefinitions` to change one hero. Call `getClassData`, then populate that entity from the result. [Leveling](../../engine/systems/leveling.md) supplies level growth; the initial class definition is not a level-10 stat table.

```ts src/game/balancing/classes.ts
const rogue = getClassData("rogue", colors.white);
```
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
