# Equippable

References the equipped items for each equipment slot.

Slots hold item entity IDs, not item definitions. An absent key means an empty slot. [Consume](../systems/consume.md) observes equipment changes and applies their stat bonuses.
<!-- source-types -->

## Slot

```ts src/engine/components/equippable.ts
export type Slot = (typeof slots)[number];
```

## Gear

```ts src/engine/components/equippable.ts
export type Gear = (typeof gear)[number];
```

## Accessory

```ts src/engine/components/equippable.ts
export type Accessory = (typeof accessories)[number];
```

## Equipment

```ts src/engine/components/equippable.ts
export type Equipment = (typeof equipments)[number];
```

## Equippable

```ts src/engine/components/equippable.ts
export type Equippable = {
  [key in Equipment]?: number;
};
```
