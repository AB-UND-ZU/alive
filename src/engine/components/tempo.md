# TEMPO

Modifies action timing on a cell.

`Tempo`

| Field | Type |
| --- | --- |
| `amount` | `number` |

Attach with `world.addComponentToEntity(entity, TEMPO, data)`. Query with `world.getEntities([TEMPO])`.

Systems: `freeze`, `harvest`, `movement`.
<!-- source-types -->

## Tempo

```ts src/engine/components/tempo.ts
export type Tempo = {
  amount: number;
};
```
