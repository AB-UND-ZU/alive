# Entity

Chooses the visible parts of one ECS entity and converts its cell position into renderer coordinates. It combines fog, light, immersion, item segments, resource bars and quantity dots.

```text entity-rendering.txt
ECS components
  -> visibility and layer properties
  -> Stack -> Sprite -> Layer
  -> light / water / bar / dots / fog
```

`generation` refreshes an entity after engine changes. `inRadius`, `inside` and `outside` provide the viewpoint and cover tests calculated by the surrounding renderer.

`castShadow` selects opaque blockers from the surrounding renderer's cached light footprints. Retained blockers can stay mounted while their artwork is hidden. A visible wall keeps its existing black body even when it does not cast a shadow. Without this prop, standalone entity renders keep visibility-based shadows.
