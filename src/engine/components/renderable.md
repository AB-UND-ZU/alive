# Renderable

Stores a generation counter used to invalidate rendering.

Call `rerenderEntity` from [Renderer](../systems/renderer.md) after a visible mutation. Rendering also includes generations from references, sequences and equipped items.
<!-- source-types -->

## Renderable

```ts src/engine/components/renderable.ts
export type Renderable = {
  generation: number;
};
```
