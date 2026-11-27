# Development guidelines

Alive is a browser adventure game built with TypeScript, React, Three.js and an entity component system (ECS).

## Work in the local style

- Inspect the surrounding code, relevant tests and Development wiki first. Find a working example of the same behavior and follow its helpers, naming, formatting and structure.
- Identify the smallest change that satisfies the request. Reuse existing helpers, factories, sprites and balancing data. Introduce a helper only when it simplifies the implementation.
- **Every visible element in the game and wiki must use the existing DOS characters and stacked text sprites.** This includes controls, text, borders, highlights and masks. Use the existing palette, half-blocks and UI components. Never add custom CSS, glyphs, fonts, shapes, clipping, drawing primitives or rendering machinery.
- Keep game rules in the engine or balancing files. Explain why only when the code needs it. Use plain English in wiki and UI text.
- Verify assumptions against the code, tests or running game before acting on them or stating them in a reply.

## Repository contents

- Keep temporary scripts, profiling experiments, benchmark bundles, investigation screenshots and research reports outside the repository and its worktrees, for example in a task directory under `/tmp`. Do not commit them.
- Keep only maintained game code, media, wiki content, implementation documentation and required build/test tooling in the repository. Remove investigation artifacts from earlier work when cleaning up.

## Verification

**During development**, each agent works independently in its own worktree. Before committing, run only the checks for the affected behavior. Reserve broad suites for integration. The pre-commit hook runs lint only.

- Test observable features and relevant failure cases. Update existing tests when behavior changes. A manual check can cover a small behavior adjustment. Record the steps and result.
- The user runs persistent game and wiki servers in their own worktree terminal. Reuse a running preview for that worktree when available. If a check needs a temporary server, stop it and its child processes as soon as the check ends, including after failure or interruption. Only leave a server running when the user explicitly asks. Leave servers started by others alone.
- For visual changes, capture a reference and inspect the result on desktop and a small screen, including the affected interaction states.
- For prose and link edits, read the changed text and follow its links. For wiki pages, check the page in the local preview and verify any changed source metadata.

**When merging to local `main`**, rebase onto the current `main`, resolve conflicts, then run the applicable checks once on the rebased tree, in order:

1. For game code or game tests, run `npm run check:fast`, then `npm run test:slow`.
2. If level generation or its fixtures changed, also run `npm run test:generation`.
3. For wiki rendering, routing, previews or build tooling, run `npm run wiki:test`. It builds the game clients and wiki. For production game changes outside that check, run `npm run build`.
4. Integrate with `git merge --ff-only`. If `main` advances, rebase again and recheck what the new base affects.

Prose-only merges use the text and link checks above. CI runs the full game, generation and wiki suites on `main`. Report the checks run and any limits.

## Find the right place

- `src/engine/components/`: component data and types.
- `src/engine/systems/`: game rules. System order is set in `src/engine/ecs.ts`.
- `src/bindings/creation.ts`: cell legend and entity creation.
- `src/game/balancing/`: class stats, equipment, recipes and resource data.
- `src/game/assets/`: layered character sprites, colors, text and sequences.
- `src/game/levels/`: menu, tutorial dungeon and generated island.
- `src/components/`: React rendering and controls.
- `src/testing/`: existing deterministic world and rendering helpers. Prefer these for game feature tests.

## Saved data

- When a change affects existing games, compare the last released save with the current factory. Check what the snapshot stores, including popup deals and text, quest targets, equipment, AI and timers.
- Add conversions to the next release entry in `src/game/saves/upgrades.ts`. Preserve player progress, stock and entity references. Test a released save shape through upgrade and reload. See [Saved games](src/game/saves/index.md#upgrading-saves).

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
- Rebuild `src/wiki/minimap.json` with `npm run wiki:minimap` only when explicitly requested. Normal builds and previews use the committed snapshot.
- See `src/wiki/index.md` for authoring, local preview and deployment.
