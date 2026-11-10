# Keyboard

Renders the game's touch keyboard and writes key presses to chat input. Its four pages contain lowercase letters, uppercase letters, numbers and special characters.

The key and socket sprites come from game assets. Modifier keys switch pages; delete edits the input. Hero/world context controls when the keyboard is available.

Key events read the current hero directly, so the first tap works before the next render notification. Each key edits the chat buffer immediately through `typeChat`; fast taps cannot replace a pending key.
