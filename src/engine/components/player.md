# PLAYER

Stores player input, quick items, popup state, chat history, and combat counters. `kills` and `deaths` count the whole game and appear in save summaries; `defeatedUnits` resets per level for quests.

`Player`

| Field | Type |
| --- | --- |
| `ghost` | `boolean` |
| `receivedStats` | `Record< keyof (Pick<Countable, "hp" \| "maxHp" \| "mp" \| "maxMp" \| "xp"> & Pick<Castable, "melee" \| "magic" \| "true">), number >` |
| `defeatedUnits` | `Partial<Record<UnitKey, number>>` |
| `kills` | `number` |
| `deaths` | `number` |
| `popup?` | `number` |
| `mount?` | `number` |
| `quickItems` | `Record<string, Omit<Item, "bound" \| "amount" \| "carrier">>` |
| `chatHistory` | `number[][]` |
| `actionTriggered?` | `\| "inspect" \| "use" \| "map" \| "gear" \| "stats" \| "equip" \| "chat" \| "close" \| "tab" \| "backtab" \| "left" \| "right" \| "up" \| "down" \| "content" \| "type" \| "build"` |
| `tabTriggered?` | `number` |
| `contentTriggered?` | `number` |
| `offsetTriggered?` | `number` |

Attach with `world.addComponentToEntity(entity, PLAYER, data)`. Query with `world.getEntities([PLAYER])`.

Systems: `action`, `ai`, `ballistics`, `click`, `collect`, `consume`, `damage`, `drop`, `enter`, `fate`, `focus`, `freeze`, `harvest`, `homing`, `interact`, `leveling`, `magic`, `movement`, `needle`, `popup.test`, `popup`, `push`, `text`, `trigger`, `vessel`, `water`.
<!-- source-types -->

## Player

```ts src/engine/components/player.ts
export type Player = {
  ghost: boolean;
  receivedStats: Record<
    keyof (Pick<Countable, "hp" | "maxHp" | "mp" | "maxMp" | "xp"> &
      Pick<Castable, "melee" | "magic" | "true">),
    number
  >;
  defeatedUnits: Partial<Record<UnitKey, number>>;
  // totals of the whole game, unlike defeated units of current level
  kills: number;
  deaths: number;
  popup?: number;
  mount?: number;
  quickItems: Record<string, Omit<Item, "bound" | "amount" | "carrier">>;
  chatHistory: number[][];
  actionTriggered?:
    | "inspect"
    | "use"
    | "map"
    | "gear"
    | "stats"
    | "equip"
    | "chat"
    | "close"
    | "tab"
    | "backtab"
    | "left"
    | "right"
    | "up"
    | "down"
    | "content"
    | "type"
    | "build";
  tabTriggered?: number;
  contentTriggered?: number;
  offsetTriggered?: number;
};
```
