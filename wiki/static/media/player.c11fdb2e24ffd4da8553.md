# Player

Stores player input, quick items, popup state, chat history and combat counters.

[Trigger](../systems/trigger.md) consumes queued actions. [Consume](../systems/consume.md) and combat update received stats and counters. [Saved games](../../game/saves/index.md) stores whole-game kills and deaths.

| Field           | Meaning                                                        |
| --------------- | -------------------------------------------------------------- |
| `kills`         | Whole-game kill count used by save summaries.                  |
| `deaths`        | Whole-game death count used by save summaries.                 |
| `defeatedUnits` | Per-level totals used by quests.                               |
| `receivedStats` | Cumulative received amounts observed by effects and UI caches. |
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
    | "scroll"
    | "type"
    | "build";
  tabTriggered?: number;
  contentTriggered?: number;
  offsetTriggered?: number;
};
```
