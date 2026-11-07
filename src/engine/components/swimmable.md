# SWIMMABLE

Tracks immersion and swimming appearance.

`Swimmable`

| Field | Type |
| --- | --- |
| `swimming` | `boolean` |
| `sprite?` | `Sprite` |

Attach with `world.addComponentToEntity(entity, SWIMMABLE, data)`. Query with `world.getEntities([SWIMMABLE])`.

Systems: `burn`, `drop`, `fate`, `freeze`, `immersion`, `leveling`, `magic`, `trigger`.
<!-- source-types -->

## Swimmable

```ts src/engine/components/swimmable.ts
export type Swimmable = {
  swimming: boolean,
  sprite?: Sprite
};
```
