# EQUIPPABLE

References the equipped items for each equipment slot.

Attach with `world.addComponentToEntity(entity, EQUIPPABLE, data)`. Query with `world.getEntities([EQUIPPABLE])`.

Systems: `action`, `ai`, `build`, `collect`, `consume`, `damage`, `drop`, `fate`, `fishing`, `harvest`, `magic`, `map`, `movement`, `popup`, `renderer`, `spike`, `trigger`, `vessel`.
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
