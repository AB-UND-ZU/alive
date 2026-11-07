# ENTERABLE

Stores building or room entry information.

`Enterable`

| Field | Type |
| --- | --- |
| `sprite` | `Sprite` |
| `orientation?` | `Orientation \| null` |

Attach with `world.addComponentToEntity(entity, ENTERABLE, data)`. Query with `world.getEntities([ENTERABLE])`.

Systems: `enter`, `harvest`, `trigger`.
<!-- source-types -->

## Enterable

```ts src/engine/components/enterable.ts
export type Enterable = {
  sprite: Sprite;
  orientation?: Orientation | null;
};
```
