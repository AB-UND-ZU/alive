# Identifiable

Names an entity for quests, commands, and lookups.

Use `setIdentifier` when naming an entity so lookup caches stay consistent. [AI](../systems/ai.md) and quest sequences use these stable names instead of hard-coded entity IDs.
<!-- source-types -->

## Identifiable

```ts src/engine/components/identifiable.ts
export type Identifiable = {
  name: string;
};
```
