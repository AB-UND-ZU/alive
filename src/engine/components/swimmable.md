# Swimmable

Tracks immersion and swimming appearance.

[Immersion](../systems/immersion.md) changes the swimming flag and stores the original sprite while a swimming appearance is shown.
<!-- source-types -->

## Swimmable

```ts src/engine/components/swimmable.ts
export type Swimmable = {
  swimming: boolean,
  sprite?: Sprite
};
```
