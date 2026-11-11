# Spell Tests

Spell tests equip native items in small area worlds, then trigger the normal player or NPC casting path. Equipment settles before mana is set. Completion checks wait for active spell sequences rather than assuming a fixed number of frames.
<!-- source-types -->

## SpellItem

```ts src/features/spells/helpers.ts
export type SpellItem = {
  spell: Spell;
  material?: Material;
  element?: Element;
};
```

## SpellWorldOptions

```ts src/features/spells/helpers.ts
export type SpellWorldOptions = {
  mp?: number;
  legend?: Record<string, string>;
  size?: number;
};
```
