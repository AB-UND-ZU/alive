# MOUNTABLE

Tracks a vessel and its passenger.

`Mountable`

| Field | Type |
| --- | --- |
| `passenger?` | `number` |
| `medium` | `"water" \| "rails"` |
| `spring?` | `SpringConfig` |

Attach with `world.addComponentToEntity(entity, MOUNTABLE, data)`. Query with `world.getEntities([MOUNTABLE])`.

Systems: `click`, `interact`, `movement`, `push`, `trigger`, `vessel`.
<!-- source-types -->

## Mountable

```ts src/engine/components/mountable.ts
export type Mountable = {
  passenger?: number;
  medium: "water" | "rails";
  spring?: SpringConfig;
};
```
