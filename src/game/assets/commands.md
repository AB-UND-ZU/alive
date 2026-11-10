# Game commands

| Export                         | Contract                                                               |
| ------------------------------ | ---------------------------------------------------------------------- |
| `commandSignatures`            | Executor, argument bounds, usage, and alias for every command          |
| `commandItems`                 | Names accepted by give/cast and their item definitions                 |
| `commandMods` / `commandLists` | Values shown by `/list`                                                |
| `parseCommand`                 | Parse a slash command; expand aliases; unknown names fall back to help |
| `executeCommand`               | Check argument count, then call the registered executor                |

Normal text is handled by the chat dialog. `Controls` and the chat popup gate command input behind `TEST_MODE`. The wiki imports the registry rather than maintaining a separate set of names.

`/mod reset` restores class/level stats. It is included in `/list mod` along with the other implemented mods.
<!-- source-types -->

## CommandCall

```ts src/game/assets/commands.ts
export type CommandCall = {
  handler: string;
  args: string[];
};
```

## CommandSignature

```ts src/game/assets/commands.ts
export type CommandSignature = {
  executor: (
    world: World,
    entity: Entity,
    ...args: string[]
  ) => string | Sprite[] | void;
  minArgs: number;
  maxArgs: number;
  usage: string;
  short: string;
};
```

`completeCommand(world, input, selection = 0)` returns the suggested suffix and a trailing space. It reads accepted command arguments from the game data and current positioned identifiers from the world. Give suggests an amount of 10, and New suggests one cell. Coordinates and new pin names remain free-form. Give variants must have an actual item sprite; missing combinations are omitted. Typing a longer prefix narrows the suggested word. The selection wraps through matching words in both directions.

Submitted lines are trimmed. `/new air [num] [dir]` clears cells; `/new` without a cell only shows its usage.
