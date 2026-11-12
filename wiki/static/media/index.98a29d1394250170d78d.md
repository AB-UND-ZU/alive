# Systems Renderer

Advances the ECS at 30 fixed updates per second while the world is running. It accumulates render-frame time, bounds catch-up work and skips updates while paused or suspended.

The same component renders entities around the viewpoint and applies screen shake after new damage. Loading a hero seeds the damage counter, so old hits do not shake a restored game. A viewpoint jump resets overscan immediately.

Shadow casters come from circular visibility traces at the hero's cell and its four cardinal neighbors. This prepares blockers before animated movement reaches the next cell, including frames before React commits the new position. The combined footprint is cached until the hero, position, light radius or opaque geometry changes. Unrelated generations and blocked input reuse it. Camera bounds still use `useOverscan`; shadow selection keeps no movement history.
