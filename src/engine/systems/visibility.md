# Visibility

Recomputes sight around entities with positive light visibility after movement and effects have settled.

It waits until the level has initialized cells and a revealable entity exists. Reference generation changes trigger the next update.

| Visibility | Meaning                                  |
| ---------- | ---------------------------------------- |
| hidden     | Not yet revealed                         |
| visible    | Currently in sight                       |
| fog        | Remembered terrain outside current sight |

[Light](../components/light.md) supplies the reveal radius; terrain opacity and [Layer](../components/layer.md) constrain sight. Changes are applied through [Fog](../components/fog.md) and rendering generations before [Renderer](renderer.md) notifies the UI.
<!-- source-types -->

## PendingChanges

```ts src/engine/systems/visibility.ts
type PendingChanges = Record<
  number,
  Record<
    number,
    Record<string, { from: Fog["visibility"]; to: Fog["visibility"] }>
  >
>;
```
