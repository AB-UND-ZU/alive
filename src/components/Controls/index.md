# Controls

Maps keyboard, pointer, and touch input to movement, contextual actions, menus, skills, and tools.

```tsx
Controls()
```
<!-- source-types -->

## Action

```ts src/components/Controls/index.tsx
type Action = {
  name: string;
  activation: Sprite[];
  disabled: boolean;
  palette: Palette;
};
```
