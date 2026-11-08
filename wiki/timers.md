# Tick Timers

World references advance the simulation. Player references determine when an action is ready. Sequences track their own elapsed time for animation and delayed effects. Pausing stops the systems update.

```widget
timers
```

```ts src/engine/systems/movement.ts
const tickMs = Math.floor(
  1000 / (Math.max(haste, -4) + 5) + 100
);
```

The formula gives milliseconds per reference tick. Popup selection uses [[data:175 ms]]; chat input uses [[data:10 ms]].
