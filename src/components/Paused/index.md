# Pause Overlay

Shows the start, loading and pause state above the terminal. In a playable level it offers Resume, Menu and Save using the game's button sprites. The row below reports the latest save, progress or failure.

Save is disabled while a write is running or when the hero cannot be saved. The main menu only offers Resume. Resume input returns control to the game; storage behavior belongs to `World`. See [Savegames](../../../wiki/savegames.md).

The startup overlay shows "Loading game..." while the sound catalog is prepared, then "Loading map..." during menu generation. The resume hit area is absent while loading.
