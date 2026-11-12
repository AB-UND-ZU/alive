# Visibility

Recomputes sight around entities with positive light visibility after movement and effects have settled.

It waits until the level has initialized cells and a revealable entity exists. Reference generation changes trigger the next update.

| Visibility | Meaning                                  |
| ---------- | ---------------------------------------- |
| hidden     | Not yet revealed                         |
| visible    | Currently in sight                       |
| fog        | Remembered terrain outside current sight |

[Light](../components/light.md) supplies the reveal radius; terrain opacity and [Layer](../components/layer.md) constrain sight. Changes are applied through [Fog](../components/fog.md) and rendering generations before [Renderer](renderer.md) notifies the UI.

Each revealable keeps its last traced sight. It is reused while the position, radius and map size stay the same and every cell in it reports the same [obstruction](../../game/math/tracing.md), because tracing reads nothing else. Mining a mountain, opening or locking a door and a changing torch radius therefore trace again, while standing still among animations does not. A sight holds only plain values, so it never keeps a previous level in memory.

An update then checks each cell around a revealable, with one extra cell, and each cell in sight once. Entities in sight or within the hero's layer become visible, visible entities elsewhere in that area become fog, and hidden ones stay hidden until they are seen. Only these changes are applied, in column, row and entity order.
<!-- source-types -->

## Change

```ts src/engine/systems/visibility.ts
type Change = {
  x: number;
  y: number;
  entityId: number;
  to: Fog["visibility"];
};
```

## Sight

```ts src/engine/systems/visibility.ts
type Sight = {
  size: number;
  x: number;
  y: number;
  radius: number;
  cells: Position[];
  obstructions: ReturnType<typeof getObstruction>[];
};
```
