# Controls

Turns keyboard, pointer and touch input into hero movement and contextual actions. It reads the current world, hero, equipment and open popup; the same keys can therefore move, select a dialog option or use an equipped action.

World-aligned hit areas use `--controls-center-y`, with the normal window midpoint as the default. Feature previews supply their terminal center when their top HUD is trimmed. Popup content spans whole cells; clicks use its measured rectangle so fractional sizes do not drift into adjacent rows or columns. Clicks outside that rectangle are ignored. The up/down regions exactly share the scrollbar column and meet at its center; they do not cover content, tabs or footer buttons.

| Prop | Use |
| --- | --- |
| `compact` | Show the smaller action row used by feature previews |
| `children` | Add content beside the action controls |

Touch release and pointer cancellation clear the drag origin and held directions. A gesture that crossed the swipe threshold suppresses its following touch click, even after returning to its origin or releasing. Every pointer press starts a new gesture; a primary touch pointer also records the drag origin so a missing touchstart cannot retain click suppression or lose the start of a swipe. Legacy touch events still initialize gestures when pointer events are unavailable. A scrollbar press owns its whole gesture: finger drift cannot become a swipe, and its release click cannot select a row or change tabs. Releasing outside the bar also stops held scrolling for mouse input. A fresh dialog direction press wakes one immediate step; holding it then uses the normal dialog repeat interval. The interaction hit area stays mounted while hidden so a drag that started on its prompt can still deliver its native touchend. Touch listeners can prevent browser panning; control hit areas preserve their own taps.

Window blur, pagehide and a hidden document pause the game and clear held movement, the joystick and gesture suppression. Returning to the page leaves it paused until the player resumes.

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
