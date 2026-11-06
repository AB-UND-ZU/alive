# Documentation tools

The docs are static HTML generated from Markdown with Marked. Esbuild bundles the small interactive examples. The game and docs share npm dependencies; there is no Python documentation environment or client-side Markdown router.

## Preview locally

```sh
npm ci
npm run docs:dev
```

Open `http://127.0.0.1:4173`. Restart the command after editing Markdown, styles, or scenes. It rebuilds before serving. Pages work without JavaScript; only the interactive examples need it.

```sh
npm run docs:build
npm run docs:test
```

The default build is `.docs-build/`. For deployment, `node scripts/docs/build.mjs build/docs` places the site under the game's build directory. The build only allows those two output locations to avoid deleting source folders.

## Write a page

Add a Markdown file to `docs/` with one level-one title. The player chapter discovers those files. Important technical explanations belong beside their source as `filename.md`; the development chapter discovers Markdown in `src/` and includes this tools page.

Link Markdown files by relative path. The builder resolves them to HTML and rejects unknown page links. Put images in `docs/media/` and reference them with `media/name.png`. Use short headings, concrete descriptions, and tables when values need comparison.

The builder supplies the shared HTML shell, chapter navigation, heading links, font, and stylesheet. Authors do not write page components or HTML wrappers.

## Import an example

Use a fenced block with the language `scene` and one registered scene name, such as `movement`. `src/documentation/scenes.json` lists names. `scenes.ts` implements examples by importing the game harness, balancing tables, and sprite helpers. The builder rejects unknown scene names.

Every example gets Play, Auto/Pause, and Reset controls. World examples also have direction buttons; references have a native select. Nothing starts automatically. Offscreen or hidden-tab examples pause. Reset creates a fresh scene and stops the timer.

Reference examples browse current data; they do not simulate spending resources. World examples run real systems with HTML sprite layers. Keep that distinction visible in the player text.

## Verify in a browser

Install Chromium for Playwright once with `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a local Chromium executable. Then run `npm run docs:test`. The test runner starts its own docs server unless one is already available.

The browser suite checks game-feature examples and documentation behavior. Capture desktop and mobile screenshots after visual edits and inspect them against the game and PDF. The research page records the checked sources and screenshot locations.

## Publish with GitHub Actions

The existing Deployment workflow builds the game, runs the checks and browser suite, then builds documentation into `build/docs/` and publishes the combined `build/` folder to `gh-pages`. This preserves the game's root URL and the existing deploy-key setup. Docs appear at `https://ab-und-zu.github.io/alive/docs/`.

The workflow runs on a push to `main` or a manual dispatch. The repository needs its existing `ACTIONS_DEPLOY_KEY` secret and Pages configured to serve the `gh-pages` branch. The pull-request workflow builds and tests docs without publishing.

The [Marked renderer documentation](https://marked.js.org/using_pro) describes the small renderer hooks. [GitHub's publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) describes branch and workflow deployment.
