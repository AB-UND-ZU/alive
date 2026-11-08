# World Plants

Plant comparisons use `createCell` in a small area world. This includes flora created directly in the cell factory rather than through `unitDefinitions`: trees, palms, oak, bushes and grass, including fruit-bearing variants. The shared worldRows compositor orders the actual body, backdrop and inventory layers with their facing and quantity variants; work and yields come from their actual harvest resource. Combat plants remain in the unit catalog.

The Tree comparison lists both actual tree body choices and the Apple factory. Palm lists both body choices plus Banana and Coconut. Tree and Palm also include every native Stump/Husk choice, including Desert Husk; Oak includes its Root, kept one cell below the canopy to match the native structure positions. Remains keep their factory slotShadow and their own shovel, work and yield data. The optional sprite argument selects one of the factory's existing body choices after creation; fruit-bearing entries retain the native loot layers.

`cellSnapshot(cell, variant?)` creates the requested cell in a small area world and returns its composed sprite rows, harvest state and item pickups. World Plants and cell references share this factory snapshot; neither copies the cell's sprite or harvesting rules.

`RottenPreview` builds the fallen tree with `createCell` and enlarges its complete three-cell world grid through the same two-pixels-per-character renderer.
