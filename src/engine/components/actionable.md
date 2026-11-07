# ACTIONABLE

Tracks available contextual actions and queued spell, skill, and interaction input.

Attach with `world.addComponentToEntity(entity, ACTIONABLE, data)`. Query with `world.getEntities([ACTIONABLE])`.

Systems: `action`, `ai`, `collect`, `fate`, `fishing`, `popup.test`, `popup`, `trigger`.
<!-- source-types -->

## Actionable

```ts src/engine/components/actionable.ts
export type Actionable = {
  spellTriggered: boolean;
  skillTriggered: boolean;
  interactTriggered: boolean;
  toolEquipped: boolean;
} & Partial<Record<(typeof actions)[number], number | undefined>>;
```
