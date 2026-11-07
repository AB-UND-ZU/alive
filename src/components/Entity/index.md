# Entity

Selects terrain, unit, item, light, and effect rendering for an ECS entity.

```tsx
Entity({
  entity,
  x,
  y,
  inRadius,
  inside,
  outside,
}: {
  entity: TypedEntity<"POSITION" | "SPRITE" | "RENDERABLE">;
  generation: number;
  x: number;
  y: number;
  inRadius: boolean;
  inside: boolean;
  outside: boolean;
})
```
