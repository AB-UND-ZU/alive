# Light

Defines rendered light, fog visibility, darkness, and half-cell orientation.

[Visibility](../systems/visibility.md) uses the sight radius; [World rendering](../../renderers/three-js/Systems/index.md) uses the light and shadow values.

| Field        | Meaning                         |
| ------------ | ------------------------------- |
| `brightness` | Radius used for rendered light. |
| `visibility` | Radius used for fog of war.     |
| `darkness`   | Shadow radius.                  |
<!-- source-types -->

## Light

```ts src/engine/components/light.ts
export type Light = {
  brightness: number; // for rendered light
  visibility: number; // for fog of war
  darkness: number;
  orientation?: Orientation // for half blocks
};
```
