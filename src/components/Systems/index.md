# Systems Renderer

Advances the ECS at 30 fixed updates per second while the world is running. It accumulates render-frame time, bounds catch-up work and skips updates while paused or suspended.

The same component renders entities around the viewpoint and applies screen shake after new damage. Loading a hero seeds the damage counter, so old hits do not shake a restored game. A viewpoint jump resets overscan immediately.

Shadow casters come from the circular visibility trace at the hero's current and previous positions, tracked with `useOverscan`. The two footprints are cached until a position, light radius or opaque geometry changes. Unrelated generations and blocked input do not advance the history. There is no animation-completion tracking.
