# Engine Documentation Review

Baseline: `767e346`. Read-only review; no repository files changed.

Coverage: **137/137 routes**: Engine 23, Entities 2, Systems 36, Components 76. Every page was loaded in Chromium at 1440×1000, scrolled through its window content, and inspected at top/bottom and middle where long. All 89 overflowing code/table regions were exercised. Five vertically scrolling tables received extra middle/bottom inspection. The 347 main screenshots were inspected with `view_image` through 29 labelled contact sheets; four navigation screenshots and ten extra nested-table screenshots were inspected too.

Machine-readable route coverage: `/tmp/alive-review-engine-coverage.json`. Full evidence directory: `/tmp/alive-review-engine/`. Screenshot IDs below map directly to entries in coverage. Browser navigation was direct for the initial pages and the real React menu for the remaining pages, preserving the shared shell.

## Findings

### E01 — P1 — Code advertises links that cannot be clicked

**Systematic.** Example route: `development/engine/wfc/wfc.html`.

The WFC code has **18 blue underlined reference occurrences and zero actual links**. Constraints, Tag, Tile and other local types look like links, including hover behavior, but the semantic code layer has no anchors. The new self-link policy correctly removes their anchors; the pixel layer does not use that policy.

- Screenshots: `004-top.png`, `004-bottom.png`, `sheet-001.png`, `sheet-002.png`.
- Browser proof: `link-probes.json` records zero anchors / 18 underlined occurrences.
- Source: `src/documentation/CodeBlock.tsx` `HighlightedCode` sets `linked: !!reference`, while `SemanticCode` invokes the policy-aware `ReferenceContext.link`. `App.tsx` suppresses self-page and repeated links.
- Fix: resolve link eligibility once for both semantic and pixel layers. Suppressed links should retain syntax colors and lose link underlines/hover styling. Keep the existing type anchors.

### E02 — P1 — Automatic source references resolve unrelated names

**Systematic**, across code spans, code frames, field tables and source prose.

Confirmed by clicking:

| Source route / text | Actual destination | Intended meaning |
| --- | --- | --- |
| `development/engine/snapshot.html`: filename `snapshot.ts` | `development/engine/testing/harness.html` | The snapshot implementation file |
| `development/components/actionable.html`: `Systems: action` | `development/ui/controls.html#type-action` | The Action system |

Other recorded DOM examples:

| Source | Incorrect reference |
| --- | --- |
| Actionable / many component Systems lists | `trigger` → test-harness `trigger`, rather than the Trigger system |
| Baitable numeric `amount` | Sprite's `Amount` enum |
| Castable numeric `range` | `std.range` helper |
| Castable buff field `addHaste` | UI helper `addHaste` |
| SaveSummary numeric `level` | The Level consumable item |
| ECS prose `map cleanup`; Snapshot `position map` | Inventory Map sprite / Gameplay Map |
| Commands `slash command` | Slash skill sprite/name |
| Font `React build` | Build action sprite/name |

- Screenshots: `002-middle.png`, `003-middle.png`, `005-middle.png`, `007-top.png`, `020-bottom.png`, `062-top.png`, `065-top.png`, `073-top.png`, `084-top.png`; contact sheets 1, 2, 5, 15, 17, 19.
- Click evidence: `link-probes.json`. Every page's `links` array in coverage records rendered text and href.
- Source: `references.tsx` and `CodeBlock.tsx` split arbitrary text with the global reference pattern and try case-folded identifiers; `App.tsx` combines code symbols, items and features in shared dictionaries. Import-aware references exist but global fallback overrides meaning for unrelated lowercase fields/filenames/module names.
- Fix: exact source/import symbol resolution in code; do not link property names, string literals or comments as arbitrary global identifiers. Treat filenames atomically and resolve their actual path, or leave them plain. Make Systems lists explicit source-module links. For Development prose, use explicit item markup for actual items instead of decorating ambiguous programming words automatically.

### E03 — P1 — Several component purposes contradict the implementation

**Local authored prose, shared pattern of guessing from names.** The current generated declarations are accurate; the introductory explanations are not.

| Route | Current claim | Source-backed correction |
| --- | --- | --- |
| `development/components/shootable.html` | Configures ranged shooting | Marks targets that arrows can hit; `shots` records embedded arrow hits recovered on drop. `ballistics.ts:54,290`; `drop.ts:281`. Commit `af803c3` introduces this target behavior. |
| `development/components/spikable.html` | Configures contact damage | Legacy cactus data. Current contact damage reads `getEntityStats(...).spike`, not `SPIKABLE.damage`. `creation.ts:1933` still writes it. Commit `e7bea9e` explicitly removes SPIKABLE reads from the Spike system. Do not present attaching this data as enabling current spike damage. |
| `development/components/liquid.html` | Marks liquid terrain | Tracks splash/drop/bubble effects, their amount and timestamp. `water.ts:140,257–282`; liquid terrain uses Immersible instead. |
| `development/components/buildable.html` | Stores construction progress and finished cell | Stores the cell produced when building finishes. Progress is `STATS.hp / maxHp`; `build.ts:144–153`. |
| `development/components/warpable.html` | Stores a level transition target | Empty portal marker. `getSelectedLevel` uses popup selection and `levelConfig.mapOffsetY`; `game/levels/index.ts:9–19`. |
| `development/components/fishable.html` | Stores the fishing state of a fish | Population data on a habitat; individual hook/catch state is elsewhere. `creation.ts:2574–2578` creates Habitat with FISHABLE; `ai.ts:2055,2118,2176,2191` manages population. |

- Screenshots: `070-top.png`, `085-top.png`, `101-top.png`, `123-top.png`, `126-top.png`, `137-top.png`; sheets 16, 19, 22, 27, 29.
- Fix: correct these short descriptions and explain the significant field in plain language. Keep legacy status explicit. A schema type alone does not establish the gameplay role.

### E04 — P2 — Sixteen engine/entity pages are only filename headings plus type dumps

**Systematic generator fallback.** Fifteen Engine pages and `development/entities/entities.html` have no authored description before generated declarations.

Examples:

- Matrix documents only `type Matrix<T> = T[][]`, with no indexing direction, wrapping behavior or useful matrix helper.
- Std documents only Point; its math helpers are absent.
- WFC lists internal data shapes without explaining Wave / WaveFunctionCollapse, propagation, collapse or usage.
- Hooks lists SaveStatus and WorldContext without explaining the hooks or the provider relationship.
- Sound is titled `Index` and lists only SfxOptions.
- Entities is a 78-line mapped entity type; no factory usage or component requirements.

- Screenshots: `001-top.png`, `004-top.png`, `008-top.png`, `009-top.png`, `017-top.png`, `018-top.png`, `022-top.png`, `025-top.png`; sheets 1–6.
- Source: `scripts/docs/types.mjs` falls back to `# <filename>` when no Markdown exists, then emits every top-level type/interface/enum. This does not document functions or data contracts.
- Fix: retain useful type anchors but add only module-specific information: one purpose sentence, a small API/contract table, and one example when setup or behavior is not obvious. Label generated-only stubs honestly until authored; do not fill them with generic prose.
- All affected files are listed in the coverage JSON (`contentAudit.filenameOnlyBeforeTypes`).

### E05 — P2 — System pages list queries instead of explaining system behavior

**Systematic authored/generated content.** Thirty of 36 Systems pages have a one-line description followed by separate one-line `getEntities` code dialogs. The other six are not generally complete either: Popup is just a title and one sentence; Map exposes a private ListenerEntities type instead of spatial API behavior.

Damage is a clear example: three queries say nothing about generation guards, lastInteraction, controllability, faction checks, fractional damage or where its update runs. These are visible in `damage.ts:789–840`, `calculateDamage:401–435`, and the actual order in `ecs.ts:createSystems`.

AI's ten query dialogs and repeated filename/Copy controls consume most of its page without telling the reader what each query does.

- Screenshots: `027-top.png`, `027-bottom.png`, `034-top.png`, `048-top.png`, `051-top.png`; sheets 7–14.
- Fix: remove boilerplate clock-query listings. For each system, document the real trigger/guard, significant reads/writes and one important ordering dependency only when it matters. Link the owning component/helper/test explicitly. Keep a code example only when it demonstrates an actual contract, rather than a bare query copied from the file.

### E06 — P2 — Sixty-six components repeat their fields twice

**Systematic: authored prefix + type generator.** A field table and a complete generated declaration describe the same fields, often with the same type name written twice. Tables usually add no units, ownership, defaults or meaning.

Sequencable is the extreme: the page is **33,672px tall**; a single serialized `states` table row is part of a **2,944px** table, nested in an 840px scroll area, followed by all the types again. Readers first scroll dozens of unannotated field tables and then the same declarations.

- Screenshots: `084-top.png`, `117-top.png`, `122-top.png`, `122-middle.png`, `122-table-middle.png`, `122-table-bottom.png`; contact sheets 19, 25, 26 and `internal-sheet-2.png`.
- Source: `types.mjs` preserves the existing field tables before `<!-- source-types -->` and appends declarations. Re-running it perpetuates the duplication.
- Fix: choose one schema representation per type. Use compact field tables only if they add meanings/units; use code for complex mapped/intersection types. Preserve a single h2/type anchor for each type. Do not serialize a large mapped object into one table cell. Do not add collapse toggles; use the existing type index and anchors to navigate long state families.

### E07 — P2 — Component Systems lists include tests and obscure ownership

**Systematic authored prefix data.** Actionable, Movable, Player, Popup, Position, Reference and Renderable list `.test` modules as Systems (`popup.test`, `movement.test`, `tick.test`). Those are not installed game systems. Long lists also do not distinguish a writer from a reader. Some lower-case names then link incorrectly, as E02 describes.

- Screenshots: `062-top.png`, `106-bottom.png`, `110-middle.png`, `112-middle.png`, `113-top.png`, `117-bottom.png`, `120-bottom.png`.
- Source: the real installed systems are the `world.addSystem(...)` calls in `ecs.ts:createSystems`; test files are not in that registry.
- Fix: exclude tests and link real modules explicitly. Prefer the few meaningful owners/readers over a long grep result. For Position, for example, explain which helper keeps map registration in sync when movement changes coordinates.

### E08 — P2 — The player legend character renders as a question mark

**Shared glyph mapping.** `development/entities/creation.html` documents the real `♀` area marker but displays `?`.

- Screenshot: `024-top.png`, `sheet-006.png`.
- Source: the font stores CP437 graphical controls under U+0100..U+011F; `codePage437[12]` correctly maps to U+010B. `textSprites` aliases arrows but not `♀`, then replaces unsupported glyphs with `?`.
- Fix: use the existing CP437 control mapping for graphical aliases, including `♀ → U+010B`. Keep original area-source characters when copying code; a font alias is a rendering detail, not a replacement for the legend's input character.

### E09 — P2 — Short code dialogs use a full-width empty frame

**Shared CodeBlock layout.** NPC's ContactCircle, Matrix, Std and simple marker declarations occupy a full content-width dialog even though the type and filename fit a much narrower frame. Query pages repeat this chrome for every one-line call. Horizontal scrolling works, but there is no benefit to forcing the maximum frame width for short content.

- Screenshots: `008-top.png`, `017-top.png`, `018-top.png`, `068-top.png`, `075-top.png`.
- Source: `CodeBlock.tsx` computes `columns` solely from available container width, while `width` separately records the longest content/filename. It never clamps columns to that preferred width.
- Fix: cap frame columns by actual content/filename width, within available whole cells. Keep horizontal scrolling inside the source viewport for long lines. Address repeated query chrome by E05 rather than inventing a second code component.

### E10 — P3 — Navigation has ambiguous Index entries

**Local titles propagated by the shared builder.** Engine contains two `Index` entries: sprite templates and sound. WFC and AI appear as `Wfc` and `Ai` in navigation.

- Screenshot: `navigation-sheet.png`, `009-top.png`, `022-top.png`.
- Source: filename-only Markdown titles and `capitalize` in build.mjs.
- Fix: use meaningful short source-page titles (`Sprite Templates`, `Sound`) and preserve WFC/AI acronyms. Keep titles within the existing sixteen-character limit.

## Shared behavior verified

- No runtime errors or blank pages across 137 routes.
- No desktop horizontal **page** overflow; content scrollers contain their own overflow.
- Header, active navigation, glyph cell alignment, inner table rules and code dialog borders were visually consistent across the covered pages. No new R/W glyph artifact found.
- Table headers are already sticky, as are first columns. All five vertical table scrollers were exercised through their middle and bottom; headers stay readable. The large Sequencable row remains an information-layout problem, not a missing sticky-header implementation.
- All **229** top-level generated type/interface/enum declarations in these pages match current TypeScript source after whitespace normalization (`type-source-check.json`). The schema data is current; the missing/misleading explanations and heuristic links are the main defects.
- Source/history checks include the actual system registry, generation guards, saved-world restoration, current component consumers, and commits `a8c460f`, `af803c3`, `e7bea9e`, `b7a9ea3` and baseline `767e346`.

## Minimal structure for the revision

| Page kind | Keep | Add only when meaningful | Remove |
| --- | --- | --- | --- |
| Component | One purpose sentence; one schema representation; stable type anchors | Field meaning/units, writer/reader links, a real setup example for a non-obvious contract | Duplicate declarations/tables; generic attach/query boilerplate; test files presented as systems |
| System | Concrete resulting behavior | Trigger/guard; significant state read/write; ordering constraint or real test/example | Unexplained getEntities dumps and repeated clock queries |
| Engine/helper | Module purpose; small API contract table | One example demonstrating setup, indexing or failure behavior | Filename-only stubs pretending to be complete implementation documentation |

The existing ECS, snapshot, saved-game and harness guides contain useful authored information. Keep their substance and correct the automatic references rather than replacing them with generic introductions.

## Route coverage

Every route below has inspected screenshot evidence and scroll metadata in the machine-readable coverage file.

| ID | Group | Route |
| --- | --- | --- |
| 001 | Engine | `development/engine/hooks.html` |
| 002 | Engine | `development/engine/ecs.html` |
| 003 | Engine | `development/engine/snapshot.html` |
| 004 | Engine | `development/engine/wfc/wfc.html` |
| 005 | Engine | `development/engine/game/assets/commands.html` |
| 006 | Engine | `development/engine/game/assets/descriptions.html` |
| 007 | Engine | `development/engine/game/assets/font.html` |
| 008 | Engine | `development/engine/game/assets/npcs.html` |
| 009 | Engine | `development/engine/game/assets/templates.html` |
| 010 | Engine | `development/engine/game/assets/ui.html` |
| 011 | Engine | `development/engine/game/assets/utils.html` |
| 012 | Engine | `development/engine/game/balancing/building.html` |
| 013 | Engine | `development/engine/game/balancing/classes.html` |
| 014 | Engine | `development/engine/game/balancing/forging.html` |
| 015 | Engine | `development/engine/game/balancing/harvesting.html` |
| 016 | Engine | `development/engine/game/balancing/units.html` |
| 017 | Engine | `development/engine/game/math/matrix.html` |
| 018 | Engine | `development/engine/game/math/std.html` |
| 019 | Engine | `development/engine/game/math/tracing.html` |
| 020 | Engine | `development/engine/game/saves.html` |
| 021 | Engine | `development/engine/game/saves/storage.html` |
| 022 | Engine | `development/engine/game/sound.html` |
| 023 | Engine | `development/engine/testing/harness.html` |
| 024 | Entities | `development/entities/creation.html` |
| 025 | Entities | `development/entities/entities.html` |
| 026 | Systems | `development/systems/action.html` |
| 027 | Systems | `development/systems/ai.html` |
| 028 | Systems | `development/systems/ballistics.html` |
| 029 | Systems | `development/systems/build.html` |
| 030 | Systems | `development/systems/burn.html` |
| 031 | Systems | `development/systems/click.html` |
| 032 | Systems | `development/systems/collect.html` |
| 033 | Systems | `development/systems/consume.html` |
| 034 | Systems | `development/systems/damage.html` |
| 035 | Systems | `development/systems/drop.html` |
| 036 | Systems | `development/systems/enter.html` |
| 037 | Systems | `development/systems/fate.html` |
| 038 | Systems | `development/systems/fishing.html` |
| 039 | Systems | `development/systems/focus.html` |
| 040 | Systems | `development/systems/freeze.html` |
| 041 | Systems | `development/systems/harvest.html` |
| 042 | Systems | `development/systems/homing.html` |
| 043 | Systems | `development/systems/immersion.html` |
| 044 | Systems | `development/systems/initialize.html` |
| 045 | Systems | `development/systems/interact.html` |
| 046 | Systems | `development/systems/leveling.html` |
| 047 | Systems | `development/systems/magic.html` |
| 048 | Systems | `development/systems/map.html` |
| 049 | Systems | `development/systems/movement.html` |
| 050 | Systems | `development/systems/needle.html` |
| 051 | Systems | `development/systems/popup.html` |
| 052 | Systems | `development/systems/push.html` |
| 053 | Systems | `development/systems/renderer.html` |
| 054 | Systems | `development/systems/sequence.html` |
| 055 | Systems | `development/systems/spike.html` |
| 056 | Systems | `development/systems/text.html` |
| 057 | Systems | `development/systems/tick.html` |
| 058 | Systems | `development/systems/trigger.html` |
| 059 | Systems | `development/systems/vessel.html` |
| 060 | Systems | `development/systems/visibility.html` |
| 061 | Systems | `development/systems/water.html` |
| 062 | Components | `development/components/actionable.html` |
| 063 | Components | `development/components/affectable.html` |
| 064 | Components | `development/components/attackable.html` |
| 065 | Components | `development/components/baitable.html` |
| 066 | Components | `development/components/behaviour.html` |
| 067 | Components | `development/components/belongable.html` |
| 068 | Components | `development/components/blockable.html` |
| 069 | Components | `development/components/brewable.html` |
| 070 | Components | `development/components/buildable.html` |
| 071 | Components | `development/components/bumpable.html` |
| 072 | Components | `development/components/burnable.html` |
| 073 | Components | `development/components/castable.html` |
| 074 | Components | `development/components/clickable.html` |
| 075 | Components | `development/components/collectable.html` |
| 076 | Components | `development/components/collidable.html` |
| 077 | Components | `development/components/conditionable.html` |
| 078 | Components | `development/components/coverable.html` |
| 079 | Components | `development/components/displacable.html` |
| 080 | Components | `development/components/droppable.html` |
| 081 | Components | `development/components/enterable.html` |
| 082 | Components | `development/components/equippable.html` |
| 083 | Components | `development/components/exertable.html` |
| 084 | Components | `development/components/farmable.html` |
| 085 | Components | `development/components/fishable.html` |
| 086 | Components | `development/components/focusable.html` |
| 087 | Components | `development/components/fog.html` |
| 088 | Components | `development/components/forgable.html` |
| 089 | Components | `development/components/fragment.html` |
| 090 | Components | `development/components/freezable.html` |
| 091 | Components | `development/components/harvestable.html` |
| 092 | Components | `development/components/homing.html` |
| 093 | Components | `development/components/hookable.html` |
| 094 | Components | `development/components/identifiable.html` |
| 095 | Components | `development/components/immersible.html` |
| 096 | Components | `development/components/inventory.html` |
| 097 | Components | `development/components/item.html` |
| 098 | Components | `development/components/layer.html` |
| 099 | Components | `development/components/level.html` |
| 100 | Components | `development/components/light.html` |
| 101 | Components | `development/components/liquid.html` |
| 102 | Components | `development/components/lockable.html` |
| 103 | Components | `development/components/lootable.html` |
| 104 | Components | `development/components/melee.html` |
| 105 | Components | `development/components/mountable.html` |
| 106 | Components | `development/components/movable.html` |
| 107 | Components | `development/components/npc.html` |
| 108 | Components | `development/components/orientable.html` |
| 109 | Components | `development/components/particle.html` |
| 110 | Components | `development/components/player.html` |
| 111 | Components | `development/components/poi.html` |
| 112 | Components | `development/components/popup.html` |
| 113 | Components | `development/components/position.html` |
| 114 | Components | `development/components/projectile.html` |
| 115 | Components | `development/components/pushable.html` |
| 116 | Components | `development/components/rechargable.html` |
| 117 | Components | `development/components/reference.html` |
| 118 | Components | `development/components/refillable.html` |
| 119 | Components | `development/components/remainable.html` |
| 120 | Components | `development/components/renderable.html` |
| 121 | Components | `development/components/revivable.html` |
| 122 | Components | `development/components/sequencable.html` |
| 123 | Components | `development/components/shootable.html` |
| 124 | Components | `development/components/soul.html` |
| 125 | Components | `development/components/spawnable.html` |
| 126 | Components | `development/components/spikable.html` |
| 127 | Components | `development/components/sprite.html` |
| 128 | Components | `development/components/stats.html` |
| 129 | Components | `development/components/sticky.html` |
| 130 | Components | `development/components/structurable.html` |
| 131 | Components | `development/components/swimmable.html` |
| 132 | Components | `development/components/tempo.html` |
| 133 | Components | `development/components/tooltip.html` |
| 134 | Components | `development/components/trackable.html` |
| 135 | Components | `development/components/vanishable.html` |
| 136 | Components | `development/components/viewable.html` |
| 137 | Components | `development/components/warpable.html` |
