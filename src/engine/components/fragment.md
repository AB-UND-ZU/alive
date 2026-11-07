# FRAGMENT

Links a structure fragment to its root entity.

`Fragment`

| Field | Type |
| --- | --- |
| `structure` | `number` |

Attach with `world.addComponentToEntity(entity, FRAGMENT, data)`. Query with `world.getEntities([FRAGMENT])`.

Systems: `action`, `ai`, `ballistics`, `burn`, `click`, `damage`, `drop`, `enter`, `harvest`, `magic`, `movement`, `trigger`, `visibility`.
<!-- source-types -->

## Fragment

```ts src/engine/components/fragment.ts
export type Fragment = {
  structure: number;
};
```
