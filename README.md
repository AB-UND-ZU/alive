# Alive

A browser adventure game made from layered DOS characters and sixteen terminal colors. Built with TypeScript, React, Three.js, and an entity component system.

[Play](https://ab-und-zu.github.io/alive/) · [Field guide](https://ab-und-zu.github.io/alive/docs/)

![The start of an adventure](docs/media/game.png)

## Run locally

```sh
npm ci
npm start
```

## Read and preview the docs

Player documentation lives in [docs/](docs/index.md). Technical notes live beside the source files they explain. Both appear as separate chapters in the generated site.

```sh
npm run docs:dev
```

Open http://127.0.0.1:4173. Restart to rebuild after edits. `npm run docs:build` writes a static site to `.docs-build/`. See [documentation tools](src/documentation/index.md) for Markdown authoring, imported examples, browser checks, and GitHub Pages deployment.

The supplied `alive_Docs.pdf` is a design reference. The guide describes current code and marks unavailable features. [Research notes](src/documentation/scenes.md) record sources and visual evidence.

## Development

Read [AGENTS.md](AGENTS.md) before editing. Reuse the local style and game helpers, keep code easy to follow, and verify every change.

```sh
npm run check:fast
npm run test:all
npm run build
npx playwright install chromium
npm run docs:test
```

Fast checks cover types, lint, and small feature tests. The full suite includes generated levels and rendering. The documentation browser suite checks live examples, navigation, and responsive layout.

## Title images

After changing the package version, run `npm run media:titles` to regenerate the transparent `media/title-*.png` images. Requires ImageMagick 7 (`magick`). The script uses the bundled DOS font, game colors, and cell proportions.
