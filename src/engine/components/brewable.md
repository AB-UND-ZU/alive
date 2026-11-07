# BREWABLE

Stores a kettle’s recipe queue.

`Brewable`

| Field | Type |
| --- | --- |
| `queue` | `{ item: Omit<Item, "carrier" \| "bound">; generation?: number; duration: number; }[]` |

Attach with `world.addComponentToEntity(entity, BREWABLE, data)`. Query with `world.getEntities([BREWABLE])`.

Systems: `harvest`.
<!-- source-types -->

## Brewable

```ts src/engine/components/brewable.ts
export type Brewable = {
  queue: {
    item: Omit<Item, "carrier" | "bound">;
    generation?: number;
    duration: number;
  }[];
};
```
