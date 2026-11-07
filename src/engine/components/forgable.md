# FORGABLE

Stores the state and timing of the anvil interaction.

`ForgeStep`

| Field | Type |
| --- | --- |
| `item` | `Omit<Item, "carrier" \| "bound" \| "amount">` |
| `width` | `number` |
| `offset` | `number` |

`Forgable`

| Field | Type |
| --- | --- |
| `steps` | `ForgeStep[]` |
| `progress` | `number` |
| `lastElapsed` | `number` |
| `lastAction?` | `"swing" \| "trigger" \| "hit" \| "miss"` |
| `hitIndex?` | `number` |
| `completed?` | `Omit<Item, "carrier" \| "bound" \| "amount">` |

Attach with `world.addComponentToEntity(entity, FORGABLE, data)`. Query with `world.getEntities([FORGABLE])`.

Systems: `popup`.
<!-- source-types -->

## ForgeStep

```ts src/engine/components/forgable.ts
export type ForgeStep = {
  item: Omit<Item, "carrier" | "bound" | "amount">;
  width: number;
  offset: number;
};
```

## Forgable

```ts src/engine/components/forgable.ts
export type Forgable = {
  steps: ForgeStep[];
  progress: number;
  lastElapsed: number;
  lastAction?: "swing" | "trigger" | "hit" | "miss";
  hitIndex?: number;
  completed?: Omit<Item, "carrier" | "bound" | "amount">;
};
```
