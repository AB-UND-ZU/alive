# TOOLTIP

Stores proximity text and dialog timing.

`Tooltip`

| Field | Type |
| --- | --- |
| `idle?` | `Sprite` |
| `dialogs` | `Sprite[][]` |
| `nextDialog` | `number` |
| `persistent` | `boolean` |
| `override?` | `"visible" \| "hidden"` |
| `changed?` | `boolean` |
| `enemy?` | `boolean` |
| `lastTooltip?` | `number` |

Attach with `world.addComponentToEntity(entity, TOOLTIP, data)`. Query with `world.getEntities([TOOLTIP])`.

Systems: `ai`, `fate`, `popup`, `text`, `trigger`.
<!-- source-types -->

## Tooltip

```ts src/engine/components/tooltip.ts
export type Tooltip = {
  idle?: Sprite;
  dialogs: Sprite[][];
  nextDialog: number;
  persistent: boolean;
  override?: "visible" | "hidden";
  changed?: boolean;
  enemy?: boolean;
  lastTooltip?: number;
};
```
