# Preview Layout

The feature iframe imports the game's styles first, then this stylesheet. It keeps the native terminal and control geometry while showing only the required HUD category: MP for spells, or HP and the native Use button for food. Other feature scenes have no top stat row.

`sceneLayout` supplies the matching viewport and `topHudRows` dimension options. The game defaults remain unchanged. Category classes on `Stats` select native rows without depending on the number of font cells used to draw their text.

Trimmed scenes remove the Stats block's negative half-row margin. Keeping that native full-HUD overlap with zero or one stat row clips the preview's top border. The terminal and its camera move together, retaining the normal cell geometry and half-cell gap above Reset.

The terminal uses the dimensions provider's computed height instead of letting flex shrink it to fill the remaining space. This keeps all fifteen scene rows visible and aligns the frame with the same camera geometry in every feature preview.
