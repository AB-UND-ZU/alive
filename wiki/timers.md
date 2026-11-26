# Tick Timers

World references advance the simulation. Player references determine when an action is ready. Sequences track their own elapsed time for animation and delayed effects. Pausing stops the systems update.

```widget
timers
```

```ts src/engine/systems/movement.ts
Math.floor(1350 / (Math.max(haste, -5) + 6) + 125)
```

Base hero haste is 2 (293 ms), or 3 for a Rogue (275 ms). Haste bottoms out at -5 (1475 ms). Popup selection takes 175 ms and chat input takes 10 ms.
