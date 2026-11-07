# STRUCTURABLE

Tracks a multi-cell structure and its fragments.

`Structurable`

| Field | Type |
| --- | --- |
| `rigid?` | `boolean` |

Attach with `world.addComponentToEntity(entity, STRUCTURABLE, data)`. Query with `world.getEntities([STRUCTURABLE])`.

Systems: `burn`, `damage`, `drop`, `enter`, `movement`, `spike`, `visibility`.
<!-- source-types -->

## Structurable

```ts src/engine/components/structurable.ts
export type Structurable = {
  rigid?: boolean;
};
```
