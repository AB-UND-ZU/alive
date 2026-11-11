# Sprite Pack

Stores the sprite editor collection under `alive.sprites` in localStorage. Creating or deleting sprites, editing characters or colors, dropping layers, and reordering layers save the collection. Selection and blinking do not write storage. An empty collection stays empty after a reload.

Loading checks the sprite names, layer arrays, font characters and palette colors. Invalid or unavailable storage uses the initial examples. Storage failures leave the current in-memory edits usable. Sprite packs are separate from game savegames.
