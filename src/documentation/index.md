# Docs Build

| Command                            | Result                                     |
| ---------------------------------- | ------------------------------------------ |
| `npm run docs:dev`                 | Build and serve at `http://127.0.0.1:4173` |
| `npm run docs:build`               | Generate `.docs-build/`                    |
| `npm run docs:build -- build/docs` | Generate the deployment subtree            |
| `npm run docs:types`               | Refresh adjacent source type definitions   |
| `npm run docs:test`                | Browser checks                             |

The preview server rebuilds and reloads the browser after Markdown, React, CSS, font or build-script changes. The current URL stays open. Page content comes from Markdown in `docs/` and `src/`. Links resolve to generated HTML.

| Markdown                   | Output                                  |
| -------------------------- | --------------------------------------- |
| `scene` fence              | Isolated game-engine preview            |
| `widget` fence             | Imported data table or interactive tool |
| `[[key:Enter]]`            | Keyboard key                            |
| `[[item:sword iron fire]]` | Item sprite and name                    |
| `[[item:10 arrow]]`        | Count, sprite and item name             |
| `[[button:OPEN]]`          | Game button                             |

`App.tsx` renders Markdown tokens in React and handles browser history. Routes follow menu groups under `game-design/` and `development/`; Welcome remains `index.html`. Each route has a generated HTML shell, so direct links work on static hosting. Old flat URLs remain aliases. `GamePreview.tsx` manages isolated frames; `preview.tsx` mounts the game. `Widgets.tsx` imports game tables and calculators. `visuals.tsx` uses the shared `Row` and composed glyph helper for selectable text.

Body cells are 18 by 32 pixels. Only page headings use three character rows. Scrolling is native.

The workflow builds the game and docs, then publishes `build/` to `gh-pages`. The runner is pinned to Ubuntu 24.04 for Playwright support.

Item and unit references resolve to the catalog anchors. Type references resolve to adjacent source documentation. Code fences accept a filename after the language and render with game popup sprites, line numbers and Copy.

The dev server serves the last completed build while a new build runs. A server event reloads connected documentation pages after the replacement is ready.

The dev server builds into `.docs-dev/`, separately from the static build, so running both does not replace files underneath the watcher.
