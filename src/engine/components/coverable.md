# COVERABLE

Controls covered terrain and reveal state.

`Coverable`

| Field | Type |
| --- | --- |
| `type` | `"snow"` |

Attach with `world.addComponentToEntity(entity, COVERABLE, data)`. Query with `world.getEntities([COVERABLE])`.

Systems: `freeze`.
<!-- source-types -->

## Coverable

```ts src/engine/components/coverable.ts
export type Coverable = { type: "snow" };
```
