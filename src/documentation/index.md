# Docs Build

| Command                            | Result                                     |
| ---------------------------------- | ------------------------------------------ |
| `npm run docs:dev`                 | Build and serve at `http://127.0.0.1:4173` |
| `npm run docs:build`               | Generate `.docs-build/`                    |
| `npm run docs:build -- build/docs` | Generate the deployment subtree            |
| `npm run docs:types`               | Refresh adjacent source type definitions   |
| `npm run docs:test`                | Generator and browser checks               |

The preview server rebuilds and reloads the browser after Markdown, React, CSS, font or build-script changes. The current URL stays open. Page content comes from Markdown in `docs/` and `src/`. Links resolve to generated HTML.

| Markdown                   | Output                                  |
| -------------------------- | --------------------------------------- |
| `scene` fence              | Isolated game-engine preview            |
| `widget` fence             | Imported data table or interactive tool |
| `[[key:Enter]]`            | Keyboard key                            |
| `[[item:sword iron fire]]` | Item sprite and name                    |
| `[[item:10 arrow]]`        | Count, sprite and item name             |
| `[[button:OPEN]]`          | Game button                             |
| `[[unit:earthChief]]`      | Existing unit sprite and game name      |
| `[[data:20261011-151323]]` | White bracketed data value              |
| `[[stat:xp]]`              | Native colored stat icon and name       |

`App.tsx` renders Markdown tokens in React and handles browser history. Routes follow menu groups under `game-design/` and `development/`; Welcome remains `index.html`. Each route has a generated HTML shell, so direct links work on static hosting. Old flat URLs remain aliases. `GamePreview.tsx` manages isolated frames; `preview.tsx` mounts the game. `Widgets.tsx` imports game tables and calculators. `CommandBuilder.tsx` executes native commands in a persistent isolated world. `DialogSnapshot.tsx` renders settled native popup particles; a `widget` fence containing `popup buy sell` shows both screens. A suffix selects a populated dialog stage, such as `forge:add` or `brew:ingredients`. `visuals.tsx` uses the shared `Row` and composed glyph helper for selectable text.

Body cells are 18 by 32 pixels. Only page headings use three character rows. Scrolling is native.

The workflow builds the game and docs, then publishes `build/` to `gh-pages`. The runner is pinned to Ubuntu 24.04 for Playwright support.

Item and unit references resolve to the catalog anchors. Type references resolve to adjacent source documentation. Code fences accept a filename after the language and render with game popup sprites, line numbers and Copy.

The dev server serves the last completed build while a new build runs. A server event reloads connected documentation pages after the replacement is ready.

The dev server builds into `.docs-dev/`, separately from the static build, so running both does not replace files underneath the watcher.

Write a module's purpose and important contracts in its adjacent Markdown file before running `docs:types`. The generator refreshes declarations below `<!-- source-types -->` and preserves authored examples above it. A missing source note stops generation before files are changed.

Use `<br>` between separate entries in a Markdown table cell. The renderer handles this line break without accepting arbitrary HTML. Keep alternatives labelled as choices.
