# Player

Stores player input, quick items, popup state, chat history and combat counters.

[Trigger](../systems/trigger.md) consumes queued actions. [Consume](../systems/consume.md) and combat update received stats and counters. [Saved games](../../game/saves/index.md) stores whole-game kills and deaths.

| Field           | Meaning                                                        |
| --------------- | -------------------------------------------------------------- |
| `kills`         | Whole-game kill count used by save summaries.                  |
| `deaths`        | Whole-game death count used by save summaries.                 |
| `defeatedUnits` | Per-level totals used by quests.                               |
| `receivedStats` | Cumulative received amounts observed by effects and UI caches. |

The optional `accountId` is a public server-owned account binding, not a reconnect secret. It survives ghost and hero replacement. Only authenticated server code assigns it; client input messages cannot set player identity.

`username` is the saved server display name. `admin` is authoritative runtime permission; host saves omit it. `naming` and `nameError` hold the initial private chat prompt. Names and permissions survive death, revival and portal transfers. `interface.server` identifies the private administration output window.

<!-- source-types -->

## Interaction

```ts src/engine/components/player.ts
export type Interaction = {
  position: Position;
  size: Position;
  active?: number;
  last?: number;
  origin: Position;
};
```

## Player

```ts src/engine/components/player.ts
export type Player = {
  accountId?: string;
  username?: string;
  admin?: boolean;
  naming?: boolean;
  nameError?: string;
  rewardOffsets?: Partial<Record<LevelName, number>>;
  connected?: boolean;
  interface?: {
    use: number;
    inspect: number;
    server?: number;
    focus?: number;
    prompts?: Record<number, number>;
  };
  interact?: Interaction;
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
