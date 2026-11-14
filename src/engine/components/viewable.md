# Viewable

Defines camera activation, priority, spring, and fractional position.

[View hooks](../../bindings/hooks.md) choose the active entity with the highest priority. Dialogs temporarily override the normal hero or building viewpoint.

| Field      | Meaning                                                 |
| ---------- | ------------------------------------------------------- |
| `active`   | Only active viewpoints participate in camera selection. |
| `priority` | Higher values take precedence; popups normally use 90.  |
| `fraction` | Sub-cell camera offset.                                 |
<!-- source-types -->

## Viewable

```ts src/engine/components/viewable.ts
export type Viewable = {
  active: boolean;
  owner?: number;
  radius?: number;
  quake?: number;
  priority: number; // 10 - hero, 30 - spawn, 50 - buildings, 90 - popups
  spring?: SpringConfig;
  fraction?: Position;
};
```

The optional `owner` entity ID restricts a popup camera to its player in an assigned client view. Unassigned single-player worlds retain the original priority selection.
