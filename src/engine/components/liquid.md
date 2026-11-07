# LIQUID

Marks liquid terrain.

`Liquid`

| Field | Type |
| --- | --- |
| `type` | `"splash" \| "drop" \| "bubble"` |
| `timestamp?` | `number` |
| `amount` | `number` |

Attach with `world.addComponentToEntity(entity, LIQUID, data)`. Query with `world.getEntities([LIQUID])`.

Systems: `build`, `water`.
<!-- source-types -->

## Liquid

```ts src/engine/components/liquid.ts
export type Liquid = { type: "splash" | "drop" | "bubble", timestamp?: number, amount: number };
```
