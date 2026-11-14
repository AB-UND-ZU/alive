# Terminal input

`TerminalKey` accepts the name, sequence and modifier fields supplied by Node's
readline keypress events. `createTerminalInput(world)` returns `press` and
`stop`. It sets the same movement/reference and action flags as browser
controls, and uses the engine's direct typing, completion and history APIs
while chat is open. It queues normal game actions. Escape closes an active popup immediately through the engine's close helper, retaining the normal Back action where available.

Terminal keyboards lack keyup events; a 100 ms timeout releases movement.
A new key event extends that hold. `stop` releases it immediately, including
when pausing, leaving or replacing a world. Dialog actions release movement before
confirming, so a recent selection move cannot swallow Enter. In test mode, Enter
opens chat when no interaction is available. Credit links use the URL callback
passed to `createTerminalInput`; browser previews open a new tab and the native
client uses the operating system URL opener.

<!-- source-types -->

## Action

```ts src/renderers/terminal/input.ts
type Action =
  | NonNullable<Player["actionTriggered"]>
  | "spell"
  | "skill"
  | "interact";
```

## TerminalKey

```ts src/renderers/terminal/input.ts
export type TerminalKey = {
  name?: string;
  sequence?: string;
  shift?: boolean;
  ctrl?: boolean;
};
```
