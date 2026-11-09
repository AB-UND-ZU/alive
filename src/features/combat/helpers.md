# Combat Tests

Small area worlds for combat feature tests. The hero starts with enough health to survive several hits; target AI can be disabled so damage and effects can be checked without unrelated movement. Attacks run through the normal systems. Loot helpers read actual inventories and ground containers.
<!-- source-types -->

## Drop

```ts src/features/combat/helpers.ts
export type Drop = { item: Item; position: Position };
```
