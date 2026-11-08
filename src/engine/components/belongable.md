# Belongable

Assigns the faction used for cooperation and hostility checks.

[Damage](../systems/damage.md) uses the faction for hostility, cooperation and friendly-fire checks. The same relationship checks apply to healing.
<!-- source-types -->

## Faction

```ts src/engine/components/belongable.ts
export type Faction =
  | (typeof tribes)[number]
  | (typeof enemies)[number]
  | (typeof neutrals)[number];
```

## Belongable

```ts src/engine/components/belongable.ts
export type Belongable = {
  faction: Faction;
};
```
