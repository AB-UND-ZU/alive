# Wiki Visuals

Uses the game's sprites, palette and composited `Row` cells. Body cells are 18 by 32 pixels. Ordinary text uses continuous font runs, including links and code. Native rows batch adjacent characters with matching colors and backgrounds. Icons contain no hidden fallback characters. Composite icon/count/name references stay on one line. Sprite names underline only on hover or keyboard focus; page links stay blue and underlined. Literal uses white brackets only within prose; table values remain unbracketed. Text remains selectable and wraps between words; code keeps its original spacing. Inline Markdown keeps punctuation with the preceding word across links and emphasis, without preventing long labels from wrapping.

| Component                                          | Use                                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Text`, `Pixels`                                   | Words or explicit rows of game sprites                                                                                                                  |
| `Heading`                                          | Three-row letters; wrap between words with one empty row                                                                                                |
| `Button`, `Choice`, `Selection`, `Key`, `TabTitle` | Existing game controls and menu assets                                                                                                                  |
| `Input`                                            | Transparent native input over a game frame; `compact` uses one button row                                                                               |
| `NativeRule`                                       | Repeated font or stacked sprite column; tables supply measured line counts                                                                              |
| `Frame`                                            | Game borders fitted to whole columns; optional preferred `columns` width and native `title` tab                                                         |
| `ItemView`, `UnitView`                             | Original item/unit icon, name and reference                                                                                                             |
| `StatLabel`, `SlotLabel`                           | Actual stat colors or empty equipment-slot icons; stat `value` precedes its icon, `showName` controls the label and `percentage` adds % before the icon |
| `PlainTable`                                       | Shared `GridTable` renderer                                                                                                                             |

Named sprite links retain dialog colors. Gray names use silver underscores; other names use their own color. Native text decoration leaves glyph descenders readable. Only the name changes to aqua on hover; counts and icons keep their colors. Page links use blue.

Keys use the original two keyboard rows, clipped to their visible one-and-a-half-cell height. A long heading word scrolls locally instead of breaking into letter fragments.

Buttons precompose the game's idle, hover and pressed sprites. Interact actions also show their native stem. Choice uses dialog tabs; Stepper adds minus/plus buttons around an outlined Input. Native CSS chooses the face. Frames and inputs share whole-column measurement, so their right border stays visible on narrow screens.

`Frame compact` measures its longest unbroken content line and native title, then fits the border to whole columns. Acquisition and drop frames use it. Choice tabs keep the same one-source-pixel gap as the game's dialog tabs. `Count` renders unbounded values as 9 followed by the native nine-plus sprite; text and table data share this representation.

Frames reserve enough columns for the complete title. `titleBackground` recolors the native selected tab; Contents uses the frame's green. Empty catalog indexes render no frame.

Inline code preserves source constants and can wrap at property dots, path separators and camel-case word boundaries. Source subheadings use the same boundaries. Soft breaks add no characters to copied code; displayed game amounts still use the native count format. Plain page-link labels wrap at word spaces; sprite references remain together.

Unit names come from the game's name sprites, with the same capitalization and underscore normalization used by harvest references. A visible unit with no native name uses its source key as a readable fallback, so rock references retain an icon and label. Intentionally empty sprites do not gain an invented icon or name.
