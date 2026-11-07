# Command Input

`completeCommand(input)` returns full command-line suggestions. It reads command names and aliases from `commandSignatures`, item names from `commandItems`, and argument values from the engine's item, stat, NPC, and cell definitions.

```ts
completeCommand("/give sw");
// ["/give sword"]

completeCommand("/give potion 10 wood m");
// ["/give potion 10 wood mp"]
```

Completion does not execute or validate a command. The game's parser and executor handle execution and errors.
