# Controls

Turns keyboard, pointer and touch input into hero movement and contextual actions. It reads the current world, hero, equipment and open popup; the same keys can therefore move, select a dialog option or use an equipped action.

| Prop | Use |
| --- | --- |
| `compact` | Show the smaller action row used by feature previews |
| `children` | Add content beside the action controls |

Touch release and pointer cancellation clear the drag origin and held directions. The interaction hit area stays mounted while hidden so a drag that started on its prompt can still deliver its native touchend. Touch listeners can prevent browser panning; control hit areas preserve their own taps.

`Action` describes a rendered action: its name, activation sprites, disabled state and button palette. Game rules remain in engine systems.
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

In test-mode chat, Tab accepts the suggested command word. A right swipe does the same on the dialog or keyboard; continuing the same drag does not accept another word. Keyboard taps retain native click handling, while a swipe cancels the click.

Up and Down select a suggested word while typing. Starting from an empty line, they browse persisted chat history instead.
