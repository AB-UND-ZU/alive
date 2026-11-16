# Updates

The menu's Updates sign uses the generic `dialog` popup. Entries are newest first and use the same hexadecimal version labels as the title screen. Text is authored in rows of at most 17 cells, with the stacked `listBullet` sprite at the start of each change and existing stacked sprites inline. Body prose is silver, with sparse white accents for technologies and sizes. Native popup helpers supply item and stat labels, unit names and relationship bars. The catalog is built lazily once, after game modules initialize. The active list row shows a clock and white YYYYMMDD date at its right edge. The original shows 2009 fully right-aligned. There is no separate description panel. VIEW contains only the changes.

Version 0x00 describes the original Visual Basic Windows game, dated approximately 2009 from the author's account. Version 0x01 uses the repository's initial commit date, 16 March 2023 (`9c62391a`). Its last browser prototype had a 21×13 playfield (`defaultState` and `.Viewport`) and a 350 ms world tick. Version 0x02 uses the rewrite's Nuke commit, 27 July 2024 (`c9768de7`), as requested; its notes cover development through the next minor version.

The later dates are the version commits: 0x03 and 0x04 on 6 November 2026 (`f79a43f1`, `90260332`), 0x05 on 9 November (`7f1f1203`), and 0x06 on 11 November (`e85d1418`). Hair colors in the 0x02 notes preserve that release's palette. The 0x07 preview entry uses an estimated date of 16 November 2026; the package version remains 0.6.0 until release.


The 0x01 resource and plant icons reproduce the old top HUD in `c9768de7^`: maroon ≡ wood, gray ÷ ore, teal ° behind olive τ, and purple \u0106 behind the olive comma in the resource legend. The Plants row uses both trees, a bare bush and bare grass. Early spells use δ and the original paragraph glyph at `\u0114`, and ice is a plain teal full block. The extended sequence after Tumbleweed belongs to 0x02; Boat and Dock are listed in 0x06. The Worm entry uses the same unit sprite and label as the quest.

Top-level bullets are separated by blank rows; class, stat, mob, spell, weapon and charge-skill entries remain indented continuations of their heading.
