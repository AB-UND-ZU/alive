# Development guidelines

Alive is a browser adventure game built with TypeScript, React, Three.js and an entity component system (ECS).

## Work in the local style

- Read the surrounding code and relevant tests before changing a feature.
- Keep code simple to read and follow. Use existing naming, formatting and file structure.
- **Everything in the game must use stacked text sprites. No new rendering primitive may be added anywhere.** Use only existing characters and stack them, including half-blocks for masking. Never add custom font assets, new glyphs, clipping or another drawing mechanism.
- Reuse existing helpers, entity factories, sprites and balancing data. Add a helper only when it is needed and makes the code simpler.
- Keep game rules in the engine or balancing files, rather than duplicating them in UI code or wiki examples.
- Explain why only when the reason is not clear from the code. Avoid comments that repeat what the code does.
- Use plain, readable English in wiki and UI text.

## Verify every change

- General functionality needs tests. Test an explicit game feature and its observable outcome, including relevant failure cases.
- Keep tests about the feature, not a timeline of changes or a record of implementation steps. Update existing tests when behavior changes.
- A small change to a specific behavior may be verified manually. Record the steps and result, and adjust existing tests if needed.
- Visual implementation needs a reference screenshot and inspection of the result. Check desktop and small screens, interaction states and readability. Record the screenshots and what was inspected.
- Before committing code changes, agents run `npm run check:fast` for type checking, lint and fast tests, and `npm run test:slow` for game integration and rendering. The pre-commit hook runs lint only. `npm run test:all` runs both test groups. Run `npm run build` for production game changes.
- Run `npm run test:generation` only when changing level generation or generation-dependent fixtures. CI always runs generation and the other game tests together with coverage through `npm run test:ci`.
- For wiki, run `npm run wiki:build` and `npm run wiki:test`. Inspect the built pages and working examples in a browser after visual changes.
- Rebuild `src/wiki/minimap.json` with `npm run wiki:minimap` only when the user explicitly asks. Normal wiki builds and previews must reuse the committed snapshot.
- Report what passed, what was checked manually, and any remaining limits. Do not claim checks that were not run.

## Find the right place

- `src/engine/components/`: component data and types.
- `src/engine/systems/`: game rules. System order is set in `src/engine/ecs.ts`.
- `src/bindings/creation.ts`: cell legend and entity creation.
- `src/game/balancing/`: class stats, equipment, recipes and resource data.
- `src/game/assets/`: layered character sprites, colors, text and sequences.
- `src/game/levels/`: menu, tutorial dungeon and generated island.
- `src/components/`: React rendering and controls.
- `src/testing/`: existing deterministic world and rendering helpers. Prefer these for game feature tests.

## Version bumps

- When making a new version, update the package version and regenerate the title media with `npm run media:titles`.
- Also capture a fresh in-game title-screen screenshot with the new version visible and save it as `media/game.png`. Wait for the opening visibility animation to finish so the whole title is visible. Keep it alongside the other media assets and preserve the README image link to it. Inspect the regenerated images and screenshot before finishing.

## Keep wiki current

- Put player-facing feature wiki in `wiki/` as Markdown.
- Put important implementation details beside the source file as `filename.md`, for example `src/engine/ecs.md` for `ecs.ts`.
- Use separate player and development chapters in the wiki UI.
- Check claims against current code and the game. Clearly identify unavailable or experimental features; do not present design plans as playable features.
- Reference interactive scenes with fenced `scene` blocks. Import game code or data in the scene implementation rather than copying rules or recipe tables.
- Match the game's DOS font, terminal palette, character sprites and box borders using simple HTML. Preserve keyboard access, readable contrast and responsive layouts.
- See `src/wiki/index.md` for authoring, local preview and deployment.
