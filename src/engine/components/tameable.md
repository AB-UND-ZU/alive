# Tameable

Stores the owner, favourite foods, feeding XP values, skills and personality of a [pet](../../../wiki/animals.md). The pet’s level and current XP are stored in [Stats](stats.md).
A true attribute is a like, a false attribute is a dislike, and an absent attribute is neutral.
<!-- source-types -->

## PetTrait

```ts src/engine/components/tameable.ts
export type PetTrait = (typeof petTraits)[number];
```

## PetSkill

```ts src/engine/components/tameable.ts
export type PetSkill = (typeof petSkills)[number];
```

## PetFood

```ts src/engine/components/tameable.ts
export type PetFood = Omit<Item, "amount" | "carrier" | "bound">;
```

## Tameable

```ts src/engine/components/tameable.ts
export type Tameable = {
  owner?: number;
  favourites: { item: PetFood; xp: number }[];
  stat: "hp" | "melee" | "armor" | "haste";
  attributes: Partial<Record<PetTrait, boolean>>;
  skills: PetSkill[];
  thirsty?: boolean;
  kills?: number;
  healingHits?: number;
  ghost?: SpriteRef;
};
```
