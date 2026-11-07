# Large Preview

`LargePreview` accepts an existing item or unit sprite. It composes the game's sprite layers through the shared font masks. Each output character holds two source pixels, using upper and lower half blocks.

`previewRows` trims empty and black margins before pairing pixels. An odd last pixel row keeps a black lower half. Empty sprites produce no cells. Every output cell uses the normal documentation character size.

Character definitions may include a backdrop. It is merged before the character's sprite, using the game's sprite compositor. Unit portraits supplied by `getUnitSprite` already include their backdrop and visible equipment.
