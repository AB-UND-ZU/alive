# Wiki Routes and Tools

The player pages live in `wiki/`; shared rendering lives in `src/wiki/`; the builder and browser checks live in `scripts/wiki/`. Review evidence lives in `wiki-review/`. The development chapter uses the Wiki group and `/development/wiki/` routes. The fixed header reads WIKI.

| Command | Result |
| --- | --- |
| `npm run wiki:dev` | Local preview and hot reload on port 4173 |
| `npm run wiki:types` | Refresh adjacent source declarations |
| `npm run wiki:build -- build/wiki` | Build the Pages subtree |
| `npm run wiki:test` | Generator and browser checks |

The CI workflow builds `build/wiki` after the production game. Source imports, generated type anchors, route groups, styles, font aliases, preview events and the original reference-file name use the same terminology. Standard DOM names and third-party URLs remain intact.

Verification passed: TypeScript, lint, 238 fast tests, 8 generator checks and all 80 browser checks. The rendered audit covered all 270 routes, 6,714 internal links and 5,805 anchors, with no broken destinations, duplicate prose/IDs, page overflow or runtime/HTTP errors.

Four built-site desktop/phone visits verified Welcome and a direct source route under `/alive/wiki/`. Header text, fonts, navigation and wrapping were visually inspected. Screenshots and route measurements: `/tmp/alive-wiki-rename-visual/`.

Review-path aliases preserve the original capture files referenced by the renamed reports; historical images still show their original captured UI.
