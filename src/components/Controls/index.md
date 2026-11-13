# Controls

Turns keyboard, pointer and touch input into hero movement and contextual actions. It reads the current world, hero, equipment and open popup; the same keys can therefore move, select a dialog option or use an equipped action.

World-aligned hit areas use `--controls-center-y`, with the normal window midpoint as the default. Feature previews supply their terminal center when their top HUD is trimmed. Popup content spans whole cells; clicks use its measured rectangle so fractional sizes do not drift into adjacent rows or columns. Clicks outside that rectangle are ignored. The up/down regions exactly share the scrollbar column and meet at its center; they do not cover content, tabs or footer buttons.

| Prop | Use |
| --- | --- |
| `compact` | Show the smaller action row used by feature previews |
| `children` | Add content beside the action controls |

Each touch has an identifier, a drag origin and a consumed flag. Steering or pressing a scrollbar consumes that touch. Its `touchend` is canceled with `preventDefault()` so the browser does not turn it into a click; ordinary taps keep their native clicks. There is no global click suppression or state carried forward to filter future clicks. Returning to the drag origin does not undo consumption. If a touchstart is missing, the first move establishes a new origin.

Scrollbar touches use their original touch target, so finger drift cannot become steering. Pointer capture keeps mouse scrollbar releases on the scrollbar even outside its bounds. Release/cancel stops held movement, and closing or replacing a popup also stops its held input. The touch's consumed flag remains until its matching end/cancel, even if pointerup arrives first. A fresh dialog direction press wakes one immediate step; holding it then uses the normal dialog repeat interval. The interaction hit area stays mounted while hidden so moving away from its prompt does not detach the touch target.

Window blur, pagehide and a hidden document pause the game and clear held movement, the joystick and the current touch. Returning to the page leaves it paused until the player resumes.

Backspace activates the left dialog action. Escape follows a rendered ←BACK button, or PLACE while positioning a sprite layer; otherwise it closes the popup. The popup sequence records whether that arrow is present, so all dialogs use their displayed action.

`Action` describes a rendered action: its name, activation sprites, disabled state and button palette. Game rules remain in engine systems.

In test-mode chat, Tab accepts the suggested command word. A right swipe does the same on the dialog or keyboard; continuing the same drag does not accept another word. Keyboard taps retain native click handling, while a swipe cancels the click.

Up and Down select a suggested word while typing. Starting from an empty line, they browse persisted chat history instead.
The highlight interval is released on unmount. Controls retains its existing interval while actions change; cleanup does not reset the visible highlight phase on each render.

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

Compact controls keep spell activation under its spell button, and align both activation groups when both actions exist. Normal game controls retain their full equipment rows.
