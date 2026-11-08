# Stats HUD

Reads the hero's counters and equipment, then renders the upper HUD. `StatsInner` lays out the rows; `Stats` supplies world data and pause behavior.

`padding` and `width` keep the HUD aligned with the terminal. Inspection and quick-action state change which information is shown. `handleQuick` handles the quick-action input instead of duplicating engine rules in the display.

HP, MP and XP rows expose category classes. XP retains separate Menu, Progress and Quick groups, allowing compact documentation scenes to hide unused rows or retain the native Use button without counting character cells. The regular game keeps the same row contents and order.
