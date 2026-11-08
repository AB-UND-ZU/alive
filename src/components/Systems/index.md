# Systems Renderer

Advances the ECS at 30 fixed updates per second while the world is running. It accumulates render-frame time, bounds catch-up work and skips updates while paused or suspended.

The same component renders entities around the viewpoint and applies screen shake after new damage. Loading a hero seeds the damage counter, so old hits do not shake a restored game. A viewpoint jump resets overscan immediately.
