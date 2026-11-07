# HOOKABLE

Stores fishing-hook attachment and escape state.

`Hookable`

| Field | Type |
| --- | --- |
| `hooked?` | `number` |
| `catching?` | `number` |
| `escaping` | `boolean` |

Attach with `world.addComponentToEntity(entity, HOOKABLE, data)`. Query with `world.getEntities([HOOKABLE])`.

Systems: `ai`, `drop`, `fishing`, `trigger`.
<!-- source-types -->

## Hookable

```ts src/engine/components/hookable.ts
export type Hookable = {
  hooked?: number;
  catching?: number;
  escaping: boolean;
};
```
