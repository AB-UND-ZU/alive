# Fog

Separates unexplored, remembered, and currently visible cells.

[Visibility](../systems/visibility.md) changes visibility as sight moves. Terrain can remain remembered; moving units need current sight.

| Field        | Meaning                                                                          |
| ------------ | -------------------------------------------------------------------------------- |
| `visibility` | hidden: unexplored; fog: remembered; visible: currently in sight.                |
| `type`       | Controls how terrain, objects, units and other layers participate in visibility. |
<!-- source-types -->

## Fog

```ts src/engine/components/fog.ts
export type Fog = {
  visibility: "hidden" | "fog" | "visible";
  type: "air" | "terrain" | "object" | "unit" | "float";
  fixed?: boolean;
};
```
