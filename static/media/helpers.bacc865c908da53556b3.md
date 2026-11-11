# Station Tests

Workstation tests create native traders and popups, open them through player interactions and wait for their animations. Selection and forging helpers use the game's timing and recipe data; they do not simulate purchases or recipe results.
<!-- source-types -->

## PopupEntity

```ts src/features/workstations/helpers.ts
export type PopupEntity = TypedEntity<"POPUP" | "POSITION" | "SEQUENCABLE">;
```

## AnvilEntity

```ts src/features/workstations/helpers.ts
export type AnvilEntity = TypedEntity<
  "FORGABLE" | "POPUP" | "POSITION" | "SEQUENCABLE"
>;
```
