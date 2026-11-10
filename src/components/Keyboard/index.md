# Keyboard

Renders the game's touch keyboard and writes key presses to chat input. Its four pages contain lowercase letters, uppercase letters, numbers and special characters.

The key and socket sprites come from game assets. Modifier keys switch pages; delete edits the input. Hero/world context controls when the keyboard is available.

Key events read the current hero directly, so the first tap works before the next render notification. Each key edits the chat buffer immediately through `typeChat`; fast taps cannot replace a pending key.

Pointer down uses pressed key and socket sprites in the same two rows. The label disappears, with a solid gray upper half and a solid white, red or lime face across the lower and upper half-blocks. Adjacent edge sprites change only on the pressed side. Release, cancellation, leaving the keyboard or losing window focus restores the raised key; input still happens on click.
