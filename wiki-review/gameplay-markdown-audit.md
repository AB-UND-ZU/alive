# Gameplay Markdown audit

Read all 49 current `wiki/*.md` pages. [Coverage](gameplay-markdown-audit.json) lists every file. This checks authored Markdown; the catalog agent separately owns the generated item and unit tables.

| File and line | Finding | Source and resolution |
| --- | --- | --- |
| `wiki/spells.md:11` | Once-per-cast claim incorrectly excluded repeated Beam hits. | `abilities.ts:95` sets Beam retrigger to 2; `magic.ts:329–342,458` permits another effect after that interval. Replaced with a Beam sprite reference and explicit repeat-hit behavior. |
| `wiki/bosses.md:5` | Worm Boss obtaining instructions used Test Mode. | `units.ts:1997` implements the unit, while no normal level generator references `wormBoss`. Removed the obtaining instruction and retained the unavailable-spawn limitation. |
| `wiki/containers.md:9` | Pushable object called Crate rather than its native name. | `scenes.ts:100` identifies the Box interaction; `sprites/units.ts:407` names Box. Replaced with native Box references. |
| `wiki/animals.md:3` | Chick mention lacked its native sprite reference. | `units.ts:1479`, `sprites/creatures.ts:377`. Added the native Chick reference. |
| `wiki/timers.md:1` | Heading capitalization differed from requested title case. | Changed to Tick Timers. |

No Infinity or post-level-10 explanatory claims remain in the Markdown. The latest user clarification limits the class table to levels 1–10; the catalog agent owns that correction and its tests. Classes and Chat retain Test Mode restrictions because they describe availability, rather than obtaining equipment through commands.

Checked suspicious claims against current code: faction cooperation/friendly-fire (`damage.ts:121,207`), automatic potion thresholds/cooldowns (`consume.ts:271–311`), potion percentages and Thorn damage (`consume.ts:108–125,184`), planting delays under snow (`harvest.ts:785`), forging element/material paths (`forging.ts:35,209–251`), Wand contact damage (`equipment.ts:110`), normal Rogue selection (`trigger.ts:266–270`), swimming fish kinds (`creation.ts:2546`), Rotten's invisible native sprite (`units.ts:1213`), shoreline movement (`movement.ts:138`, `immersion.ts:31`), and pause-save conditions (`World/index.tsx:124–148`).

No further definite authored inaccuracies or duplicate sections were found. Tables and native popup previews generally serve distinct purposes: the popup shows the interaction while the table lists supported values. No broad prose expansion was added. The small Markdown corrections will be included in the next parent-coordinated build and browser pass.
