# Pause Overlay

Shows the start, loading and pause state above the terminal. In a playable level it offers Resume, Menu and Save using the game's button sprites. During a write, the Save button reads **SAVING**. The row below reports the latest completed save or a failure.

Save is disabled while a write is running or when the hero cannot be saved. The main menu only offers Resume. Resume input returns control to the game; storage behavior belongs to `World`. See [Savegames](../../../wiki/savegames.md).

The portal shows its loading dialog in the world. During loading the overlay displays the supplied sprites at the normal cell size. The terminal frame crops long messages. The initial Click or Tap prompt keeps the HUD rows empty. Starting the game reveals the pause button and its hit area.
