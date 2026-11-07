# CLICKABLE

Records a pending pointer click.

`Clickable`

| Field | Type |
| --- | --- |
| `clicked` | `boolean` |
| `player` | `boolean` |

Attach with `world.addComponentToEntity(entity, CLICKABLE, data)`. Query with `world.getEntities([CLICKABLE])`.

Systems: `ai`, `click`, `freeze`, `movement`.
<!-- source-types -->

## Clickable

```ts src/engine/components/clickable.ts
export type Clickable = {
  clicked: boolean;
  player: boolean;
};
```
